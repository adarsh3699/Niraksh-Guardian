import { Request, Response } from "express";
import prisma from "../db/prisma";
import logger from "../config/logger";
import redisClient from "../config/redis";

interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
	};
}

const PROFILE_CACHE_TTL_SECONDS = 15 * 60;

interface ProfileResponsePayload {
	user: {
		id: string;
		email: string;
		name: string | null;
		gender: string | null;
		languagePreference: string | null;
	};
	healthProfile: {
		id: string;
		bloodGroup: string | null;
		allergies: string[];
		chronicConditions: string[];
		emergencyContactName: string | null;
		emergencyContactPhone: string | null;
		emergencyContactEmail: string | null;
		healthRiskScore: number;
		city: string | null;
		state: string | null;
		createdAt: Date;
		updatedAt: Date;
	} | null;
	profileStats: {
		hasHealthProfile: boolean;
		allergiesCount: number;
		chronicConditionsCount: number;
		emergencyContactConfigured: boolean;
		completionPercent: number;
		riskBand: "low" | "moderate" | "high";
	};
}

const getProfileCacheKeys = (userId: string) => ({
	profile: `cache:profile:data:${userId}`,
	stats: `cache:profile:stats:${userId}`,
});

const writeProfileCache = async (
	cacheKeys: ReturnType<typeof getProfileCacheKeys>,
	responsePayload: ProfileResponsePayload,
	userId: string,
	logContext: string
) => {
	if (!redisClient.isOpen) {
		return;
	}

	try {
		await Promise.all([
			redisClient.set(
				cacheKeys.profile,
				JSON.stringify({ user: responsePayload.user, healthProfile: responsePayload.healthProfile }),
				{ EX: PROFILE_CACHE_TTL_SECONDS }
			),
			redisClient.set(cacheKeys.stats, JSON.stringify(responsePayload.profileStats), {
				EX: PROFILE_CACHE_TTL_SECONDS,
			}),
		]);
	} catch (cacheWriteError) {
		logger.warn({ err: cacheWriteError, userId }, logContext);
	}
};

const getRiskBand = (score: number): "low" | "moderate" | "high" => {
	if (score >= 70) return "high";
	if (score >= 35) return "moderate";
	return "low";
};

const buildProfileStats = (profile: ProfileResponsePayload["healthProfile"]) => {
	if (!profile) {
		return {
			hasHealthProfile: false,
			allergiesCount: 0,
			chronicConditionsCount: 0,
			emergencyContactConfigured: false,
			completionPercent: 0,
			riskBand: "low" as const,
		};
	}

	const completionFields = [
		!!profile.bloodGroup,
		(profile.allergies?.length ?? 0) > 0,
		(profile.chronicConditions?.length ?? 0) > 0,
		!!profile.emergencyContactName,
		!!profile.emergencyContactPhone,
		!!profile.city,
		!!profile.state,
	];

	const completedCount = completionFields.filter(Boolean).length;
	const completionPercent = Math.round((completedCount / completionFields.length) * 100);

	return {
		hasHealthProfile: true,
		allergiesCount: profile.allergies?.length ?? 0,
		chronicConditionsCount: profile.chronicConditions?.length ?? 0,
		emergencyContactConfigured: !!profile.emergencyContactName && !!profile.emergencyContactPhone,
		completionPercent,
		riskBand: getRiskBand(profile.healthRiskScore ?? 0),
	};
};

const buildProfileResponse = (user: {
	id: string;
	email: string;
	name: string | null;
	gender: string | null;
	languagePreference: string | null;
	patientHealthProfile: {
		id: string;
		bloodGroup: string | null;
		allergies: string[];
		chronicConditions: string[];
		emergencyContactName: string | null;
		emergencyContactPhone: string | null;
		emergencyContactEmail: string | null;
		healthRiskScore: number;
		city: string | null;
		state: string | null;
		createdAt: Date;
		updatedAt: Date;
	} | null;
}): ProfileResponsePayload => {
	const profile = user.patientHealthProfile
		? {
				id: user.patientHealthProfile.id,
				bloodGroup: user.patientHealthProfile.bloodGroup,
				allergies: user.patientHealthProfile.allergies,
				chronicConditions: user.patientHealthProfile.chronicConditions,
				emergencyContactName: user.patientHealthProfile.emergencyContactName,
				emergencyContactPhone: user.patientHealthProfile.emergencyContactPhone,
				emergencyContactEmail: user.patientHealthProfile.emergencyContactEmail,
				healthRiskScore: user.patientHealthProfile.healthRiskScore,
				city: user.patientHealthProfile.city,
				state: user.patientHealthProfile.state,
				createdAt: user.patientHealthProfile.createdAt,
				updatedAt: user.patientHealthProfile.updatedAt,
			}
		: null;

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			gender: user.gender,
			languagePreference: user.languagePreference,
		},
		healthProfile: profile,
		profileStats: buildProfileStats(profile),
	};
};

// Helper to calculate risk score
const calculateRiskScore = (chronicConditions: string[]): number => {
	let score = 0;
	// Basic logic: 10 points per condition
	if (chronicConditions && chronicConditions.length > 0) {
		score += chronicConditions.length * 10;
	}
	// Cap at 100
	return Math.min(score, 100);
};

export const getProfile = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });
		const cacheKeys = getProfileCacheKeys(userId);

		if (redisClient.isOpen) {
			try {
				const [cachedProfile, cachedStats] = await Promise.all([
					redisClient.get(cacheKeys.profile),
					redisClient.get(cacheKeys.stats),
				]);

				if (cachedProfile && cachedStats) {
					const profilePayload = JSON.parse(cachedProfile) as Omit<ProfileResponsePayload, "profileStats">;
					const statsPayload = JSON.parse(cachedStats) as ProfileResponsePayload["profileStats"];
					logger.info({ userId, cacheHit: true }, "Profile cache hit");
					return res.status(200).json({ ...profilePayload, profileStats: statsPayload });
				}
			} catch (cacheReadError) {
				logger.warn({ err: cacheReadError, userId }, "Profile cache read failed");
			}
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				gender: true,
				languagePreference: true,
				patientHealthProfile: true,
			},
		});

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const responsePayload = buildProfileResponse(user);
		await writeProfileCache(cacheKeys, responsePayload, userId, "Profile cache write failed");

		res.status(200).json(responsePayload);
	} catch (error) {
		logger.error({ err: error }, "Error fetching profile");
		res.status(500).json({ error: "Failed to fetch profile" });
	}
};

export const updateProfile = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const {
			// User-level fields
			name,
			gender,
			languagePreference,
			// Health profile fields
			bloodGroup,
			allergies,
			chronicConditions,
			emergencyContactName,
			emergencyContactPhone,
			emergencyContactEmail,
			city,
			state,
		} = req.body;

		// Update user-level fields if provided
		const userUpdateData: Record<string, unknown> = {};
		if (name !== undefined) userUpdateData.name = name;
		if (gender !== undefined) userUpdateData.gender = gender;
		if (languagePreference !== undefined) userUpdateData.languagePreference = languagePreference;
		const hasUserUpdates = Object.keys(userUpdateData).length > 0;

		const allergiesInput = Array.isArray(allergies) ? allergies : undefined;
		const chronicConditionsInput = Array.isArray(chronicConditions) ? chronicConditions : undefined;

		const needsExistingProfile = allergiesInput === undefined || chronicConditionsInput === undefined;

		const updatedResult = await prisma.$transaction(async (tx) => {
			const existingUser = await tx.user.findUnique({
				where: { id: userId },
				select: { id: true, email: true, name: true, gender: true, languagePreference: true },
			});

			if (!existingUser) {
				return null;
			}

			const updatedUser = hasUserUpdates
				? await tx.user.update({
						where: { id: userId },
						data: userUpdateData,
						select: { id: true, email: true, name: true, gender: true, languagePreference: true },
					})
				: existingUser;

			const existingProfile = needsExistingProfile
				? await tx.patientHealthProfile.findUnique({
						where: { userId },
						select: { allergies: true, chronicConditions: true },
					})
				: null;

			// Calculate risk score automatically
			const effectiveChronicConditions = chronicConditionsInput ?? existingProfile?.chronicConditions ?? [];
			const effectiveAllergies = allergiesInput ?? existingProfile?.allergies ?? [];
			const healthRiskScore = calculateRiskScore(effectiveChronicConditions);

			const profile = await tx.patientHealthProfile.upsert({
				where: { userId },
				update: {
					bloodGroup,
					allergies: allergiesInput,
					chronicConditions: chronicConditionsInput,
					emergencyContactName,
					emergencyContactPhone,
					emergencyContactEmail,
					city,
					state,
					healthRiskScore,
				},
				create: {
					userId,
					bloodGroup,
					allergies: effectiveAllergies,
					chronicConditions: effectiveChronicConditions,
					emergencyContactName,
					emergencyContactPhone,
					emergencyContactEmail,
					city,
					state,
					healthRiskScore,
				},
			});

			return { user: updatedUser, profile };
		});

		if (!updatedResult) {
			return res.status(404).json({ message: "User not found" });
		}

		const { user, profile } = updatedResult;

		const responsePayload = buildProfileResponse({
			...user,
			patientHealthProfile: {
				id: profile.id,
				bloodGroup: profile.bloodGroup,
				allergies: profile.allergies,
				chronicConditions: profile.chronicConditions,
				emergencyContactName: profile.emergencyContactName,
				emergencyContactPhone: profile.emergencyContactPhone,
				emergencyContactEmail: profile.emergencyContactEmail,
				healthRiskScore: profile.healthRiskScore,
				city: profile.city,
				state: profile.state,
				createdAt: profile.createdAt,
				updatedAt: profile.updatedAt,
			},
		});

		const cacheKeys = getProfileCacheKeys(userId);
		await writeProfileCache(cacheKeys, responsePayload, userId, "Profile cache write failed after update");

		res.status(200).json(responsePayload);
	} catch (error) {
		logger.error({ err: error }, "Error updating profile");
		res.status(500).json({ error: "Failed to update profile" });
	}
};

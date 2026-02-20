import { Request, Response } from "express";
import prisma from "../db/prisma";
import logger from "../config/logger";

interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
	};
}

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

		const profile = user.patientHealthProfile;

		res.status(200).json({
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				gender: user.gender,
				languagePreference: user.languagePreference,
			},
			healthProfile: profile
				? {
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
					}
				: null,
		});
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

		if (Object.keys(userUpdateData).length > 0) {
			await prisma.user.update({
				where: { id: userId },
				data: userUpdateData,
			});
		}

		// Calculate risk score automatically
		const healthRiskScore = calculateRiskScore(chronicConditions || []);

		const profile = await prisma.patientHealthProfile.upsert({
			where: { userId },
			update: {
				bloodGroup,
				allergies,
				chronicConditions,
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
				allergies,
				chronicConditions,
				emergencyContactName,
				emergencyContactPhone,
				emergencyContactEmail,
				city,
				state,
				healthRiskScore,
			},
		});

		// Fetch updated user for response
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, email: true, name: true, gender: true, languagePreference: true },
		});

		res.status(200).json({
			user: user
				? {
						id: user.id,
						email: user.email,
						name: user.name,
						gender: user.gender,
						languagePreference: user.languagePreference,
					}
				: null,
			healthProfile: {
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
	} catch (error) {
		logger.error({ err: error }, "Error updating profile");
		res.status(500).json({ error: "Failed to update profile" });
	}
};

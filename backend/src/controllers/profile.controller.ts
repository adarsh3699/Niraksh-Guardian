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

		const profile = await prisma.patientHealthProfile.findUnique({
			where: { userId },
		});

		if (!profile) {
			return res.status(404).json({ message: "Profile not found" });
		}

		res.status(200).json(profile);
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
			bloodGroup,
			allergies,
			chronicConditions,
			emergencyContactName,
			emergencyContactPhone,
			emergencyContactEmail,
		} = req.body;

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
				healthRiskScore,
			},
		});

		res.status(200).json(profile);
	} catch (error) {
		logger.error({ err: error }, "Error updating profile");
		res.status(500).json({ error: "Failed to update profile" });
	}
};

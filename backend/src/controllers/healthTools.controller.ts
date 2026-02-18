import { Request, Response } from "express";
import { analyzeMedicine, analyzePrescription, checkDrugInteraction } from "../services/ai/gemini";
import { uploadImage } from "../services/cloudinary/cloudinary";
import prisma from "../db/prisma";
import logger from "../config/logger";
import { ZodError } from "zod";
import { medicineAnalysisSchema, drugInteractionSchema } from "../validators/healthTools.schema";

interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
	};
}

// --- Medicine Analysis ---
export const analyzeMedicineController = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const { name } = medicineAnalysisSchema.parse(req.body);
		const file = (req as AuthenticatedRequest).file;

		if (!name && !file) {
			return res.status(400).json({ error: "Either medicine name or image is required" });
		}

		// Upload image to Cloudinary if provided
		let imageUrl: string | undefined;
		if (file) {
			imageUrl = await uploadImage(file.buffer, "niraksh_medicines");
		}

		// Analyze with AI
		const description = await analyzeMedicine(name, file?.buffer, file?.mimetype);

		// Save to history
		await prisma.medicineHistory.create({
			data: {
				userId,
				imageUrl: imageUrl || "",
				medicineName: name || null,
				analysisResult: { description },
			},
		});

		res.json({ description });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Medicine Analysis Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// --- Prescription Analysis ---
export const analyzePrescriptionController = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const files = (req as any).files as Express.Multer.File[];
		if (!files || files.length === 0) {
			return res.status(400).json({ error: "No prescription images uploaded" });
		}

		// Upload first image to Cloudinary for history
		const imageUrl = await uploadImage(files[0].buffer, "niraksh_prescriptions");

		// Prepare image buffers for AI
		const imageBuffers = files.map((f) => ({
			buffer: f.buffer,
			mimeType: f.mimetype,
		}));

		// Analyze with AI
		const { description, medicines } = await analyzePrescription(imageBuffers);

		// Extract text for history storage
		const extractedText = medicines.join(", ");

		// Save to history
		await prisma.prescriptionHistory.create({
			data: {
				userId,
				imageUrl,
				extractedText,
				analysisResult: { description, medicines },
			},
		});

		res.json({ description, medicines });
	} catch (error) {
		logger.error({ err: error }, "Prescription Analysis Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// --- Drug Interaction Check ---
export const checkDrugInteractionController = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const { medicines } = drugInteractionSchema.parse(req.body);

		// Analyze with AI
		const description = await checkDrugInteraction(medicines);

		// Save to history
		await prisma.drugInteractionHistory.create({
			data: {
				userId,
				drugs: medicines,
				interactionResult: { description },
			},
		});

		res.json({ description });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Drug Interaction Check Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

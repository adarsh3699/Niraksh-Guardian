import { Request, Response } from "express";
import prisma from "../db/prisma";
import logger from "../config/logger";
import { deleteImage, extractPublicId } from "../services/cloudinary/cloudinary";
import { requireAuthenticatedUserId } from "../types/auth";

// --- Fetch History ---

export const getMedicineHistory = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const history = await prisma.medicineHistory.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
		res.status(200).json(history);
	} catch (error) {
		logger.error({ err: error }, "Error fetching medicine history");
		res.status(500).json({ error: "Failed to fetch medicine history" });
	}
};

export const getPrescriptionHistory = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const history = await prisma.prescriptionHistory.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
		res.status(200).json(history);
	} catch (error) {
		logger.error({ err: error }, "Error fetching prescription history");
		res.status(500).json({ error: "Failed to fetch prescription history" });
	}
};

export const getDrugInteractionHistory = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const history = await prisma.drugInteractionHistory.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
		res.status(200).json(history);
	} catch (error) {
		logger.error({ err: error }, "Error fetching drug interaction history");
		res.status(500).json({ error: "Failed to fetch drug interaction history" });
	}
};

export const getSymptomHistory = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const history = await prisma.symptomAnalysisHistory.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
		res.status(200).json(history);
	} catch (error) {
		logger.error({ err: error }, "Error fetching symptom history");
		res.status(500).json({ error: "Failed to fetch symptom history" });
	}
};

// --- Delete History Item ---

export const deleteHistoryItem = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const { type } = req.params;
		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!id) return res.status(400).json({ error: "Invalid id" });

		// Use a union type for the dynamic Prisma model delegate
		type PrismaModelDelegate = {
			findUnique: (args: {
				where: { id: string };
			}) => Promise<{ id: string; userId: string; imageUrl?: string | null } | null>;
			delete: (args: { where: { id: string } }) => Promise<unknown>;
		};

		let model: PrismaModelDelegate;

		// Determine model based on type
		switch (type) {
			case "medicine":
				model = prisma.medicineHistory as unknown as PrismaModelDelegate;
				break;
			case "prescription":
				model = prisma.prescriptionHistory as unknown as PrismaModelDelegate;
				break;
			case "interaction":
				model = prisma.drugInteractionHistory as unknown as PrismaModelDelegate;
				break;
			case "symptom":
				model = prisma.symptomAnalysisHistory as unknown as PrismaModelDelegate;
				break;
			default:
				return res.status(400).json({ error: "Invalid history type" });
		}

		// Find record and ensure ownership
		const record = await model.findUnique({ where: { id } });

		if (!record) {
			return res.status(404).json({ error: "Record not found" });
		}

		if (record.userId !== userId) {
			return res.status(403).json({ error: "Unauthorized access to this record" });
		}

		// Delete Image from Cloudinary if exists
		if (record.imageUrl) {
			const publicId = extractPublicId(record.imageUrl);
			if (publicId) {
				try {
					await deleteImage(publicId);
				} catch (imgError) {
					logger.warn(
						{ err: imgError, publicId },
						"Failed to delete image from Cloudinary, continuing with DB deletion"
					);
				}
			}
		}

		// Delete from DB
		await model.delete({ where: { id } });

		res.status(200).json({ message: "Record deleted successfully" });
	} catch (error) {
		logger.error({ err: error, type: req.params.type, id: req.params.id }, "Error deleting history item");
		res.status(500).json({ error: "Failed to delete history item" });
	}
};

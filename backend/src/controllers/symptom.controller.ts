import { Request, Response } from "express";
import { symptomDiagnosisSchema, chatSummarySchema } from "../validators/symptom.schema";
import { diagnoseSymptoms, summarizeChatForDoctor } from "../services/ai/gemini";
import { ZodError } from "zod";
import logger from "../config/logger";
import prisma from "../db/prisma";
import { uploadFile } from "../services/cloudinary/cloudinary";

interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
	};
}

export const symptomDiagnosisController = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		// Handle multipart/form-data where symptoms might be a JSON string
		if (typeof req.body.symptoms === "string") {
			try {
				req.body.symptoms = JSON.parse(req.body.symptoms);
			} catch {
				// ignore, let validation fail if invalid
			}
		}

		const { symptoms, language } = symptomDiagnosisSchema.parse(req.body);

		const imageBuffer = req.file?.buffer;
		const mimeType = req.file?.mimetype;

		const analysis = await diagnoseSymptoms(symptoms, language, imageBuffer, mimeType);

		// Save to SymptomAnalysisHistory
		let imageUrl: string | undefined;
		if (imageBuffer && mimeType) {
			try {
				const { url } = await uploadFile(imageBuffer, "niraksh_symptoms", "image");
				imageUrl = url;
			} catch (uploadErr) {
				logger.error({ err: uploadErr }, "Failed to upload symptom image to Cloudinary");
			}
		}

		try {
			await prisma.symptomAnalysisHistory.create({
				data: {
					userId,
					symptoms,
					imageUrl: imageUrl || null,
					predictedConditions: analysis.possibleConditions || [],
					urgencyLevel: analysis.urgency || "Unknown",
					// DB column is a single string — store comma-joined list
					recommendedSpecialist: analysis.recommendedSpecialists?.join(", ") || "General Physician",
				},
			});
		} catch (dbErr) {
			// Log but don't fail the response — analysis was successful
			logger.error({ err: dbErr }, "Failed to save symptom analysis to history");
		}

		res.json(analysis);
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Symptom Analysis Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const chatSummaryController = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const { chatId } = chatSummarySchema.parse(req.body);

		// Verify chat exists and belongs to user
		const chat = await prisma.chat.findUnique({
			where: { id: chatId },
			include: { messages: { orderBy: { createdAt: "asc" } } },
		});

		if (!chat || chat.userId !== userId) {
			return res.status(404).json({ error: "Chat not found" });
		}

		if (chat.messages.length === 0) {
			return res.status(400).json({ error: "Chat has no messages to summarize" });
		}

		const messages = chat.messages.map((m) => ({ role: m.role, content: m.content }));
		const result = await summarizeChatForDoctor(messages);

		res.json(result);
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Summarize Symptoms Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

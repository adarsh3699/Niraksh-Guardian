import { Request, Response } from "express";
import { analyzeSymptomsSchema } from "../validators/symptom.schema";
import { analyzeSymptoms } from "../services/ai/gemini";
import { ZodError } from "zod";
import logger from "../config/logger";

export const analyzeSymptomsController = async (req: Request, res: Response) => {
	try {
		// Handle multipart/form-data where symptoms might be a JSON string
		if (typeof req.body.symptoms === "string") {
			try {
				req.body.symptoms = JSON.parse(req.body.symptoms);
			} catch (e) {
				// ignore, let validation fail if invalid
			}
		}

		const { symptoms, language } = analyzeSymptomsSchema.parse(req.body);

		const imageBuffer = req.file?.buffer;
		const mimeType = req.file?.mimetype;

		const analysis = await analyzeSymptoms(symptoms, language, imageBuffer, mimeType);

		res.json(analysis);
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Symptom Analysis Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

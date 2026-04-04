import { Request, Response } from "express";
import { symptomRelationshipSchema } from "../validators/symptom.schema";
import {
	extractSymptoms,
	generateFullAnalysis,
	generateSuggestionsWithDiagnosis,
} from "../services/ai/symptomAnalysis.service";
import { ZodError } from "zod";
import logger from "../config/logger";
import prisma from "../db/prisma";
import { uploadFile } from "../services/cloudinary/cloudinary";
import { Prisma } from "../generated/prisma/client";
import { requireAuthenticatedUserId } from "../types/auth";

export const symptomRelationshipController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const { input } = symptomRelationshipSchema.parse(req.body);

		const imageBuffer = req.file?.buffer;
		const mimeType = req.file?.mimetype;

		// Upload to Cloudinary if image exists (do this asynchronously)
		let imageUrlPromise: Promise<string | undefined> = Promise.resolve(undefined);
		if (imageBuffer && mimeType) {
			imageUrlPromise = uploadFile(imageBuffer, "niraksh_symptoms", "image")
				.then((res) => res.url)
				.catch((uploadErr) => {
					logger.error({ err: uploadErr }, "Failed to upload symptom image to Cloudinary");
					return undefined;
				});
		}

		// Call 1: Extract symptoms from free text + image
		const extracted = await extractSymptoms(input, imageBuffer, mimeType);

		if (extracted.symptoms.length < 2) {
			// Call 2: Combined suggestions + diagnosis
			const combined = await generateSuggestionsWithDiagnosis(
				extracted.symptoms.length > 0 ? extracted.symptoms : [input],
				imageBuffer,
				mimeType
			);

			// Save to history (fire-and-forget)
			imageUrlPromise.then((imageUrl) => {
				prisma.symptomAnalysisHistory
					.create({
						data: {
							userId,
							symptoms: extracted.symptoms.length > 0 ? extracted.symptoms : [input],
							imageUrl: imageUrl || null,
							duration: extracted.duration,
							needMoreInfo: true,
							suggestedSymptoms: combined.suggestions || [],
							followUpMessage: "Help us understand better — do you also have any of these?",
							predictedConditions: combined.diagnosis.possibleConditions || [],
							urgencyLevel: combined.diagnosis.urgency || "Unknown",
							recommendedSpecialist:
								combined.diagnosis.recommendedSpecialists?.join(", ") || "General Physician",
							severity: combined.diagnosis.severity || null,
							reasoning: combined.diagnosis.reasoning || null,
							homeRemedies: combined.diagnosis.homeRemedies || [],
						},
					})
					.catch((err: unknown) => logger.error({ err }, "Failed to save symptom analysis to history"));
			});

			return res.json({
				symptoms: extracted.symptoms,
				duration: extracted.duration,
				needMoreInfo: true,
				suggestedSymptoms: combined.suggestions,
				message: "Help us understand better — do you also have any of these?",
				analysis: combined.diagnosis,
			});
		}

		// Call 2: Combined relationship + insight + specialist + diagnosis (1 Gemini call instead of 4)
		const fullAnalysis = await generateFullAnalysis(extracted.symptoms, imageBuffer, mimeType);

		// Save to history (fire-and-forget)
		imageUrlPromise.then((imageUrl) => {
			prisma.symptomAnalysisHistory
				.create({
					data: {
						userId,
						symptoms: extracted.symptoms,
						imageUrl: imageUrl || null,
						duration: extracted.duration,
						needMoreInfo: false,
						suggestedSymptoms: [],
						followUpMessage: null,
						relationship: fullAnalysis.relationship as unknown as Prisma.InputJsonValue,
						insight: fullAnalysis.insight as unknown as Prisma.InputJsonValue,
						predictedConditions: fullAnalysis.diagnosis.possibleConditions || [],
						urgencyLevel: fullAnalysis.diagnosis.urgency || "Unknown",
						recommendedSpecialist:
							fullAnalysis.diagnosis.recommendedSpecialists?.join(", ") || "General Physician",
						severity: fullAnalysis.diagnosis.severity || null,
						reasoning: fullAnalysis.diagnosis.reasoning || null,
						homeRemedies: fullAnalysis.diagnosis.homeRemedies || [],
					},
				})
				.catch((err: unknown) => logger.error({ err }, "Failed to save symptom analysis to history"));
		});

		return res.json({
			symptoms: extracted.symptoms,
			duration: extracted.duration,
			needMoreInfo: false,
			relationship: fullAnalysis.relationship,
			insight: fullAnalysis.insight,
			analysis: fullAnalysis.diagnosis,
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: "Validation failed", validationErrors: error.issues });
		}
		logger.error({ err: error }, "Symptom Analysis Failed");
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

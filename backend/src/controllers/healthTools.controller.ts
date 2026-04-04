import { Request, Response } from "express";
import {
	analyzeMedicine,
	analyzePrescription,
	checkDrugInteraction,
	checkPersonalizedDrugInteraction,
} from "../services/ai/gemini";
import { uploadImage } from "../services/cloudinary/cloudinary";
import prisma from "../db/prisma";
import logger from "../config/logger";
import { ZodError } from "zod";
import { medicineAnalysisSchema, drugInteractionSchema } from "../validators/healthTools.schema";
import { AuthenticatedRequest, requireAuthenticatedUserId } from "../types/auth";

const HISTORY_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

const normalizeMedicineSet = (values: string[]): string[] => {
	const map = new Map<string, string>();
	for (const value of values) {
		const trimmed = value.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (!map.has(key)) map.set(key, trimmed);
	}
	return Array.from(map.values());
};

const extractMedicinesFromPrescriptionResult = (analysisResult: unknown): string[] => {
	if (!analysisResult || typeof analysisResult !== "object" || Array.isArray(analysisResult)) return [];

	const medicines = (analysisResult as { medicines?: unknown }).medicines;
	if (!Array.isArray(medicines)) return [];

	return medicines.filter((item): item is string => typeof item === "string").map((item) => item.trim());
};

const extractStringsDeep = (value: unknown, out: Set<string>) => {
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed) out.add(trimmed);
		return;
	}

	if (Array.isArray(value)) {
		for (const item of value) extractStringsDeep(item, out);
		return;
	}

	if (value && typeof value === "object") {
		for (const nested of Object.values(value as Record<string, unknown>)) {
			extractStringsDeep(nested, out);
		}
	}
};

// --- Medicine Analysis ---
export const analyzeMedicineController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

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
			return res.status(400).json({ error: "Validation failed", validationErrors: error.issues });
		}
		logger.error({ err: error }, "Medicine Analysis Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// --- Prescription Analysis ---
export const analyzePrescriptionController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

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
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const { medicines } = drugInteractionSchema.parse(req.body);
		const cleanedMedicines = normalizeMedicineSet(medicines);

		if (cleanedMedicines.length === 0) {
			return res.status(400).json({ error: "At least one medicine is required" });
		}

		if (cleanedMedicines.length === 1) {
			const selectedMedicine = cleanedMedicines[0];
			const oneYearAgo = new Date(Date.now() - HISTORY_WINDOW_MS);

			const [prescriptionHistory, symptomHistory] = await Promise.all([
				prisma.prescriptionHistory.findMany({
					where: { userId, createdAt: { gte: oneYearAgo } },
					select: {
						analysisResult: true,
						extractedText: true,
					},
				}),
				prisma.symptomAnalysisHistory.findMany({
					where: { userId, createdAt: { gte: oneYearAgo } },
					select: {
						predictedConditions: true,
						symptoms: true,
					},
				}),
			]);

			const historicalMedicineCandidates: string[] = [];
			for (const row of prescriptionHistory) {
				const extracted = extractMedicinesFromPrescriptionResult(row.analysisResult);
				if (extracted.length > 0) {
					historicalMedicineCandidates.push(...extracted);
					continue;
				}

				historicalMedicineCandidates.push(
					...row.extractedText
						.split(",")
						.map((item) => item.trim())
						.filter(Boolean)
				);
			}

			const historicalMedicines = normalizeMedicineSet(historicalMedicineCandidates)
				.filter((name) => name.toLowerCase() !== selectedMedicine.toLowerCase())
				.slice(0, 20);

			if (historicalMedicines.length === 0) {
				const description = `## Checking ${selectedMedicine} against your prescription history\n\nNo historical prescriptions found in the last 1 year. Add at least one more medicine to check direct interactions, or upload a prescription to build your personalized history.`;

				await prisma.drugInteractionHistory.create({
					data: {
						userId,
						drugs: cleanedMedicines,
						interactionResult: { description, mode: "personalized_no_history" },
					},
				});

				return res.json({ description, mode: "personalized" });
			}

			const conditionSet = new Set<string>();
			const symptomSet = new Set<string>();

			for (const row of symptomHistory) {
				for (const symptom of row.symptoms) {
					const trimmed = symptom.trim();
					if (trimmed) symptomSet.add(trimmed);
				}
				extractStringsDeep(row.predictedConditions, conditionSet);
			}

			const context = {
				conditions: Array.from(conditionSet).slice(0, 15),
				symptoms: Array.from(symptomSet).slice(0, 20),
			};

			const personalized = await checkPersonalizedDrugInteraction(selectedMedicine, historicalMedicines, context);

			// Convert tabs array to markdown format with proper safety checks
			const markdownContent = personalized.tabs
				.map((tab) => {
					const titleStr = typeof tab.title === "string" ? tab.title : String(tab.title || "");
					const contentStr =
						typeof tab.content === "string" ? tab.content : JSON.stringify(tab.content || "");
					return `## ${titleStr}\n\n${contentStr}`;
				})
				.join("\n\n");

			const description = `## Checking ${selectedMedicine} against your prescription history\n\n${markdownContent}`;

			await prisma.drugInteractionHistory.create({
				data: {
					userId,
					drugs: [selectedMedicine, ...historicalMedicines],
					interactionResult: {
						description,
						mode: "personalized",
						selectedMedicine,
						historicalMedicines,
						context,
						rawTabs: personalized.tabs,
					},
				},
			});

			return res.json({ description, mode: "personalized" });
		}

		// Analyze with AI
		const tabsResponse = await checkDrugInteraction(cleanedMedicines);

		// Convert tabs array to markdown format with proper safety checks
		const description = tabsResponse.tabs
			.map((tab) => {
				const titleStr = typeof tab.title === "string" ? tab.title : String(tab.title || "");
				const contentStr = typeof tab.content === "string" ? tab.content : JSON.stringify(tab.content || "");
				return `## ${titleStr}\n\n${contentStr}`;
			})
			.join("\n\n");

		// Save to history
		await prisma.drugInteractionHistory.create({
			data: {
				userId,
				drugs: cleanedMedicines,
				interactionResult: {
					description,
					mode: "direct",
					severity: tabsResponse.severity,
					riskScore: tabsResponse.riskScore,
					rawTabs: tabsResponse.tabs,
				},
			},
		});

		res.json({
			description,
			mode: "direct",
			severity: tabsResponse.severity,
			riskScore: tabsResponse.riskScore,
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: "Validation failed", validationErrors: error.issues });
		}
		logger.error({ err: error }, "Drug Interaction Check Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

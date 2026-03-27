import { z } from "zod";

export const symptomDiagnosisSchema = z.object({
	symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
	language: z.string().optional().default("en"),
});

export const chatSummarySchema = z.object({
	chatId: z.string().min(1, "Chat ID is required"),
});

export const symptomRelationshipSchema = z.object({
	input: z.string().trim().max(2000, "Input must be 2000 characters or fewer").optional().default(""),
});

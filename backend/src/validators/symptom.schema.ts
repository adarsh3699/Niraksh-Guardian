import { z } from "zod";

export const analyzeSymptomsSchema = z.object({
	symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
	language: z.string().optional().default("en"),
});

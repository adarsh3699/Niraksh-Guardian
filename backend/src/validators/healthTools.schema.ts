import { z } from "zod";

export const medicineAnalysisSchema = z.object({
	name: z.string().min(1, "Medicine name is required").max(200).optional(),
});

export const drugInteractionSchema = z.object({
	medicines: z.array(z.string().min(1)).min(1, "At least one medicine is required for interaction check"),
});

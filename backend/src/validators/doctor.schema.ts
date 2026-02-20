import { z } from "zod";

export const getDoctorsSchema = z.object({
	query: z.object({
		search: z.string().optional(),
		specialization: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		minFee: z
			.string()
			.optional()
			.transform((val) => (val ? parseInt(val, 10) : undefined))
			.pipe(z.number().int().min(0).optional()),
		maxFee: z
			.string()
			.optional()
			.transform((val) => (val ? parseInt(val, 10) : undefined))
			.pipe(z.number().int().min(0).optional()),
		sortBy: z.enum(["name", "experience", "fee", "rating"]).optional().default("rating"),
		order: z.enum(["asc", "desc"]).optional().default("desc"),
		page: z
			.string()
			.optional()
			.transform((val) => Math.max(1, val ? parseInt(val, 10) : 1)),
		limit: z
			.string()
			.optional()
			.transform((val) => Math.min(50, Math.max(1, val ? parseInt(val, 10) : 10))),
		/** Comma-separated condition/tag keywords to compute relevance score against doctor tags */
		matchTags: z.string().optional(),
		/** User's city for location-based boosting */
		userCity: z.string().optional(),
		/** User's state for location-based boosting */
		userState: z.string().optional(),
	}),
});

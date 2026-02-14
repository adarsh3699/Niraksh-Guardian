import { z } from "zod";

export const getDoctorsSchema = z.object({
	query: z.object({
		search: z.string().optional(),
		specialization: z.string().optional(),
		location: z.string().optional(),
		page: z
			.string()
			.optional()
			.transform((val) => (val ? parseInt(val, 10) : 1)),
		limit: z
			.string()
			.optional()
			.transform((val) => (val ? parseInt(val, 10) : 10)),
	}),
});

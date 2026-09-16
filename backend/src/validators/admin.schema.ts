import { z } from "zod";

export const doctorApplicationReviewSchema = z.object({
	status: z.enum(["APPROVED", "REJECTED"]),
	note: z.string().trim().max(1000).optional(),
});

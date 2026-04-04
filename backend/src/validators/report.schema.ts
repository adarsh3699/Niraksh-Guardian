import { z } from "zod";

const reportSourceEnum = z.enum(["symptoms", "prescriptions", "medicines", "drugInteractions", "chatHistory"]);

export const healthReportRequestSchema = z.object({
	sources: z.array(reportSourceEnum).optional(),
});

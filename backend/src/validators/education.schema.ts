import { z } from "zod";

export const educationSchema = z.object({
	topic: z.string().min(1, "Topic is required"),
	language: z.string().optional().default("en"),
});

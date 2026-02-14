import { z } from "zod";

export const createChatSchema = z.object({
	title: z.string().min(1, "Title is required").max(100, "Title is too long"),
	language: z.enum(["en", "hi", "bn", "te", "mr", "ta", "ur", "gu", "kn", "ml", "pa"]).optional().default("en"), // Multi-language support
});

export const sendMessageSchema = z.object({
	content: z.string().min(1, "Message content is required"),
	language: z.string().optional(), // Optional override for specific message
});

export const updateChatSchema = z.object({
	title: z.string().min(1).max(100).optional(),
});

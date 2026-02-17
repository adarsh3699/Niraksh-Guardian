import { Request, Response } from "express"; // Explicit import
import { PrismaClient } from "@prisma/client";
import { createChatSchema, sendMessageSchema } from "../validators/chat.schema";
import { ZodError } from "zod";
import logger from "../config/logger";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
	};
}

// --- Chat Management ---

export const createChat = async (req: Request, res: any) => {
	try {
		// Explicitly cast req to AuthenticatedRequest
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const { title, language } = createChatSchema.parse(req.body);

		const chat = await prisma.chat.create({
			data: {
				userId,
				title,
				// We might want to store language preference in the chat or user profile
				// For now, assuming it's used for the session context
			},
		});

		// If language provided, update user preference (optional, based on requirements)
		if (language) {
			await prisma.user.update({
				where: { id: userId },
				data: { languagePreference: language },
			});
		}

		res.status(201).json(chat);
	} catch (error) {
		if (error instanceof ZodError) {
			res.status(400).json({ error: error.issues });
			return;
		}
		logger.error({ err: error }, "Failed to create chat");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getChats = async (req: Request, res: any) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const chats = await prisma.chat.findMany({
			where: { userId },
			orderBy: { updatedAt: "desc" },
			include: {
				messages: {
					take: 1,
					orderBy: { createdAt: "desc" },
				},
			},
		});

		res.json(chats);
	} catch (error) {
		logger.error({ err: error }, "Failed to get chats");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getChatHistory = async (req: Request, res: any) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		const chatId = req.params.chatId as string;
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const chat = await prisma.chat.findUnique({
			where: { id: chatId },
		});

		if (!chat || chat.userId !== userId) {
			res.status(404).json({ error: "Chat not found" });
			return;
		}

		const messages = await prisma.message.findMany({
			where: { chatId },
			orderBy: { createdAt: "asc" },
		});

		res.json(messages);
	} catch (error) {
		logger.error({ err: error }, "Failed to get chat history");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const deleteChat = async (req: Request, res: any) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		// Fix chatId typing
		const chatId = req.params.chatId as string;
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const chat = await prisma.chat.findUnique({
			where: { id: chatId },
		});

		if (!chat || chat.userId !== userId) {
			res.status(404).json({ error: "Chat not found" });
			return;
		}

		await prisma.chat.delete({
			where: { id: chatId },
		});

		res.json({ message: "Chat deleted successfully" });
	} catch (error) {
		logger.error({ err: error }, "Failed to delete chat");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

import { generateAIResponse } from "../services/ai/gemini";

export const sendMessage = async (req: Request, res: any) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		const chatId = req.params.chatId as string;
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		// Handle optional image file
		// Safe access to file, assuming multer middleware usage
		const file = (req as any).file;

		const { content, language } = sendMessageSchema.parse(req.body);

		// 1. Verify Chat Ownership
		const chat = await prisma.chat.findUnique({
			where: { id: chatId },
			include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } }, // Limit context window
		});

		if (!chat || chat.userId !== userId) {
			return res.status(404).json({ error: "Chat not found" });
		}

		// 2. Save User Message
		const userMessage = await prisma.message.create({
			data: {
				chatId,
				role: "user",
				content: file ? `[Image Uploaded] ${content}` : content, // Note image presence in DB history
			},
		});

		// 3. Generate AI Response
		// Format history for the service
		const historyForAI = chat.messages.map((m: any) => ({ role: m.role, content: m.content }));

		// Determine language preference (message override > user preference > default en)
		// Retrieve User's preference if not provided in message
		let targetLanguage = language;
		if (!targetLanguage) {
			const user = await prisma.user.findUnique({ where: { id: userId }, select: { languagePreference: true } });
			targetLanguage = user?.languagePreference || "en";
		}

		const aiResponseText = await generateAIResponse(
			historyForAI,
			content,
			targetLanguage,
			file?.buffer,
			file?.mimetype
		);

		// 4. Save AI Response
		const aiMessage = await prisma.message.create({
			data: {
				chatId,
				role: "model",
				content: aiResponseText,
			},
		});

		res.json({ userMessage, aiMessage });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Failed to send message");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

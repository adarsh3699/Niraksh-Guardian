import { Request, Response } from "express";
import { Message } from "../generated/prisma/client";
import { createChatSchema, sendMessageSchema, updateChatSchema } from "../validators/chat.schema";
import { ZodError } from "zod";
import logger from "../config/logger";
import prisma from "../db/prisma";
import { generateAIResponse, generateAIResponseStream } from "../services/ai/gemini";

interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
	};
}

const mapHistoryForAI = (messages: Message[]) => messages.map((m) => ({ role: m.role, content: m.content }));

const getStoredMessageContent = (content: string, file?: unknown) => (file ? `[Image Uploaded] ${content}` : content);

const resolveTargetLanguage = async (userId: string, language?: string) => {
	if (language) {
		return language;
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { languagePreference: true },
	});

	return user?.languagePreference || "en";
};

// --- Chat Management ---

export const createChat = async (req: Request, res: Response) => {
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

export const getChats = async (req: Request, res: Response) => {
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

export const getChatHistory = async (req: Request, res: Response) => {
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

export const deleteChat = async (req: Request, res: Response) => {
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

// --- Chat Update ---

export const updateChat = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		const chatId = req.params.chatId as string;
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const { title } = updateChatSchema.parse(req.body);

		const chat = await prisma.chat.findUnique({
			where: { id: chatId },
		});

		if (!chat || chat.userId !== userId) {
			res.status(404).json({ error: "Chat not found" });
			return;
		}

		const updatedChat = await prisma.chat.update({
			where: { id: chatId },
			data: { ...(title && { title }) },
		});

		res.json(updatedChat);
	} catch (error) {
		if (error instanceof ZodError) {
			res.status(400).json({ error: error.issues });
			return;
		}
		logger.error({ err: error }, "Failed to update chat");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const sendMessage = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		const chatId = req.params.chatId as string;
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		// Handle optional image file
		// Safe access to file, assuming multer middleware usage
		const file = (req as AuthenticatedRequest).file;

		const { content, language } = sendMessageSchema.parse(req.body);

		// 1. Verify Chat Ownership
		const chat = await prisma.chat.findUnique({
			where: { id: chatId },
		});

		if (!chat || chat.userId !== userId) {
			return res.status(404).json({ error: "Chat not found" });
		}

		const recentMessages = await prisma.message.findMany({
			where: { chatId },
			orderBy: { createdAt: "asc" },
			take: 20,
		});

		// 2. Save User Message
		const userMessage = await prisma.message.create({
			data: {
				chatId,
				role: "user",
				content: getStoredMessageContent(content, file),
			},
		});

		// 3. Generate AI Response
		// Format history for the service
		const historyForAI = mapHistoryForAI(recentMessages);
		const targetLanguage = await resolveTargetLanguage(userId, language);

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

export const sendMessageStream = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		const chatId = req.params.chatId as string;
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const file = (req as AuthenticatedRequest).file;
		const { content, language } = sendMessageSchema.parse(req.body);

		const chat = await prisma.chat.findUnique({ where: { id: chatId } });
		if (!chat || chat.userId !== userId) {
			res.status(404).json({ error: "Chat not found" });
			return;
		}

		const recentMessages = await prisma.message.findMany({
			where: { chatId },
			orderBy: { createdAt: "asc" },
			take: 20,
		});

		const userMessage = await prisma.message.create({
			data: {
				chatId,
				role: "user",
				content: getStoredMessageContent(content, file),
			},
		});

		const aiMessage = await prisma.message.create({
			data: {
				chatId,
				role: "model",
				content: "",
			},
		});

		const targetLanguage = await resolveTargetLanguage(userId, language);
		const historyForAI = mapHistoryForAI(recentMessages);

		res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
		res.setHeader("Cache-Control", "no-cache, no-transform");
		res.setHeader("Connection", "keep-alive");
		res.setHeader("X-Accel-Buffering", "no");
		res.flushHeaders?.();
		res.socket?.setNoDelay(true);

		const writeEvent = (payload: unknown) => {
			res.write(`data: ${JSON.stringify(payload)}\n\n`);
		};

		// Send an initial heartbeat comment to encourage immediate flush on some proxies.
		res.write(`: stream-open ${Date.now()}\n\n`);

		writeEvent({ type: "ack", userMessage, aiMessage });

		let aiResponseText = "";
		for await (const delta of generateAIResponseStream(
			historyForAI,
			content,
			targetLanguage,
			file?.buffer,
			file?.mimetype
		)) {
			aiResponseText += delta;
			writeEvent({ type: "chunk", delta });
		}

		const updatedAiMessage = await prisma.message.update({
			where: { id: aiMessage.id },
			data: { content: aiResponseText },
		});

		writeEvent({ type: "done", aiMessage: updatedAiMessage });
		res.end();
	} catch (error) {
		if (error instanceof ZodError) {
			res.status(400).json({ error: error.issues });
			return;
		}
		logger.error({ err: error }, "Failed to stream message");
		if (!res.headersSent) {
			res.status(500).json({ error: "Internal Server Error" });
			return;
		}
		res.write(`data: ${JSON.stringify({ type: "error", error: "Internal Server Error" })}\n\n`);
		res.end();
	}
};

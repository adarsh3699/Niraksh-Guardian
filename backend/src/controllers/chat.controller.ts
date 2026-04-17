import { Request, Response } from "express";
import { Message } from "../generated/prisma/client";
import { createChatSchema, sendMessageSchema, updateChatSchema } from "../validators/chat.schema";
import logger from "../config/logger";
import prisma from "../db/prisma";
import { GeminiStreamError } from "../services/ai/gemini";
import { generateWithGemma } from "../services/ai/llm";
import { AuthenticatedRequest, requireAuthenticatedUserId } from "../types/auth";
import { handleControllerError } from "../utils/controllerError";

const getStoredMessageContent = (content: string, file?: unknown) =>
	file ? `[Image Uploaded] ${content}` : content;

const STREAM_MIN_TOKEN_TTL_SECONDS = 60;

const hasSufficientStreamTokenTtl = (req: Request): boolean => {
	const authReq = req as Request & { user?: { exp?: number } };
	const exp = authReq.user?.exp;
	if (!exp) return true;
	const nowSeconds = Math.floor(Date.now() / 1000);
	return exp - nowSeconds > STREAM_MIN_TOKEN_TTL_SECONDS;
};

type StreamErrorPayload = {
	type: "error";
	error: string;
	code: "RESOURCE_EXHAUSTED" | "INTERNAL_STREAM_ERROR";
	retryable: boolean;
	retryAfterSeconds?: number;
	statusCode: number;
};

const toStreamErrorPayload = (error: unknown): StreamErrorPayload => {
	if (error instanceof GeminiStreamError) {
		return {
			type: "error",
			error: error.message,
			code: error.code === "RESOURCE_EXHAUSTED" ? "RESOURCE_EXHAUSTED" : "INTERNAL_STREAM_ERROR",
			retryable: error.retryable,
			retryAfterSeconds: error.retryAfterSeconds,
			statusCode: error.code === "RESOURCE_EXHAUSTED" ? 429 : 500,
		};
	}

	return {
		type: "error",
		error: "Internal Server Error",
		code: "INTERNAL_STREAM_ERROR",
		retryable: false,
		statusCode: 500,
	};
};

// --- Helper Functions ---

const buildFormattedPrompt = (previousMessages: Message[], currentMessage: string): string => {
	const previousContext = previousMessages
		.map((m) => `${m.role === "user" ? "Patient" : "AI Assistant"}: ${m.content}`)
		.join("\n");

	const contextSection = previousContext.trim()
		? `Previous conversation:\n${previousContext}\n\n`
		: "";

	return `${contextSection}Current user query:\n${currentMessage}`;
};

const verifyChatOwnership = async (chatId: string, userId: string) => {
	const chat = await prisma.chat.findUnique({
		where: { id: chatId },
	});

	if (!chat || chat.userId !== userId) {
		return null;
	}
	return chat;
};

// --- Chat Management ---

export const createChat = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const { title, language } = createChatSchema.parse(req.body);

		const chat = await prisma.chat.create({
			data: {
				userId,
				title,
			},
		});

		if (language) {
			await prisma.user.update({
				where: { id: userId },
				data: { languagePreference: language },
			});
		}

		res.status(201).json(chat);
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to create chat" });
	}
};

export const getChats = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

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
		handleControllerError({ error, res, logger, context: "Failed to get chats" });
	}
};

export const getChatHistory = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		const chatId = req.params.chatId as string;
		if (!userId) return;

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
		handleControllerError({ error, res, logger, context: "Failed to get chat history" });
	}
};

export const deleteChat = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		const chatId = req.params.chatId as string;
		if (!userId) return;

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
		handleControllerError({ error, res, logger, context: "Failed to delete chat" });
	}
};

// --- Chat Update ---

export const updateChat = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		const chatId = req.params.chatId as string;
		if (!userId) return;

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
		handleControllerError({ error, res, logger, context: "Failed to update chat" });
	}
};

export const sendMessage = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		const chatId = req.params.chatId as string;
		if (!userId) return;

		const file = (req as AuthenticatedRequest).file;
		const { content } = sendMessageSchema.parse(req.body);

		const chat = await verifyChatOwnership(chatId, userId);
		if (!chat) {
			return res.status(404).json({ error: "Chat not found" });
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

		const previousMessages = recentMessages.slice(-3);
		const formattedPrompt = buildFormattedPrompt(previousMessages, content);

		const aiResponseText = await generateWithGemma(formattedPrompt);

		const aiMessage = await prisma.message.create({
			data: {
				chatId,
				role: "model",
				content: aiResponseText,
			},
		});

		res.json({ userMessage, aiMessage });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to send message" });
	}
};

export const sendMessageStream = async (req: Request, res: Response) => {
	let provisionalUserMessageId: string | null = null;
	let provisionalAiMessageId: string | null = null;

	const cleanupProvisionalMessages = async () => {
		const messageIds = [provisionalUserMessageId, provisionalAiMessageId].filter(Boolean) as string[];
		if (messageIds.length === 0) return;

		try {
			await prisma.message.deleteMany({
				where: { id: { in: messageIds } },
			});
		} catch (cleanupError) {
			logger.warn({ err: cleanupError, messageIds }, "Failed to cleanup provisional stream messages");
		}
	};

	try {
		const userId = requireAuthenticatedUserId(req, res);
		const chatId = req.params.chatId as string;
		if (!userId) return;

		if (!hasSufficientStreamTokenTtl(req)) {
			res.status(401).json({
				error: "Access token is expiring soon. Refresh and retry stream.",
			});
			return;
		}

		const file = (req as AuthenticatedRequest).file;
		const { content } = sendMessageSchema.parse(req.body);

		const chat = await verifyChatOwnership(chatId, userId);
		if (!chat) {
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
		provisionalUserMessageId = userMessage.id;

		const aiMessage = await prisma.message.create({
			data: {
				chatId,
				role: "model",
				content: "",
			},
		});
		provisionalAiMessageId = aiMessage.id;

		res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
		res.setHeader("Cache-Control", "no-cache, no-transform");
		res.setHeader("Connection", "keep-alive");
		res.setHeader("X-Accel-Buffering", "no");
		res.flushHeaders?.();
		res.socket?.setNoDelay(true);

		const writeEvent = (payload: unknown) => {
			res.write(`data: ${JSON.stringify(payload)}\n\n`);
		};

		res.write(`: stream-open ${Date.now()}\n\n`);
		writeEvent({ type: "ack", userMessage, aiMessage });

		const previousMessages = recentMessages.slice(-3);
		const formattedPrompt = buildFormattedPrompt(previousMessages, content);

		let aiResponseText = "";
		try {
			aiResponseText = await generateWithGemma(formattedPrompt);
			writeEvent({ type: "chunk", delta: aiResponseText });
		} catch (streamError) {
			logger.error({ err: streamError }, "Failed to generate response");
			writeEvent({ type: "error", error: "Failed to generate AI response", code: "GENERATION_ERROR", retryable: false });
		}

		const updatedAiMessage = await prisma.message.update({
			where: { id: provisionalAiMessageId as string },
			data: { content: aiResponseText },
		});

		provisionalUserMessageId = null;
		provisionalAiMessageId = null;

		writeEvent({ type: "done", aiMessage: updatedAiMessage });
		res.end();
	} catch (error) {
		await cleanupProvisionalMessages();
		const streamError = toStreamErrorPayload(error);

		if (!res.headersSent) {
			res.status(streamError.statusCode).json({
				error: streamError.error,
				code: streamError.code,
				retryable: streamError.retryable,
				...(streamError.retryAfterSeconds ? { retryAfterSeconds: streamError.retryAfterSeconds } : {}),
			});
			return;
		}

		logger.error({ err: error }, "Failed to stream message");
		res.write(
			`data: ${JSON.stringify({
				type: streamError.type,
				error: streamError.error,
				code: streamError.code,
				retryable: streamError.retryable,
				...(streamError.retryAfterSeconds ? { retryAfterSeconds: streamError.retryAfterSeconds } : {}),
			})}\n\n`
		);
		res.end();
	}
};
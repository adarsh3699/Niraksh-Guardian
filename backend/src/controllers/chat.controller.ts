import { Request, Response } from "express";
import { createChatSchema, sendMessageSchema, updateChatSchema } from "../validators/chat.schema";
import logger from "../config/logger";
import prisma from "../db/prisma";
import {
	buildChatGenerationInput,
	generateChatResponse,
	generateChatResponseStream,
	normalizeChatGenerationError,
} from "../services/chat/chatGeneration.service";
import { AuthenticatedRequest, requireAuthenticatedUserId } from "../types/auth";
import { handleControllerError } from "../utils/controllerError";

const getStoredMessageContent = (content: string, file?: unknown) => (file ? `[Image Uploaded] ${content}` : content);

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
	const normalized = normalizeChatGenerationError(error);
	return {
		type: "error",
		error: normalized.error,
		code: normalized.code,
		retryable: normalized.retryable,
		retryAfterSeconds: normalized.retryAfterSeconds,
		statusCode: normalized.statusCode,
	};
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
		const { content, language } = sendMessageSchema.parse(req.body);

		const chat = await verifyChatOwnership(chatId, userId);
		if (!chat) {
			return res.status(404).json({ error: "Chat not found" });
		}

		const generationInput = await buildChatGenerationInput({
			chatId,
			userId,
			content,
			languageOverride: language,
			file,
		});

		const userMessage = await prisma.message.create({
			data: {
				chatId,
				role: "user",
				content: getStoredMessageContent(content, file),
			},
		});

		const aiResponseText = await generateChatResponse(generationInput);

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
	let provisionalAiMessageId: string | null = null;

	const cleanupProvisionalAiMessage = async () => {
		if (!provisionalAiMessageId) return;

		try {
			await prisma.message.delete({
				where: { id: provisionalAiMessageId },
			});
		} catch (cleanupError) {
			logger.warn(
				{ err: cleanupError, provisionalAiMessageId },
				"Failed to cleanup provisional AI stream message"
			);
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
		const { content, language } = sendMessageSchema.parse(req.body);

		const chat = await verifyChatOwnership(chatId, userId);
		if (!chat) {
			res.status(404).json({ error: "Chat not found" });
			return;
		}

		const generationInput = await buildChatGenerationInput({
			chatId,
			userId,
			content,
			languageOverride: language,
			file,
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

		let aiResponseText = "";
		try {
			for await (const delta of generateChatResponseStream(generationInput)) {
				aiResponseText += delta;
				writeEvent({ type: "chunk", delta });
			}
		} catch (generationError) {
			await cleanupProvisionalAiMessage();
			provisionalAiMessageId = null;

			const streamError = toStreamErrorPayload(generationError);
			logger.error({ err: generationError, streamError }, "Failed to generate streaming chat response");
			writeEvent({
				type: streamError.type,
				error: streamError.error,
				code: streamError.code,
				retryable: streamError.retryable,
				...(streamError.retryAfterSeconds ? { retryAfterSeconds: streamError.retryAfterSeconds } : {}),
			});
			res.end();
			return;
		}

		const updatedAiMessage = await prisma.message.update({
			where: { id: provisionalAiMessageId as string },
			data: { content: aiResponseText },
		});

		provisionalAiMessageId = null;

		writeEvent({ type: "done", aiMessage: updatedAiMessage });
		res.end();
	} catch (error) {
		await cleanupProvisionalAiMessage();
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

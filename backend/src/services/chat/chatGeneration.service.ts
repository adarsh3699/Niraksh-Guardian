import logger from "../../config/logger";
import prisma from "../../db/prisma";
import {
	executeStreamWithFallback,
	executeWithFallback,
	normalizeAIGenerationError,
} from "../ai/aiGenerationOrchestrator";
import { generateAIResponse, generateAIResponseStream } from "../ai/gemini";
import { generateWithLocalAI, generateWithLocalAIStream } from "../ai/llm";

export type ChatGenerationInput = {
	history: Array<{ role: string; content: string }>;
	message: string;
	language: string;
	imageBuffer?: Buffer;
	mimeType?: string;
};

type BuildChatGenerationInputParams = {
	chatId: string;
	userId: string;
	content: string;
	languageOverride?: string;
	file?: Express.Multer.File;
};

const buildFormattedPrompt = (history: Array<{ role: string; content: string }>, message: string): string => {
	const previousContext = history
		.map((entry) => `${entry.role === "user" ? "Patient" : "AI Assistant"}: ${entry.content}`)
		.join("\n");
	const contextSection = previousContext.trim() ? `Previous conversation:\n${previousContext}\n\n` : "";
	return `${contextSection}Current user query:\n${message}`;
};

const resolveTargetLanguage = async (userId: string, languageOverride?: string) => {
	if (languageOverride) {
		return languageOverride;
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { languagePreference: true },
	});

	return user?.languagePreference || "en";
};

export const buildChatGenerationInput = async (
	params: BuildChatGenerationInputParams
): Promise<ChatGenerationInput> => {
	const recentMessages = await prisma.message.findMany({
		where: { chatId: params.chatId },
		orderBy: { createdAt: "asc" },
		take: 20,
	});

	const previousMessages = recentMessages.slice(-4).map((message) => ({
		role: message.role,
		content: message.content,
	}));

	const targetLanguage = await resolveTargetLanguage(params.userId, params.languageOverride);

	return {
		history: previousMessages,
		message: params.content,
		language: targetLanguage,
		imageBuffer: params.file?.buffer,
		mimeType: params.file?.mimetype,
	};
};

export const generateChatResponse = async (input: ChatGenerationInput): Promise<string> => {
	const localPrompt = buildFormattedPrompt(input.history, input.message);

	return executeWithFallback({
		primary: () =>
			generateWithLocalAI({
				prompt: localPrompt,
				language: input.language,
				imageBuffer: input.imageBuffer,
				mimeType: input.mimeType,
			}),
		fallback: () =>
			generateAIResponse(input.history, input.message, input.language, input.imageBuffer, input.mimeType),
		onFallback: (error) => {
			logger.warn({ err: error }, "Local AI failed for sync chat generation. Falling back to Gemini.");
		},
	});
};

export async function* generateChatResponseStream(input: ChatGenerationInput): AsyncGenerator<string> {
	const localPrompt = buildFormattedPrompt(input.history, input.message);

	yield* executeStreamWithFallback({
		primary: () =>
			generateWithLocalAIStream({
				prompt: localPrompt,
				language: input.language,
				imageBuffer: input.imageBuffer,
				mimeType: input.mimeType,
			}),
		fallback: () =>
			generateAIResponseStream(input.history, input.message, input.language, input.imageBuffer, input.mimeType),
		onFallback: (error) => {
			logger.warn({ err: error }, "Local AI failed before stream output. Falling back to Gemini stream.");
		},
	});
}

export const normalizeChatGenerationError = normalizeAIGenerationError;

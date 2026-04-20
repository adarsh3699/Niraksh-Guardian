import { GeminiStreamError } from "./gemini";
import { LocalAIServiceError } from "./llm";

export type AIGenerationErrorPayload = {
	error: string;
	code: "RESOURCE_EXHAUSTED" | "INTERNAL_STREAM_ERROR";
	retryable: boolean;
	retryAfterSeconds?: number;
	statusCode: number;
};

type ExecuteWithFallbackInput<T> = {
	primary: () => Promise<T>;
	fallback: () => Promise<T>;
	shouldFallback?: (error: unknown) => boolean;
	onFallback?: (error: unknown) => void;
};

type ExecuteStreamWithFallbackInput = {
	primary: () => AsyncGenerator<string>;
	fallback: () => AsyncGenerator<string>;
	shouldFallback?: (error: unknown) => boolean;
	onFallback?: (error: unknown) => void;
};

export const shouldFallbackToSecondaryProvider = (error: unknown): boolean => {
	return error instanceof LocalAIServiceError;
};

export const executeWithFallback = async <T>(input: ExecuteWithFallbackInput<T>): Promise<T> => {
	const shouldFallback = input.shouldFallback || shouldFallbackToSecondaryProvider;

	try {
		return await input.primary();
	} catch (error) {
		if (!shouldFallback(error)) {
			throw error;
		}

		input.onFallback?.(error);
		return input.fallback();
	}
};

export async function* executeStreamWithFallback(input: ExecuteStreamWithFallbackInput): AsyncGenerator<string> {
	const shouldFallback = input.shouldFallback || shouldFallbackToSecondaryProvider;
	let emittedPrimaryChunk = false;

	try {
		for await (const chunk of input.primary()) {
			emittedPrimaryChunk = true;
			yield chunk;
		}
		return;
	} catch (error) {
		if (emittedPrimaryChunk || !shouldFallback(error)) {
			throw error;
		}

		input.onFallback?.(error);
	}

	for await (const chunk of input.fallback()) {
		yield chunk;
	}
}

export const normalizeAIGenerationError = (error: unknown): AIGenerationErrorPayload => {
	if (error instanceof GeminiStreamError) {
		return {
			error: error.message,
			code: error.code === "RESOURCE_EXHAUSTED" ? "RESOURCE_EXHAUSTED" : "INTERNAL_STREAM_ERROR",
			retryable: error.retryable,
			retryAfterSeconds: error.retryAfterSeconds,
			statusCode: error.code === "RESOURCE_EXHAUSTED" ? 429 : 500,
		};
	}

	if (error instanceof LocalAIServiceError) {
		return {
			error: error.message,
			code: error.code === "RATE_LIMITED" ? "RESOURCE_EXHAUSTED" : "INTERNAL_STREAM_ERROR",
			retryable: error.retryable,
			retryAfterSeconds: error.retryAfterSeconds,
			statusCode: error.code === "RATE_LIMITED" ? 429 : error.statusCode,
		};
	}

	return {
		error: "Internal Server Error",
		code: "INTERNAL_STREAM_ERROR",
		retryable: false,
		statusCode: 500,
	};
};

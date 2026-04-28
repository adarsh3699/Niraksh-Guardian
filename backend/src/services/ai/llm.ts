import axios, { AxiosError } from "axios";
import { Readable } from "stream";

const LOCAL_AI_BASE_URL = "http://localhost:8000";

type LocalServiceErrorCode =
	| "SERVICE_UNAVAILABLE"
	| "TIMEOUT"
	| "RATE_LIMITED"
	| "MODEL_NOT_FOUND"
	| "GENERATION_ERROR"
	| "INVALID_INPUT";

type LocalServiceErrorPayload = {
	error: string;
	code: LocalServiceErrorCode;
	retryable: boolean;
	retryAfterSeconds?: number;
	statusCode?: number;
};

type StreamEventPayload = {
	type: "chunk" | "done" | "error";
	delta?: string;
	error?: string;
	code?: string;
	retryable?: boolean;
	retryAfterSeconds?: number;
};

export type LocalGenerationInput = {
	prompt: string;
	language: string;
	imageBuffer?: Buffer;
	mimeType?: string;
};

export class LocalAIServiceError extends Error {
	constructor(
		public readonly code: LocalServiceErrorCode,
		message: string,
		public readonly retryable: boolean,
		public readonly statusCode: number,
		public readonly retryAfterSeconds?: number
	) {
		super(message);
		this.name = "LocalAIServiceError";
	}
}

const toRequestPayload = (input: LocalGenerationInput) => {
	const image_data =
		input.imageBuffer && input.mimeType
			? {
					base64: input.imageBuffer.toString("base64"),
					mime_type: input.mimeType,
				}
			: undefined;

	return {
		prompt: input.prompt,
		language: input.language,
		...(image_data ? { image_data } : {}),
	};
};

const asLocalServiceError = (
	error: unknown,
	fallbackMessage: string,
	defaultCode: LocalServiceErrorCode = "GENERATION_ERROR"
): LocalAIServiceError => {
	if (error instanceof LocalAIServiceError) {
		return error;
	}

	const axiosError = error as AxiosError<Partial<LocalServiceErrorPayload>>;
	if (axios.isAxiosError(axiosError)) {
		const statusCode = axiosError.response?.status;
		const data = axiosError.response?.data;
		const message = data?.error || axiosError.message || fallbackMessage;
		const code = (data?.code as LocalServiceErrorCode | undefined) || defaultCode;
		const retryable =
			typeof data?.retryable === "boolean"
				? data.retryable
				: statusCode === 429 || statusCode === 503 || code === "SERVICE_UNAVAILABLE" || code === "TIMEOUT";

		const normalizedStatus = statusCode || (code === "RATE_LIMITED" ? 429 : 500);
		const retryAfterSeconds = typeof data?.retryAfterSeconds === "number" ? data.retryAfterSeconds : undefined;

		if (axiosError.code === "ECONNABORTED") {
			return new LocalAIServiceError("TIMEOUT", message, true, 504, retryAfterSeconds);
		}

		if (
			axiosError.code === "ECONNREFUSED" ||
			axiosError.code === "ENOTFOUND" ||
			axiosError.code === "EHOSTUNREACH"
		) {
			return new LocalAIServiceError("SERVICE_UNAVAILABLE", message, true, 503, retryAfterSeconds);
		}

		return new LocalAIServiceError(code, message, retryable, normalizedStatus, retryAfterSeconds);
	}

	return new LocalAIServiceError(defaultCode, fallbackMessage, false, 500);
};

const readStreamToText = async (stream: Readable): Promise<string> => {
	let result = "";
	for await (const chunk of stream) {
		result += chunk.toString();
	}
	return result;
};

export const generateWithLocalAI = async (input: LocalGenerationInput): Promise<string> => {
	try {
		const response = await axios.post(`${LOCAL_AI_BASE_URL}/generate`, toRequestPayload(input), {
			timeout: 70000,
			validateStatus: () => true,
		});

		if (response.status >= 400) {
			const data = response.data as Partial<LocalServiceErrorPayload> | undefined;
			throw new LocalAIServiceError(
				(data?.code as LocalServiceErrorCode | undefined) || "GENERATION_ERROR",
				data?.error || "Local AI generation failed",
				typeof data?.retryable === "boolean"
					? data.retryable
					: response.status === 429 || response.status === 503,
				response.status,
				typeof data?.retryAfterSeconds === "number" ? data.retryAfterSeconds : undefined
			);
		}

		const aiText = (response.data as { response?: string })?.response;
		if (!aiText || !aiText.trim()) {
			throw new LocalAIServiceError("GENERATION_ERROR", "Local AI returned an empty response", false, 500);
		}

		return aiText;
	} catch (error) {
		throw asLocalServiceError(error, "Failed to generate response from local AI");
	}
};

export async function* generateWithLocalAIStream(input: LocalGenerationInput): AsyncGenerator<string> {
	let emittedAnyChunk = false;

	try {
		const response = await axios.post(`${LOCAL_AI_BASE_URL}/generate/stream`, toRequestPayload(input), {
			responseType: "stream",
			timeout: 700000,
			validateStatus: () => true,
		});

		const stream = response.data as Readable;
		if (response.status >= 400) {
			const rawBody = await readStreamToText(stream);
			let data: Partial<LocalServiceErrorPayload> = {};
			try {
				data = JSON.parse(rawBody);
			} catch {
				data = { error: rawBody || "Local AI stream failed" };
			}

			throw new LocalAIServiceError(
				(data.code as LocalServiceErrorCode | undefined) || "GENERATION_ERROR",
				data.error || "Local AI stream failed",
				typeof data.retryable === "boolean"
					? data.retryable
					: response.status === 429 || response.status === 503,
				response.status,
				typeof data.retryAfterSeconds === "number" ? data.retryAfterSeconds : undefined
			);
		}

		let buffer = "";
		for await (const chunk of stream) {
			buffer += chunk.toString();

			let lineBreakIndex = buffer.indexOf("\n");
			while (lineBreakIndex !== -1) {
				const line = buffer.slice(0, lineBreakIndex).trim();
				buffer = buffer.slice(lineBreakIndex + 1);

				if (line.startsWith("data:")) {
					const payloadRaw = line.slice(5).trim();
					if (payloadRaw) {
						const payload = JSON.parse(payloadRaw) as StreamEventPayload;
						if (payload.type === "chunk" && payload.delta) {
							emittedAnyChunk = true;
							yield payload.delta;
						}

						if (payload.type === "error") {
							throw new LocalAIServiceError(
								(payload.code as LocalServiceErrorCode | undefined) || "GENERATION_ERROR",
								payload.error || "Local AI stream failed",
								Boolean(payload.retryable),
								500,
								typeof payload.retryAfterSeconds === "number" ? payload.retryAfterSeconds : undefined
							);
						}

						if (payload.type === "done") {
							return;
						}
					}
				}

				lineBreakIndex = buffer.indexOf("\n");
			}
		}

		if (!emittedAnyChunk) {
			throw new LocalAIServiceError("GENERATION_ERROR", "Local AI stream returned no chunks", false, 500);
		}
	} catch (error) {
		throw asLocalServiceError(error, "Failed to stream response from local AI");
	}
}

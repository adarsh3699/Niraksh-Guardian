/* ------------------------------------------------------------------ */
/*  Chat & Message types                                              */
/* ------------------------------------------------------------------ */

export type MessageRole = "user" | "model";

export interface Message {
	id: string;
	chatId: string;
	role: MessageRole;
	content: string;
	createdAt: string;
}

/** Chat object returned by create / update / list. */
export interface Chat {
	id: string;
	userId: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}

/** Chat with its latest message (returned by `GET /api/chats`). */
export interface ChatWithLastMessage extends Chat {
	messages: Message[]; // max 1 element
}

/** Response from `POST /api/chats/:chatId/messages`. */
export interface SendMessageResponse {
	userMessage: Message;
	aiMessage: Message;
}

/* — Request bodies — */

export type ChatLanguage =
	| "en"
	| "hi"
	| "bn"
	| "te"
	| "mr"
	| "ta"
	| "ur"
	| "gu"
	| "kn"
	| "ml"
	| "pa";

export interface CreateChatRequest {
	title: string;
	language?: ChatLanguage;
}

export interface UpdateChatRequest {
	title?: string;
}

/** For text-only sends (file uploads use FormData separately). */
export interface SendMessageRequest {
	content: string;
	language?: string;
}

"use client";

import useSWR, { mutate as globalMutate, type KeyedMutator } from "swr";
import { useCallback, useState, useEffect } from "react";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
	Chat,
	ChatWithLastMessage,
	Message,
	SendMessageResponse,
	ChatLanguage,
} from "@/types/chat";

/* ------------------------------------------------------------------ */
/*  useChatList — fetches all chats for the sidebar                   */
/* ------------------------------------------------------------------ */

export function useChatList() {
	const { data, error, isLoading, mutate } = useSWR<ChatWithLastMessage[]>(
		API_ROUTES.CHATS,
		swrFetcher,
		{
			revalidateOnFocus: false,
			dedupingInterval: 5_000,
		},
	);

	return {
		chats: data ?? [],
		isLoading,
		isError: !!error,
		mutate,
	};
}

/* ------------------------------------------------------------------ */
/*  useChatMessages — fetches messages for a single chat              */
/* ------------------------------------------------------------------ */

export function useChatMessages(chatId: string | null) {
	const { data, error, isLoading, mutate } = useSWR<Message[]>(
		chatId ? API_ROUTES.CHAT(chatId) : null,
		swrFetcher,
		{
			revalidateOnFocus: false,
			dedupingInterval: 2_000,
		},
	);

	return {
		messages: data ?? [],
		isLoading,
		isError: !!error,
		mutate,
	};
}

const ACTIVE_CHAT_KEY = "niraksh_active_chat:v1";

function getStoredChatId(): string | null {
	if (typeof window === "undefined") return null;
	try {
		return localStorage.getItem(ACTIVE_CHAT_KEY);
	} catch {
		return null;
	}
}

function storeActiveChatId(chatId: string | null) {
	if (typeof window === "undefined") return;
	try {
		if (chatId) {
			localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
		} else {
			localStorage.removeItem(ACTIVE_CHAT_KEY);
		}
	} catch {
		// Storage full or blocked — silently ignore
	}
}

/* ------------------------------------------------------------------ */
/*  useChat — orchestrates chat CRUD + message sending                */
/* ------------------------------------------------------------------ */

export function useChat() {
	const [activeChatId, setActiveChatIdRaw] = useState<string | null>(getStoredChatId);
	const [isSending, setIsSending] = useState(false);

	// Sync to localStorage whenever activeChatId changes
	const setActiveChatId = useCallback((id: string | null) => {
		setActiveChatIdRaw(id);
		storeActiveChatId(id);
	}, []);

	const { chats, isLoading: chatsLoading, mutate: mutateChats } = useChatList();
	const {
		messages,
		isLoading: messagesLoading,
		mutate: mutateMessages,
	} = useChatMessages(activeChatId);

	// Validate stored chatId once chats load — clear if it no longer exists
	useEffect(() => {
		if (!chatsLoading && activeChatId && chats.length > 0) {
			const exists = chats.some((c) => c.id === activeChatId);
			if (!exists) {
				setActiveChatId(null);
			}
		}
	}, [chatsLoading, chats, activeChatId, setActiveChatId]);

	/* ---- Create chat (optimistic) ---- */
	const createChat = useCallback(
		async (language: ChatLanguage = "en"): Promise<Chat> => {
			const chat = await apiClient<Chat>(API_ROUTES.CHATS, {
				method: "POST",
				body: { title: "New Chat", language },
			});

			// Optimistically inject the new chat at the top of the list
			// and activate it immediately — no waiting for a network refetch.
			mutateChats(
				(prev) => {
					const optimistic: ChatWithLastMessage = {
						...chat,
						messages: [],
					};
					return [optimistic, ...(prev ?? [])];
				},
				{ revalidate: false },
			);
			setActiveChatId(chat.id);

			return chat;
		},
		[mutateChats, setActiveChatId],
	);

	/* ---- Delete chat ---- */
	const deleteChat = useCallback(
		async (chatId: string) => {
			// Optimistic removal from sidebar
			if (activeChatId === chatId) {
				setActiveChatId(null);
			}
			mutateChats((prev) => (prev ?? []).filter((c) => c.id !== chatId), { revalidate: false });

			await apiClient<{ message: string }>(API_ROUTES.CHAT(chatId), {
				method: "DELETE",
			});
			// Background revalidate for consistency
			mutateChats();
		},
		[activeChatId, mutateChats, setActiveChatId],
	);

	/* ---- Rename chat ---- */
	const renameChat = useCallback(
		async (chatId: string, title: string) => {
			// Optimistic rename in sidebar
			mutateChats((prev) => (prev ?? []).map((c) => (c.id === chatId ? { ...c, title } : c)), {
				revalidate: false,
			});
			await apiClient<Chat>(API_ROUTES.CHAT(chatId), {
				method: "PUT",
				body: { title },
			});
			mutateChats();
		},
		[mutateChats],
	);

	/* ---- Send message (optimistic user bubble) ---- */
	const sendMessage = useCallback(
		async (content: string, image?: File, language?: string) => {
			if (!content.trim() && !image) return;

			let chatId = activeChatId;

			// Auto-create chat if none selected
			if (!chatId) {
				const chat = await createChat((language as ChatLanguage) ?? "en");
				chatId = chat.id;
			}

			// 1. Optimistically show the user's message IMMEDIATELY
			const tempId = `optimistic-${Date.now()}`;
			const optimisticUserMsg: Message = {
				id: tempId,
				chatId: chatId,
				role: "user",
				content: image ? `[Image Uploaded] ${content}` : content,
				createdAt: new Date().toISOString(),
			};

			const cacheKey = API_ROUTES.CHAT(chatId);
			globalMutate<Message[]>(cacheKey, (prev) => [...(prev ?? []), optimisticUserMsg], {
				revalidate: false,
			});

			// 2. Show typing indicator
			setIsSending(true);

			try {
				let response: SendMessageResponse;

				if (image) {
					const formData = new FormData();
					formData.append("content", content);
					if (language) formData.append("language", language);
					formData.append("image", image);

					response = await apiClient<SendMessageResponse>(API_ROUTES.CHAT_MESSAGES(chatId), {
						method: "POST",
						body: formData,
						isFile: true,
					});
				} else {
					response = await apiClient<SendMessageResponse>(API_ROUTES.CHAT_MESSAGES(chatId), {
						method: "POST",
						body: { content, language },
					});
				}

				// 3. Replace optimistic message with real data + add AI response
				await globalMutate<Message[]>(
					cacheKey,
					(prev) => {
						const map = new Map<string, Message>();
						for (const m of prev ?? []) {
							// Skip the optimistic placeholder
							if (m.id === tempId) continue;
							map.set(m.id, m);
						}
						map.set(response.userMessage.id, response.userMessage);
						map.set(response.aiMessage.id, response.aiMessage);
						return Array.from(map.values());
					},
					{ revalidate: false },
				);

				// Background refresh sidebar (title / updatedAt may have changed)
				mutateChats();

				return response;
			} catch (error) {
				// Rollback: remove the optimistic message on failure
				await globalMutate<Message[]>(
					cacheKey,
					(prev) => (prev ?? []).filter((m) => m.id !== tempId),
					{ revalidate: false },
				);
				throw error;
			} finally {
				setIsSending(false);
			}
		},
		[activeChatId, createChat, mutateChats],
	);

	return {
		/* state */
		chats,
		messages,
		activeChatId,
		chatsLoading,
		messagesLoading,
		isSending,

		/* actions */
		setActiveChatId,
		createChat,
		deleteChat,
		renameChat,
		sendMessage,

		/* SWR mutators (for external invalidation) */
		mutateChats,
		mutateMessages: mutateMessages as KeyedMutator<Message[]>,
	};
}

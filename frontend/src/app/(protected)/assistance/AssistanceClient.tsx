"use client";

import { useState, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useToast } from "@/contexts/ToastProvider";
import type { ChatLanguage } from "@/types/chat";
import { ApiError } from "@/lib/api";
import { PanelLeft } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  AssistanceClient — two-panel chat layout                          */
/* ------------------------------------------------------------------ */

export function AssistanceClient() {
	const [language, setLanguage] = useState<ChatLanguage>("en");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const isMobile = useMediaQuery("(max-width: 768px)");
	const { addToast } = useToast();

	const {
		chats,
		messages,
		activeChatId,
		chatsLoading,
		messagesLoading,
		isSending,
		setActiveChatId,
		createChat,
		deleteChat,
		renameChat,
		sendMessage,
	} = useChat();

	/* ---- Handlers with error handling ---- */

	const handleNewChat = useCallback(async () => {
		try {
			await createChat(language);
		} catch (err) {
			addToast("error", err instanceof ApiError ? err.message : "Failed to create chat");
		}
	}, [createChat, language, addToast]);

	const handleDeleteChat = useCallback(
		async (chatId: string) => {
			try {
				await deleteChat(chatId);
				addToast("success", "Chat deleted");
			} catch (err) {
				addToast("error", err instanceof ApiError ? err.message : "Failed to delete chat");
			}
		},
		[deleteChat, addToast],
	);

	const handleRenameChat = useCallback(
		async (chatId: string, title: string) => {
			try {
				await renameChat(chatId, title);
			} catch (err) {
				addToast("error", err instanceof ApiError ? err.message : "Failed to rename chat");
			}
		},
		[renameChat, addToast],
	);

	const handleSendMessage = useCallback(
		async (content: string, image?: File) => {
			try {
				await sendMessage(content, image, language);
			} catch (err) {
				addToast("error", err instanceof ApiError ? err.message : "Failed to send message");
			}
		},
		[sendMessage, language, addToast],
	);

	const handleSelectChat = useCallback(
		(chatId: string) => {
			setActiveChatId(chatId);
			if (isMobile) setSidebarOpen(false);
		},
		[setActiveChatId, isMobile],
	);

	return (
		<div className="flex h-[calc(100vh-4rem)] overflow-hidden">
			{/* Desktop sidebar */}
			{!isMobile && (
				<ChatSidebar
					chats={chats}
					activeChatId={activeChatId}
					isLoading={chatsLoading}
					language={language}
					onSelectChat={handleSelectChat}
					onNewChat={handleNewChat}
					onDeleteChat={handleDeleteChat}
					onRenameChat={handleRenameChat}
					onLanguageChange={setLanguage}
				/>
			)}

			{/* Mobile sidebar overlay */}
			{isMobile && sidebarOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40 bg-black/40"
						onClick={() => setSidebarOpen(false)}
						aria-hidden="true"
					/>
					{/* Sidebar drawer */}
					<div className="fixed inset-y-0 left-0 z-50 w-72 animate-in slide-in-from-left duration-200">
						<ChatSidebar
							chats={chats}
							activeChatId={activeChatId}
							isLoading={chatsLoading}
							language={language}
							onSelectChat={handleSelectChat}
							onNewChat={handleNewChat}
							onDeleteChat={handleDeleteChat}
							onRenameChat={handleRenameChat}
							onLanguageChange={setLanguage}
							onClose={() => setSidebarOpen(false)}
							isMobileOverlay
						/>
					</div>
				</>
			)}

			{/* Main chat area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Mobile header with toggle */}
				{isMobile && (
					<div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
						<button
							onClick={() => setSidebarOpen(true)}
							className="rounded-md p-1.5 text-muted transition-colors hover:bg-border hover:text-foreground"
							aria-label="Open chat list"
						>
							<PanelLeft className="size-5" />
						</button>
						<h1 className="font-heading text-sm font-semibold text-foreground">
							AI Health Assistant
						</h1>
					</div>
				)}

				<ChatWindow
					messages={messages}
					isLoading={messagesLoading && !!activeChatId}
					isSending={isSending}
					activeChatId={activeChatId}
					onSend={handleSendMessage}
				/>
			</div>
		</div>
	);
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn, formatDate, truncateText } from "@/lib/utils";
import { CHAT_LANGUAGES } from "@/lib/constants";
import type { ChatWithLastMessage, ChatLanguage } from "@/types/chat";
import { Plus, Trash2, Pencil, Check, X, MessageSquare, ChevronLeft, Globe, PanelLeft } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

/* ------------------------------------------------------------------ */
/*  ChatSidebar                                                       */
/* ------------------------------------------------------------------ */

interface ChatSidebarProps {
	chats: ChatWithLastMessage[];
	activeChatId: string | null;
	isLoading: boolean;
	language: ChatLanguage;
	onSelectChat: (chatId: string) => void;
	onNewChat: () => void;
	onDeleteChat: (chatId: string) => void;
	onRenameChat: (chatId: string, title: string) => void;
	onLanguageChange: (lang: ChatLanguage) => void;
	onClose?: () => void;
	onToggleSidebar?: () => void;
	isMobileOverlay?: boolean;
}

export function ChatSidebar({
	chats,
	activeChatId,
	isLoading,
	language,
	onSelectChat,
	onNewChat,
	onDeleteChat,
	onRenameChat,
	onLanguageChange,
	onClose,
	onToggleSidebar,
	isMobileOverlay = false,
}: ChatSidebarProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const editInputRef = useRef<HTMLInputElement>(null);

	// Focus the edit input when activating inline rename
	useEffect(() => {
		if (editingId && editInputRef.current) {
			editInputRef.current.focus();
			editInputRef.current.select();
		}
	}, [editingId]);

	const startRename = useCallback((chatId: string, currentTitle: string) => {
		setEditingId(chatId);
		setEditTitle(currentTitle);
	}, []);

	const confirmRename = useCallback(() => {
		if (editingId && editTitle.trim()) {
			onRenameChat(editingId, editTitle.trim());
		}
		setEditingId(null);
		setEditTitle("");
	}, [editingId, editTitle, onRenameChat]);

	const cancelRename = useCallback(() => {
		setEditingId(null);
		setEditTitle("");
	}, []);

	const confirmDelete = useCallback(
		(chatId: string) => {
			onDeleteChat(chatId);
			setDeletingId(null);
		},
		[onDeleteChat],
	);

	return (
		<aside
			className={cn(
				"flex h-full flex-col border-r border-border bg-background transition-all duration-300",
				isMobileOverlay ? "w-full" : "w-72",
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<div className="flex items-center gap-2">
					{isMobileOverlay && onClose ? (
						<button
							onClick={onClose}
							className="rounded-md p-1.5 text-muted transition-colors hover:bg-border hover:text-foreground"
							aria-label="Close sidebar"
						>
							<ChevronLeft className="size-5" />
						</button>
					) : (
						onToggleSidebar && (
							<button
								onClick={onToggleSidebar}
								className="rounded-md p-1.5 text-muted transition-colors hover:bg-border hover:text-foreground border border-transparent hover:border-border"
								aria-label="Toggle sidebar"
								title="Close sidebar"
							>
								<PanelLeft className="size-5" />
							</button>
						)
					)}
					<h2 className="font-heading text-sm font-semibold">Chats</h2>
				</div>

				<button
					onClick={onNewChat}
					className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-110"
					aria-label="New chat"
				>
					<Plus className="size-3.5" />
					New
				</button>
			</div>

			{/* Language selector */}
			<div className="border-b border-border px-4 py-2">
				<div className="flex items-center gap-2">
					<Globe className="size-4 text-muted" />
					<select
						value={language}
						onChange={(e) => onLanguageChange(e.target.value as ChatLanguage)}
						className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
						aria-label="Chat language"
					>
						{CHAT_LANGUAGES.map((lang) => (
							<option key={lang.code} value={lang.code}>
								{lang.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Chat list */}
			<div className="flex-1 overflow-y-auto" role="list" aria-label="Chat list">
				{isLoading ? (
					<div className="flex items-center justify-center py-10">
						<Spinner size="md" className="text-primary" />
					</div>
				) : chats.length === 0 ? (
					<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
						<MessageSquare className="size-8 text-muted" />
						<p className="text-sm text-muted">No chats yet</p>
						<p className="text-xs text-muted">Start your first conversation</p>
					</div>
				) : (
					chats.map((chat) => (
						<div
							key={chat.id}
							role="listitem"
							className={cn(
								"group relative border-b border-border/50 transition-colors",
								activeChatId === chat.id ? "bg-primary/10" : "hover:bg-border/40",
							)}
						>
							{/* Delete confirmation overlay */}
							{deletingId === chat.id ? (
								<div className="flex items-center gap-2 px-4 py-3">
									<p className="flex-1 text-xs text-destructive">Delete?</p>
									<button
										onClick={() => confirmDelete(chat.id)}
										className="rounded p-1 text-destructive hover:bg-destructive/10"
										aria-label="Confirm delete"
									>
										<Check className="size-4" />
									</button>
									<button
										onClick={() => setDeletingId(null)}
										className="rounded p-1 text-muted hover:bg-border"
										aria-label="Cancel delete"
									>
										<X className="size-4" />
									</button>
								</div>
							) : editingId === chat.id ? (
								/* Inline rename */
								<div className="flex items-center gap-1.5 px-3 py-2.5">
									<input
										ref={editInputRef}
										value={editTitle}
										onChange={(e) => setEditTitle(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") confirmRename();
											if (e.key === "Escape") cancelRename();
										}}
										className="min-w-0 flex-1 rounded-md border border-primary bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
										maxLength={100}
									/>
									<button
										onClick={confirmRename}
										className="rounded p-1 text-primary hover:bg-primary/10"
										aria-label="Save name"
									>
										<Check className="size-4" />
									</button>
									<button
										onClick={cancelRename}
										className="rounded p-1 text-muted hover:bg-border"
										aria-label="Cancel rename"
									>
										<X className="size-4" />
									</button>
								</div>
							) : (
								/* Normal chat item */
								<button
									onClick={() => {
										onSelectChat(chat.id);
										if (isMobileOverlay && onClose) onClose();
									}}
									className="flex w-full flex-col gap-0.5 px-4 py-3 text-left"
								>
									<span className="text-sm font-medium text-foreground">
										{truncateText(chat.title, 28)}
									</span>
									<span className="text-xs text-muted">
										{chat.messages?.[0]
											? truncateText(chat.messages[0].content, 40)
											: "No messages yet"}
									</span>
									<span className="text-[10px] text-muted/70">{formatDate(chat.updatedAt)}</span>
								</button>
							)}

							{/* Actions (visible on hover, hidden when editing/deleting) */}
							{!editingId && !deletingId && deletingId !== chat.id && (
								<div className="absolute right-2 top-2.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
									<button
										onClick={(e) => {
											e.stopPropagation();
											startRename(chat.id, chat.title);
										}}
										className="rounded p-1 text-muted hover:bg-border hover:text-foreground"
										aria-label={`Rename "${chat.title}"`}
									>
										<Pencil className="size-3.5" />
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setDeletingId(chat.id);
										}}
										className="rounded p-1 text-muted hover:bg-destructive/10 hover:text-destructive"
										aria-label={`Delete "${chat.title}"`}
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							)}
						</div>
					))
				)}
			</div>
		</aside>
	);
}

"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";
import { Bot, User, ImageIcon } from "lucide-react";

// Hoisted outside component to avoid re-creating on every render (rerender-memo-with-default-value)
const remarkPlugins = [remarkGfm];

/* ------------------------------------------------------------------ */
/*  ChatMessage — individual message bubble                           */
/* ------------------------------------------------------------------ */

interface ChatMessageProps {
	message: Message;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
	const isUser = message.role === "user";

	// Backend prefixes image uploads with "[Image Uploaded] "
	const hasImage = isUser && message.content.startsWith("[Image Uploaded]");
	const displayContent = hasImage
		? message.content.replace("[Image Uploaded] ", "")
		: message.content;

	return (
		<div
			className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
			aria-label={isUser ? "Your message" : "AI response"}
		>
			{/* Avatar */}
			<div
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-full",
					isUser ? "bg-primary text-white" : "bg-border text-foreground",
				)}
			>
				{isUser ? <User className="size-4" /> : <Bot className="size-4" />}
			</div>

			{/* Bubble */}
			<div
				className={cn(
					"max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
					isUser
						? "rounded-br-md bg-primary text-white"
						: "rounded-bl-md bg-surface text-foreground shadow-card",
				)}
			>
				{isUser ? (
					<div>
						{hasImage && (
							<span className="mb-1 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs">
								<ImageIcon className="size-3" />
								Image attached
							</span>
						)}
						<p className="whitespace-pre-wrap">{displayContent}</p>
					</div>
				) : (
					<div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:mb-2 prose-headings:mt-3 prose-pre:my-2 prose-code:rounded prose-code:bg-border/50 prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
						<ReactMarkdown remarkPlugins={remarkPlugins}>{message.content}</ReactMarkdown>
					</div>
				)}
			</div>
		</div>
	);
});

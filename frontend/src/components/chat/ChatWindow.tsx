"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickSymptoms } from "./QuickSymptoms";
import { Spinner } from "@/components/ui/Spinner";
import type { Message } from "@/types/chat";
import { Bot } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Typing indicator                                                  */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
	return (
		<div className="flex gap-3" aria-label="AI is typing">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-border text-foreground">
				<Bot className="size-4" />
			</div>
			<div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface px-4 py-3 shadow-card">
				<span className="size-2 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
				<span className="size-2 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
				<span className="size-2 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Empty state (no chat selected or no messages)                     */
/* ------------------------------------------------------------------ */

function EmptyState() {
	return (
		<div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
			<div className="flex gap-3" aria-label="AI response">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-border text-foreground">
					<Bot className="size-4" />
				</div>
				<div className="max-w-[80%] rounded-2xl rounded-bl-md bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-card">
					<div className="prose prose-sm max-w-none dark:prose-invert">
						<p>
							👋 Hello! I&apos;m your Smart Healthcare Assistant. How can I help you today? Feel
							free to describe your symptoms or health concerns, and I&apos;ll provide some guidance
							and precautions.
						</p>
						<br />
						<p>
							<em>Remember, this is not a substitute for professional medical advice.</em>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  ChatWindow                                                        */
/* ------------------------------------------------------------------ */

interface ChatWindowProps {
	messages: Message[];
	isLoading: boolean;
	isSending: boolean;
	activeChatId: string | null;
	onSend: (content: string, image?: File) => void;
}

export function ChatWindow({
	messages,
	isLoading,
	isSending,
	activeChatId,
	onSend,
}: ChatWindowProps) {
	const bottomRef = useRef<HTMLDivElement>(null);
	// We'll expose an imperative method on the ChatInput component using a ref or just lift state.
	// Actually, the cleanest way without refactoring ChatInput's internal file handling is a ref.
	const chatInputRef = useRef<{ setDraftMessage: (msg: string) => void }>(null);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, isSending]);

	const handleQuickSymptom = (symptom: string) => {
		const text = `I'm experiencing ${symptom.toLowerCase()}. What could be the cause and what should I do?`;
		if (chatInputRef.current) {
			chatInputRef.current.setDraftMessage(text);
		}
	};

	const hasMessages = messages.length > 0;

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Message area */}
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex h-full items-center justify-center">
						<Spinner size="lg" className="text-primary" />
					</div>
				) : !hasMessages ? (
					<EmptyState />
				) : (
					<div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
						{messages.map((msg) => (
							<ChatMessage key={msg.id} message={msg} />
						))}
						{isSending && <TypingIndicator />}
						<div ref={bottomRef} />
					</div>
				)}
			</div>

			{/* Input area */}
			{activeChatId && !isLoading && <QuickSymptoms onSelect={handleQuickSymptom} />}
			<ChatInput ref={chatInputRef} onSend={onSend} disabled={isSending || isLoading} />
		</div>
	);
}

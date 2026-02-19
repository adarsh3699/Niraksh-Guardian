"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickSymptoms } from "./QuickSymptoms";
import { Spinner } from "@/components/ui/Spinner";
import type { Message } from "@/types/chat";
import { Bot, Stethoscope } from "lucide-react";

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

function EmptyState({ onQuickSymptom }: { onQuickSymptom: (s: string) => void }) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
			<div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
				<Stethoscope className="size-8 text-primary" />
			</div>
			<div>
				<h2 className="font-heading text-xl font-bold text-foreground">AI Health Assistant</h2>
				<p className="mt-1 max-w-sm text-sm text-muted">
					Describe your symptoms, upload images, or ask health questions. I&apos;m here to help
					guide you — not replace a doctor.
				</p>
			</div>
			<div className="mt-2 max-w-lg">
				<p className="mb-2 text-xs font-medium text-muted">Quick start — click a symptom:</p>
				<QuickSymptoms onSelect={onQuickSymptom} />
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

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, isSending]);

	const handleQuickSymptom = (symptom: string) => {
		onSend(
			`I'm experiencing ${symptom.toLowerCase()}. What could be the cause and what should I do?`,
		);
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
					<EmptyState onQuickSymptom={handleQuickSymptom} />
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
			{activeChatId && hasMessages && !isLoading && <QuickSymptoms onSelect={handleQuickSymptom} />}
			<ChatInput onSend={onSend} disabled={isSending || isLoading} />
		</div>
	);
}

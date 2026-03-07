"use client";

import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickSymptoms } from "./QuickSymptoms";
import { Spinner } from "@/components/ui/Spinner";
import type { Message, ChatLanguage } from "@/types/chat";
import { Bot, Stethoscope, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
	onFindDoctors?: () => void;
	isFindingDoctors?: boolean;
	language?: ChatLanguage;
}

export function ChatWindow({
	messages,
	isLoading,
	isSending,
	activeChatId,
	onSend,
	onFindDoctors,
	isFindingDoctors = false,
	language,
}: ChatWindowProps) {
	const bottomRef = useRef<HTMLDivElement>(null);
	const chatInputRef = useRef<{ setDraftMessage: (msg: string) => void }>(null);
	const [voiceEnabled, setVoiceEnabled] = useState(false);
	const lastSpokenIdRef = useRef<string | null>(null);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, isSending]);

	const [isSpeechSupported] = useState(() => {
		if (typeof window === "undefined") return false;
		return "speechSynthesis" in window;
	});

	// Speak the latest AI message when voice assistant is enabled
	useEffect(() => {
		if (!voiceEnabled || !isSpeechSupported) return;
		if (typeof window === "undefined") return;

		const synth = window.speechSynthesis;
		if (!synth) return;

		const lastAiMessage = [...messages].reverse().find((msg) => msg.role === "model");
		if (!lastAiMessage) return;

		if (lastSpokenIdRef.current === lastAiMessage.id) return;

		// Cancel any ongoing speech before speaking the new one
		synth.cancel();

		const utterance = new SpeechSynthesisUtterance(lastAiMessage.content);
		utterance.lang = language === "hi" ? "hi-IN" : "en-US";

		synth.speak(utterance);
		lastSpokenIdRef.current = lastAiMessage.id;

		return () => {
			synth.cancel();
		};
	}, [messages, voiceEnabled, isSpeechSupported, language]);

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

			{/* Actions bar */}
			<div className="flex flex-wrap items-center gap-2 border-t border-border/50 px-4 py-2">
				{/* Quick symptoms */}
				{activeChatId && !isLoading && <QuickSymptoms onSelect={handleQuickSymptom} />}

				{/* Voice assistant toggle */}
				{isSpeechSupported && (
					<button
						type="button"
						onClick={() => {
							setVoiceEnabled((prev) => {
								if (prev) {
									lastSpokenIdRef.current = null;
									window.speechSynthesis?.cancel();
								}
								return !prev;
							});
						}}
						className={cn(
							"flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
							voiceEnabled
								? "border-primary bg-primary/10 text-primary"
								: "border-border bg-surface text-muted hover:bg-border/60 hover:text-foreground",
						)}
						aria-pressed={voiceEnabled}
						aria-label={voiceEnabled ? "Disable voice assistant" : "Enable voice assistant"}
					>
						<Volume2 className="size-3" />
						{voiceEnabled ? "Voice On" : "Voice Off"}
					</button>
				)}

				{/* Find Doctors button */}
				{onFindDoctors && activeChatId && hasMessages && !isLoading && (
					<button
						onClick={onFindDoctors}
						disabled={isFindingDoctors || isSending}
						className={cn(
							"ml-auto flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-all",
							"hover:bg-primary/10 hover:border-primary/50",
							"disabled:cursor-not-allowed disabled:opacity-50",
						)}
					>
						{isFindingDoctors ? (
							<Loader2 className="size-3 animate-spin" />
						) : (
							<Stethoscope className="size-3" />
						)}
						{isFindingDoctors ? "Analyzing..." : "Find Doctors"}
					</button>
				)}
			</div>

			{/* Chat input */}
			<ChatInput
				ref={chatInputRef}
				onSend={onSend}
				disabled={isSending || isLoading}
				inputLanguage={language}
			/>
		</div>
	);
}

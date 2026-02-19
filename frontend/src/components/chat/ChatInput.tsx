"use client";

import { useState, useRef, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  ChatInput                                                         */
/* ------------------------------------------------------------------ */

interface ChatInputProps {
	onSend: (content: string, image?: File) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function ChatInput({
	onSend,
	disabled = false,
	placeholder = "Describe your symptoms or ask a health question...",
}: ChatInputProps) {
	const [message, setMessage] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = useCallback(
		(e?: FormEvent) => {
			e?.preventDefault();
			const content = message.trim();
			if (!content && !image) return;
			onSend(content, image ?? undefined);
			setMessage("");
			setImage(null);
			setImagePreview(null);
			// Reset textarea height
			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
			}
		},
		[message, image, onSend],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	const handleImageSelect = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			return;
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			return;
		}

		setImage(file);
		const reader = new FileReader();
		reader.onload = (ev) => {
			setImagePreview(ev.target?.result as string);
		};
		reader.readAsDataURL(file);

		// Reset input so same file can be selected again
		e.target.value = "";
	}, []);

	const removeImage = useCallback(() => {
		setImage(null);
		setImagePreview(null);
	}, []);

	// Auto-resize textarea
	const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setMessage(e.target.value);
		const el = e.target;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
	}, []);

	return (
		<div className="border-t border-border bg-surface px-4 py-3">
			{/* Image preview */}
			{imagePreview && (
				<div className="mb-2 inline-flex items-start gap-2">
					<div className="relative size-16 overflow-hidden rounded-lg border border-border">
						<Image src={imagePreview} alt="Attached image" fill className="object-cover" />
					</div>
					<button
						onClick={removeImage}
						className="rounded-full bg-destructive/10 p-1 text-destructive transition-colors hover:bg-destructive/20"
						aria-label="Remove image"
					>
						<X className="size-3.5" />
					</button>
				</div>
			)}

			{/* Input row */}
			<form onSubmit={handleSubmit} className="flex items-end gap-2">
				{/* Image upload button */}
				<button
					type="button"
					onClick={handleImageSelect}
					disabled={disabled}
					className={cn(
						"flex shrink-0 items-center justify-center rounded-lg p-2.5 text-muted transition-colors",
						"hover:bg-border hover:text-foreground",
						"disabled:cursor-not-allowed disabled:opacity-50",
					)}
					aria-label="Attach image"
				>
					<ImagePlus className="size-5" />
				</button>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					className="hidden"
					aria-hidden="true"
				/>

				{/* Text input */}
				<textarea
					ref={textareaRef}
					value={message}
					onChange={handleTextareaInput}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={disabled}
					rows={1}
					className={cn(
						"min-h-[40px] max-h-[150px] flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground",
						"placeholder:text-muted",
						"focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
						"disabled:cursor-not-allowed disabled:opacity-50",
					)}
					aria-label="Type your message"
				/>

				{/* Send button */}
				<button
					type="submit"
					disabled={disabled || (!message.trim() && !image)}
					className={cn(
						"flex shrink-0 items-center justify-center rounded-xl bg-primary p-2.5 text-white transition-all",
						"hover:brightness-110 active:brightness-95",
						"disabled:cursor-not-allowed disabled:opacity-50",
					)}
					aria-label="Send message"
				>
					<Send className="size-5" />
				</button>
			</form>
		</div>
	);
}

"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./Button";

export interface ConfirmDialogProps {
	/** Controls whether the dialog is open */
	isOpen: boolean;
	/** Title of the dialog */
	title: string;
	/** Subtitle or main body description */
	description: string;
	/** Label for the cancel button */
	cancelLabel?: string;
	/** Label for the confirm button */
	confirmLabel?: string;
	/** Called when cancel is clicked or backdrop clicked */
	onCancel: () => void;
	/** Called when confirm is clicked */
	onConfirm: () => void | Promise<void>;
	/** Is the confirmation action loading? */
	isLoading?: boolean;
	/** Is the action destructive (red button)? */
	isDestructive?: boolean;
}

export function ConfirmDialog({
	isOpen,
	title,
	description,
	cancelLabel = "Cancel",
	confirmLabel = "Confirm",
	onCancel,
	onConfirm,
	isLoading = false,
	isDestructive = false,
}: ConfirmDialogProps) {
	// Prevents scrolling on the body when open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	// Close on Escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isLoading) {
				onCancel();
			}
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, isLoading, onCancel]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
				onClick={!isLoading ? onCancel : undefined}
			/>

			{/* Dialog Card */}
			<div
				role="dialog"
				aria-modal="true"
				className="relative z-50 w-full max-w-sm animate-in fade-in zoom-in-95 overflow-hidden rounded-xl bg-surface p-6 shadow-xl dark:border dark:border-border sm:max-w-md"
			>
				<div className="space-y-3 shrink-0">
					<h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>

				<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						{cancelLabel}
					</Button>
					<Button
						type="button"
						variant={isDestructive ? "destructive" : "primary"}
						onClick={onConfirm}
						disabled={isLoading}
						className="w-full sm:w-auto min-w-[100px]"
					>
						{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
						{confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}

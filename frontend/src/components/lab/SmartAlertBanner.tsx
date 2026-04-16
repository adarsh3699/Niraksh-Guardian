"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartAlertBannerProps {
	shouldShowAlert: boolean;
	onDismiss: () => void;
	className?: string;
}

export function SmartAlertBanner({ shouldShowAlert, onDismiss, className }: SmartAlertBannerProps) {
	if (!shouldShowAlert) return null;

	return (
		<div
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
			className={cn(
				"flex items-center justify-between gap-3 rounded-xl px-4 py-2.5",
				"bg-destructive/8 border border-destructive/25",
				className,
			)}
		>
			<div className="flex items-center gap-2 min-w-0">
				<AlertTriangle className="size-3.5 shrink-0 text-destructive" aria-hidden="true" />
				<p className="text-sm text-destructive leading-snug">
					<span className="font-semibold">Critical values detected.</span>{" "}
					<span className="opacity-80">Consult your healthcare provider immediately.</span>
				</p>
			</div>
			<button
				type="button"
				onClick={onDismiss}
				aria-label="Dismiss alert"
				className="shrink-0 rounded-full p-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
			>
				<X className="size-3.5" aria-hidden="true" />
			</button>
		</div>
	);
}

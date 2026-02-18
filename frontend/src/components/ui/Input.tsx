import { type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface InputProps extends ComponentProps<"input"> {
	label?: string;
	error?: string;
	icon?: ReactNode;
}

export function Input({ label, error, icon, className, id, ref, ...props }: InputProps) {
	const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

	return (
		<div className="flex flex-col gap-1.5">
			{label && (
				<label htmlFor={inputId} className="text-sm font-medium text-foreground">
					{label}
				</label>
			)}
			<div className="relative">
				{icon && (
					<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
						{icon}
					</span>
				)}
				<input
					ref={ref}
					id={inputId}
					className={cn(
						"h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground",
						"placeholder:text-muted",
						"transition-colors duration-200",
						"focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
						"disabled:cursor-not-allowed disabled:opacity-50",
						icon && "pl-10",
						error && "border-destructive focus:border-destructive focus:ring-destructive/20",
						className,
					)}
					aria-invalid={!!error}
					aria-describedby={error && inputId ? `${inputId}-error` : undefined}
					{...props}
				/>
			</div>
			{error && (
				<p
					id={inputId ? `${inputId}-error` : undefined}
					className="text-xs text-destructive"
					role="alert"
				>
					{error}
				</p>
			)}
		</div>
	);
}

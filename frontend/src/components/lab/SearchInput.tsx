"use client";

import { type ChangeEvent, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface SearchInputProps {
	value: string;
	onSearchChange: (query: string) => void;
	onClear: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function SearchInput({
	value,
	onSearchChange,
	onClear,
	placeholder = "Search components...",
	disabled = false,
	className,
}: SearchInputProps) {
	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			onSearchChange(e.target.value);
		},
		[onSearchChange],
	);

	const handleClear = useCallback(() => {
		onClear();
	}, [onClear]);

	return (
		<div className={cn("relative", className)}>
			<div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
				<Search className="size-4" aria-hidden="true" />
			</div>
			<input
				type="text"
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				disabled={disabled}
				className={cn(
					"h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-10 text-sm text-foreground",
					"placeholder:text-muted",
					"transition-colors duration-200",
					"focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
					"disabled:cursor-not-allowed disabled:opacity-50",
				)}
				aria-label="Search lab components"
			/>
			{value && !disabled && (
				<button
					type="button"
					onClick={handleClear}
					className={cn(
						"absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1",
						"text-muted transition-colors hover:bg-border hover:text-foreground",
						"focus:outline-none focus:ring-2 focus:ring-primary/20",
					)}
					aria-label="Clear search"
				>
					<X className="size-4" />
				</button>
			)}
		</div>
	);
}

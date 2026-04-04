/* ------------------------------------------------------------------ */
/*  General utility functions                                         */
/* ------------------------------------------------------------------ */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts.
 *
 * ```ts
 * cn("px-4 py-2", condition && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Locale-aware date formatting.
 *
 * @example formatDate("2026-02-18T10:00:00Z") → "Feb 18, 2026"
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		...options,
	});
}

/**
 * Truncate text to `maxLength` characters, adding "…" if truncated.
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trimEnd() + "…";
}

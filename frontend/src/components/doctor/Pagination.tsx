"use client";

import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface PaginationProps {
	meta: PaginationMeta;
	onPageChange: (page: number) => void;
	scrollTargetId?: string;
}

export function Pagination({ meta, onPageChange, scrollTargetId }: PaginationProps) {
	const { page, pages, total } = meta;

	const go = useCallback(
		(target: number) => {
			onPageChange(target);
			if (scrollTargetId) {
				document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth" });
			} else {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
		},
		[onPageChange, scrollTargetId],
	);

	if (pages <= 1) return null;

	const start = (page - 1) * meta.limit + 1;
	const end = Math.min(page * meta.limit, total);

	const btnBase = cn(
		"inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium",
		"transition-colors disabled:opacity-40 disabled:pointer-events-none",
	);

	return (
		<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
			<p className="text-xs text-muted">
				Showing{" "}
				<strong>
					{start}–{end}
				</strong>{" "}
				of <strong>{total}</strong> doctors
			</p>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => go(page - 1)}
					disabled={page <= 1}
					className={cn(btnBase, "hover:bg-border hover:text-foreground")}
					aria-label="Previous page"
				>
					<ChevronLeft className="size-4" />
					<span className="hidden sm:inline">Prev</span>
				</button>

				<span className="text-sm font-medium text-foreground">
					{page} / {pages}
				</span>

				<button
					type="button"
					onClick={() => go(page + 1)}
					disabled={page >= pages}
					className={cn(btnBase, "hover:bg-border hover:text-foreground")}
					aria-label="Next page"
				>
					<span className="hidden sm:inline">Next</span>
					<ChevronRight className="size-4" />
				</button>
			</div>
		</div>
	);
}

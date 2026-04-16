"use client";

import { useCallback } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortColumn, SortDirection } from "@/lib/lab";

interface SortableColumnHeaderProps {
	column: SortColumn;
	label: string;
	activeColumn: SortColumn | null;
	sortDirection: SortDirection;
	onSort: (column: SortColumn) => void;
	align?: "left" | "center" | "right";
	className?: string;
}

export function SortableColumnHeader({
	column,
	label,
	activeColumn,
	sortDirection,
	onSort,
	align = "left",
	className,
}: SortableColumnHeaderProps) {
	const isActive = activeColumn === column;

	const handleClick = useCallback(() => onSort(column), [column, onSort]);

	const alignClass = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest",
				"transition-colors duration-150",
				"hover:text-primary",
				"focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:rounded",
				isActive ? "text-primary" : "text-muted",
				alignClass,
				className,
			)}
			aria-label={`Sort by ${label} ${isActive ? (sortDirection === "asc" ? "ascending" : "descending") : ""}`}
		>
			<span>{label}</span>
			{isActive ? (
				sortDirection === "asc" ? (
					<ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
				) : (
					<ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
				)
			) : (
				<ArrowUpDown className="size-3 shrink-0 opacity-40" aria-hidden="true" />
			)}
		</button>
	);
}

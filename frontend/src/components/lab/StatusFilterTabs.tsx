"use client";

import { useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { LabStatus } from "@/lib/lab";

export type StatusFilter = LabStatus | "all";

interface StatusFilterTabsProps {
	activeFilter: StatusFilter;
	onFilterChange: (filter: StatusFilter) => void;
	filterCounts: Record<StatusFilter, number>;
	disabled?: boolean;
	className?: string;
}

// Color accent per status for the active chip
const STATUS_ACCENT: Record<StatusFilter, string> = {
	all:        "bg-primary text-white",
	critical:   "bg-destructive text-white",
	high:       "bg-warning text-white",
	borderline: "bg-info text-white",
	normal:     "bg-success text-white",
	low:        "bg-warning text-white",
	unknown:    "bg-muted text-white",
};

const TABS: { value: StatusFilter; label: string }[] = [
	{ value: "all",        label: "All" },
	{ value: "critical",   label: "Critical" },
	{ value: "high",       label: "High" },
	{ value: "borderline", label: "Borderline" },
	{ value: "normal",     label: "Normal" },
	{ value: "low",        label: "Low" },
];

export function StatusFilterTabs({
	activeFilter,
	onFilterChange,
	filterCounts,
	disabled = false,
	className,
}: StatusFilterTabsProps) {
	const handleTabClick = useCallback(
		(filter: StatusFilter) => { if (!disabled) onFilterChange(filter); },
		[disabled, onFilterChange],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLButtonElement>, filter: StatusFilter) => {
			if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTabClick(filter); }
		},
		[handleTabClick],
	);

	return (
		<div
			className={cn("flex flex-wrap gap-1.5", className)}
			role="tablist"
			aria-label="Filter lab components by status"
		>
			{TABS.map((tab) => {
				const isActive = activeFilter === tab.value;
				const count = filterCounts[tab.value] ?? 0;

				return (
					<button
						key={tab.value}
						type="button"
						role="tab"
						aria-selected={isActive}
						aria-label={`${tab.label} (${count})`}
						onClick={() => handleTabClick(tab.value)}
						onKeyDown={(e) => handleKeyDown(e, tab.value)}
						disabled={disabled}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
							"transition-all duration-200",
							"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
							"disabled:cursor-not-allowed disabled:opacity-50",
							isActive
								? STATUS_ACCENT[tab.value]
								: "bg-background text-muted hover:bg-border hover:text-foreground border border-border",
						)}
					>
						{tab.label}
						<span
							className={cn(
								"flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
								isActive ? "bg-white/25 text-white" : "bg-border text-muted",
							)}
							aria-hidden="true"
						>
							{count}
						</span>
					</button>
				);
			})}
		</div>
	);
}

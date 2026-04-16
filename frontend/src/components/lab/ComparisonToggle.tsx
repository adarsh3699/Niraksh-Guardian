"use client";

import { useCallback } from "react";
import { GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonToggleProps {
	isActive: boolean;
	hasPreviousReport: boolean;
	onToggle: () => void;
	className?: string;
}

export function ComparisonToggle({ isActive, hasPreviousReport, onToggle, className }: ComparisonToggleProps) {
	const isDisabled = !hasPreviousReport;

	const handleClick = useCallback(() => {
		if (!isDisabled) onToggle();
	}, [isDisabled, onToggle]);

	return (
		<div className={cn("relative inline-flex", className)}>
			{isDisabled ? (
				<div className="group relative inline-flex">
					<button
						type="button"
						disabled
						aria-pressed={false}
						aria-label="Compare with previous report — No previous report available"
						className={cn(
							"inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
							"border border-border bg-surface text-muted",
							"cursor-not-allowed opacity-50",
						)}
					>
						<GitCompare className="size-4" aria-hidden="true" />
						<span>Compare with previous</span>
					</button>
					<div
						role="tooltip"
						className={cn(
							"pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2",
							"whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium",
							"bg-foreground text-background shadow-dropdown",
							"opacity-0 transition-opacity duration-150",
							"group-hover:opacity-100 group-focus-within:opacity-100",
						)}
					>
						No previous report available
						<span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" aria-hidden="true" />
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={handleClick}
					aria-pressed={isActive}
					aria-label={isActive ? "Disable comparison with previous report" : "Compare with previous report"}
					className={cn(
						"inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
						"transition-all duration-200",
						"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
						isActive
							? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
							: "border border-border bg-surface text-muted hover:bg-border hover:text-foreground",
					)}
				>
					<GitCompare className="size-4" aria-hidden="true" />
					<span>Compare with previous</span>
				</button>
			)}
		</div>
	);
}

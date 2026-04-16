"use client";

import { useCallback, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySectionProps {
	categoryName: string;
	componentCount: number;
	isExpanded: boolean;
	onToggle: (categoryName: string) => void;
	children: ReactNode;
}

export function CategorySection({
	categoryName,
	componentCount,
	isExpanded,
	onToggle,
	children,
}: CategorySectionProps) {
	const handleHeaderClick = useCallback(() => onToggle(categoryName), [categoryName, onToggle]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleHeaderClick(); }
		},
		[handleHeaderClick],
	);

	return (
		<>
			{/* Category header row */}
			<tr className="border-b border-border bg-background">
				<td colSpan={6} className="px-0 py-0">
					<button
						type="button"
						onClick={handleHeaderClick}
						onKeyDown={handleKeyDown}
						className={cn(
							"flex w-full items-center justify-between gap-4 px-4 py-2.5",
							"hover:bg-primary/5",
							"transition-colors duration-150",
							"focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
						)}
						aria-expanded={isExpanded}
						aria-controls={`category-${categoryName.toLowerCase().replace(/\s+/g, "-")}`}
						aria-label={`${isExpanded ? "Collapse" : "Expand"} ${categoryName} (${componentCount})`}
					>
						<div className="flex items-center gap-2">
							<span className="text-xs font-bold uppercase tracking-widest text-foreground/70">{categoryName}</span>
							<span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
								{componentCount}
							</span>
						</div>
						<ChevronDown
							className={cn("size-3.5 text-muted transition-transform duration-200", isExpanded && "rotate-180")}
							aria-hidden="true"
						/>
					</button>
				</td>
			</tr>

			{/* Category content rows */}
			{isExpanded && children}
		</>
	);
}

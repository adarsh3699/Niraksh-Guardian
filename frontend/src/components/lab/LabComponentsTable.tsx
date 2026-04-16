"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortableColumnHeader } from "./SortableColumnHeader";
import { ComponentRow } from "./ComponentRow";
import { CategorySection } from "./CategorySection";
import type { LabReportComponent } from "@/types/report";
import type { SortColumn, SortDirection } from "@/lib/lab";

export interface ComponentNote {
	id: string;
	note: string;
	createdAt: string;
	updatedAt: string;
}

interface LabComponentsTableProps {
	components: LabReportComponent[];
	sortColumn: SortColumn;
	sortDirection: SortDirection;
	onSort: (column: SortColumn) => void;
	categoryExpanded: Record<string, boolean>;
	onToggleCategory: (category: string) => void;
	comparisonMode: boolean;
	previousComponents?: LabReportComponent[];
	onComponentSelect: (componentId: string) => void;
	onAddNote: (componentId: string, note: string) => void;
	onEditNote: (componentId: string, noteId: string, note: string) => void;
	onDeleteNote: (componentId: string, noteId: string) => void;
	notes: Record<string, ComponentNote[]>;
	className?: string;
}

export function LabComponentsTable({
	components,
	sortColumn,
	sortDirection,
	onSort,
	categoryExpanded,
	onToggleCategory,
	comparisonMode,
	previousComponents = [],
	onComponentSelect,
	onAddNote,
	onEditNote,
	onDeleteNote,
	notes,
	className,
}: LabComponentsTableProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [showLeft, setShowLeft] = useState(false);
	const [showRight, setShowRight] = useState(false);

	const updateShadows = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		setShowLeft(el.scrollLeft > 0);
		setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
	}, []);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		updateShadows();
		el.addEventListener("scroll", updateShadows, { passive: true });
		const ro = new ResizeObserver(updateShadows);
		ro.observe(el);
		return () => { el.removeEventListener("scroll", updateShadows); ro.disconnect(); };
	}, [updateShadows]);

	const componentsByCategory = useMemo(() => {
		const groups: Record<string, LabReportComponent[]> = {};
		for (const c of components) {
			const cat = c.category || "Other";
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(c);
		}
		return groups;
	}, [components]);

	const previousMap = useMemo(() => {
		const m = new Map<string, LabReportComponent>();
		for (const c of previousComponents) m.set(c.componentName, c);
		return m;
	}, [previousComponents]);

	if (components.length === 0) {
		return (
			<div className={cn("rounded-xl border border-border bg-surface p-12 text-center shadow-card", className)}>
				<Search className="mx-auto mb-3 size-10 text-border" aria-hidden="true" />
				<p className="text-sm font-semibold text-foreground">No components found</p>
				<p className="mt-1 text-xs text-muted">Try adjusting your search or filter</p>
			</div>
		);
	}

	return (
		<div className={cn("rounded-xl border border-border bg-surface shadow-card overflow-hidden", className)}>
			<div className="relative">
				{/* Scroll shadows */}
				<div aria-hidden="true" className={cn("pointer-events-none absolute inset-y-0 left-0 z-20 w-6 bg-linear-to-r from-surface to-transparent transition-opacity duration-200", showLeft ? "opacity-100" : "opacity-0")} />
				<div aria-hidden="true" className={cn("pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-linear-to-l from-surface to-transparent transition-opacity duration-200", showRight ? "opacity-100" : "opacity-0")} />

				<div ref={scrollRef} className="overflow-x-auto">
					{/* Fixed-width table with exact column widths */}
					<table className="w-full table-fixed border-collapse min-w-[720px]">
						<colgroup>
							<col style={{ width: "30%" }} />
							<col style={{ width: "18%" }} />
							<col style={{ width: "12%" }} />
							<col style={{ width: "12%" }} />
							<col style={{ width: "13%" }} />
							<col style={{ width: "15%" }} />
						</colgroup>

						{/* Sticky header */}
						<thead className="sticky top-0 z-10 bg-background border-b border-border">
							<tr>
								<th scope="col" className="px-4 py-3 text-left">
									<SortableColumnHeader column="name" label="Component" activeColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} align="left" />
								</th>
								<th scope="col" className="px-4 py-3 text-left">
									<SortableColumnHeader column="value" label="Value" activeColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} align="left" />
								</th>
								<th scope="col" className="px-4 py-3 text-right">
									<span className="text-xs font-semibold uppercase tracking-widest text-muted">Min</span>
								</th>
								<th scope="col" className="px-4 py-3 text-right">
									<span className="text-xs font-semibold uppercase tracking-widest text-muted">Max</span>
								</th>
								<th scope="col" className="px-4 py-3 text-center">
									<SortableColumnHeader column="status" label="Status" activeColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} align="center" />
								</th>
								<th scope="col" className="px-4 py-3 text-center">
									<span className="text-xs font-semibold uppercase tracking-widest text-muted">Actions</span>
								</th>
							</tr>
						</thead>

						{/* Body — grouped by category */}
						<tbody>
							{Object.entries(componentsByCategory).map(([category, cats]) => (
								<CategorySection
									key={category}
									categoryName={category}
									componentCount={cats.length}
									isExpanded={categoryExpanded[category] ?? true}
									onToggle={onToggleCategory}
								>
									{cats.map((component) => (
										<ComponentRow
											key={component.id}
											component={component}
											previousComponent={previousMap.get(component.componentName)}
											comparisonMode={comparisonMode}
											notes={notes[component.id] || []}
											onComponentSelect={onComponentSelect}
											onAddNote={onAddNote}
											onEditNote={onEditNote}
											onDeleteNote={onDeleteNote}
										/>
									))}
								</CategorySection>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

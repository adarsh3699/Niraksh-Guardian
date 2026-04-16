"use client";

import { SearchInput } from "./SearchInput";
import { StatusFilterTabs, type StatusFilter } from "./StatusFilterTabs";
import { ExportDropdown, type ExportFormat } from "./ExportDropdown";
import { cn } from "@/lib/utils";

interface LabAnalysisHeaderProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onClearSearch: () => void;
	activeFilter: StatusFilter;
	onFilterChange: (filter: StatusFilter) => void;
	filterCounts: Record<StatusFilter, number>;
	onExport: (format: ExportFormat) => void;
	reportId: string | null;
	disabled?: boolean;
	className?: string;
}

export function LabAnalysisHeader({
	searchQuery,
	onSearchChange,
	onClearSearch,
	activeFilter,
	onFilterChange,
	filterCounts,
	onExport,
	reportId,
	disabled = false,
	className,
}: LabAnalysisHeaderProps) {
	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{/* Row 1: search + export */}
			<div className="flex items-center gap-3 justify-between">
				<div className="flex-1">
					<SearchInput
						value={searchQuery}
						onSearchChange={onSearchChange}
						onClear={onClearSearch}
						placeholder="Search components..."
						disabled={disabled}
					/>
				</div>
				{reportId && (
					<ExportDropdown onExport={onExport} disabled={disabled} />
				)}
			</div>

			{/* Row 2: filter chips */}
			<StatusFilterTabs
				activeFilter={activeFilter}
				onFilterChange={onFilterChange}
				filterCounts={filterCounts}
				disabled={disabled}
			/>
		</div>
	);
}

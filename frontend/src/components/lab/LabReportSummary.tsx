"use client";

import { StatCard } from "./StatCard";
import { RiskScoreGauge } from "./RiskScoreGauge";
import { PanelGroupBadge, type PanelHealthStatus } from "./PanelGroupBadge";
import { cn } from "@/lib/utils";

export interface PanelGroupSummary {
	category: string;
	healthStatus: PanelHealthStatus;
}

export interface LabReportSummaryProps {
	criticalCount: number;
	normalCount: number;
	totalCount?: number;
	riskScore: number;
	panelGroups: PanelGroupSummary[];
	onPanelBadgeClick: (category: string) => void;
	className?: string;
}

export function LabReportSummary({
	criticalCount,
	normalCount,
	totalCount,
	riskScore,
	panelGroups,
	onPanelBadgeClick,
	className,
}: LabReportSummaryProps) {
	return (
		<div className={cn("rounded-xl border border-border bg-surface shadow-card overflow-hidden", className)}>
			{/* Top accent line */}
			<div className="h-0.5 bg-linear-to-r from-accent via-primary to-primary-light" />

			<div className="p-5 flex flex-col gap-5">
				{/* 3-column summary grid */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
					{/* Health Score — hero element */}
					<div className="flex flex-col items-center justify-center sm:order-2 py-2">
						<RiskScoreGauge score={riskScore} size={148} />
					</div>

					{/* Critical values */}
					<div className="sm:order-1">
						<StatCard
							label="Critical values"
							value={criticalCount}
							subtext={criticalCount > 0 ? "Requires immediate attention" : "No critical values"}
							variant={criticalCount > 0 ? "critical" : "default"}
						/>
					</div>

					{/* Normal components */}
					<div className="sm:order-3">
						<StatCard
							label="Normal components"
							value={normalCount}
							subtext={totalCount ? `Out of ${totalCount} total` : undefined}
							variant={normalCount > 0 ? "success" : "default"}
						/>
					</div>
				</div>

				{/* Panel group badges */}
				{panelGroups.length > 0 && (
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Panel Groups</p>
						<div
							className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5"
							role="list"
							aria-label="Panel group health status"
						>
							{panelGroups.map((group) => (
								<div key={group.category} role="listitem" className="shrink-0">
									<PanelGroupBadge category={group.category} healthStatus={group.healthStatus} onBadgeClick={onPanelBadgeClick} />
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import { cn } from "@/lib/utils";
import type { LabReportComponent } from "@/types/report";

// Displays related health conditions with name, description, and risk level badge.

interface RelatedConditionsSectionProps {
	component: LabReportComponent;
	className?: string;
}

export function RelatedConditionsSection({
	component,
	className,
}: RelatedConditionsSectionProps) {
	if (!component.relatedConditions || component.relatedConditions.length === 0) {
		return (
			<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
				<h3 className="text-lg font-semibold text-foreground mb-2">
					Related Conditions
				</h3>
				<p className="text-sm text-muted">
					No related conditions identified for this component
				</p>
			</div>
		);
	}

	const riskLevelStyles = {
		low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
		moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
		high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
	};

	return (
		<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
			<h3 className="text-lg font-semibold text-foreground mb-3">
				Related Conditions
			</h3>

			<div className="space-y-3">
				{component.relatedConditions.map((condition, index) => (
					<div
						key={`${condition.name}-${index}`}
						className={cn(
							"rounded-lg border border-border bg-background p-3",
							"transition-all duration-200",
							"hover:border-primary/30 hover:shadow-sm",
						)}
					>
						<div className="flex items-start justify-between gap-3 mb-2">
							<h4 className="text-sm font-semibold text-foreground">
								{condition.name}
							</h4>
							<span
								className={cn(
									"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border shrink-0",
									riskLevelStyles[condition.riskLevel],
								)}
								aria-label={`Risk level: ${condition.riskLevel}`}
							>
								{condition.riskLevel.charAt(0).toUpperCase() + condition.riskLevel.slice(1)}
							</span>
						</div>

						<p className="text-sm text-muted leading-relaxed">
							{condition.description}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

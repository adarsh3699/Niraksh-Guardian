"use client";

import { cn } from "@/lib/utils";
import type { LabReportComponent } from "@/types/report";

// Displays AI-generated insight text and urgency label for a lab component.

interface AIInsightSectionProps {
	component: LabReportComponent;
	className?: string;
}

export function AIInsightSection({
	component,
	className,
}: AIInsightSectionProps) {
	if (!component.aiInsight) {
		return (
			<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
				<h3 className="text-lg font-semibold text-foreground mb-2">
					AI Insights
				</h3>
				<p className="text-sm text-muted">
					AI insights not available for this component
				</p>
			</div>
		);
	}

	const urgencyStyles = {
		immediate: {
			badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
			label: "Immediate attention",
		},
		monitor: {
			badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
			label: "Monitor closely",
		},
		routine: {
			badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
			label: "Routine follow-up",
		},
	};

	const urgency = component.urgency || "routine";
	const urgencyStyle = urgencyStyles[urgency];

	return (
		<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
			<div className="flex items-center justify-between gap-3 mb-3">
				<h3 className="text-lg font-semibold text-foreground">
					AI Insights
				</h3>
				<span
					className={cn(
						"inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border",
						urgencyStyle.badge,
					)}
					aria-label={`Urgency level: ${urgencyStyle.label}`}
				>
					{urgencyStyle.label}
				</span>
			</div>

			<p className="text-sm text-foreground leading-relaxed">
				{component.aiInsight}
			</p>
		</div>
	);
}

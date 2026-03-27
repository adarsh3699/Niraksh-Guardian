"use client";

import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SymptomInsightData } from "@/types/doctor";

const SEVERITY_STYLES: Record<string, string> = {
	Mild: "bg-green-100 text-green-800 border-green-200",
	Moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
	Severe: "bg-orange-100 text-orange-800 border-orange-200",
	Emergency: "bg-red-100 text-red-800 border-red-200",
};

interface SymptomInsightProps {
	insight: SymptomInsightData;
}

export function SymptomInsight({ insight }: SymptomInsightProps) {
	return (
		<div className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
			<div className="flex items-center gap-2">
				<Activity className="size-4 text-primary" />
				<h4 className="text-sm font-bold text-foreground">Clinical Insight</h4>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{/* Severity badge — same color mapping as SymptomAnalysis.tsx */}
				<span
					className={cn(
						"inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
						SEVERITY_STYLES[insight.severity] ?? "bg-gray-100 text-gray-800",
					)}
				>
					{insight.severity}
				</span>

				{/* Category */}
				<span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
					{insight.category}
				</span>

				{/* Affected system */}
				<span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
					{insight.affectedSystem}
				</span>
			</div>

			{/* Summary */}
			<p className="text-sm leading-relaxed text-muted">{insight.summary}</p>
		</div>
	);
}

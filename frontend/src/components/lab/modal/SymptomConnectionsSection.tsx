"use client";

import { cn } from "@/lib/utils";
import type { LabReportComponent } from "@/types/report";

// Displays clickable symptom chips that may be connected to the component's abnormal values.

interface SymptomConnectionsSectionProps {
	component: LabReportComponent;
	onSymptomClick: (symptom: string) => void;
	className?: string;
}

export function SymptomConnectionsSection({
	component,
	onSymptomClick,
	className,
}: SymptomConnectionsSectionProps) {
	if (!component.symptomConnections || component.symptomConnections.length === 0) {
		return (
			<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
				<h3 className="text-lg font-semibold text-foreground mb-2">
					Symptom Connections
				</h3>
				<p className="text-sm text-muted">
					No symptom connections identified for this component
				</p>
			</div>
		);
	}

	return (
		<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
			<h3 className="text-lg font-semibold text-foreground mb-3">
				Symptom Connections
			</h3>

			<div className="flex flex-wrap gap-2">
				{component.symptomConnections.map((symptom) => (
					<button
						key={symptom}
						type="button"
						onClick={() => onSymptomClick(symptom)}
						className={cn(
							"inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium",
							"bg-primary/8 text-primary border border-primary/20",
							"transition-all duration-200",
							"hover:bg-primary/15 hover:border-primary/30 hover:shadow-sm",
							"focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
							"active:scale-95",
						)}
						aria-label={`Cross-reference symptom: ${symptom}`}
					>
						{symptom}
					</button>
				))}
			</div>

			<p className="text-xs text-muted mt-3">
				Click on a symptom to cross-reference with your symptom history
			</p>
		</div>
	);
}

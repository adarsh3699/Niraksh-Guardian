"use client";

import { cn } from "@/lib/utils";
import type { LabReportComponent } from "@/types/report";

// Displays actionable next-step guidance and a "Find a specialist" button for a lab component.

interface GuidanceSectionProps {
	component: LabReportComponent;
	onFindSpecialist: (specialization: string) => void;
	className?: string;
}

const CATEGORY_SPECIALIZATION: Record<string, string> = {
	"Lipid Panel": "Cardiologist",
	"Hematology": "General Physician",
	"Thyroid": "Endocrinologist",
	"Metabolic": "Endocrinologist",
	"Liver": "Gastroenterologist",
	"Kidney": "Nephrologist",
	"Electrolytes": "General Physician",
	"Vitamins": "General Physician",
	"Hormones": "Endocrinologist",
	"Microbiology": "General Physician",
};

export function GuidanceSection({
	component,
	onFindSpecialist,
	className,
}: GuidanceSectionProps) {
	const specialization =
		(component.category && CATEGORY_SPECIALIZATION[component.category]) ||
		"General Physician";

	const findSpecialistButton = (
		<button
			type="button"
			onClick={() => onFindSpecialist(specialization)}
			className={cn(
				"inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5",
				"bg-primary text-primary-foreground font-medium text-sm",
				"transition-all duration-200",
				"hover:bg-primary/90 hover:shadow-md",
				"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
				"active:scale-95",
			)}
			aria-label={`Find a ${specialization}`}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M11 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
				<path d="M18 21a8 8 0 0 0-14 0" />
				<path d="M15 11h6" />
				<path d="M18 8v6" />
			</svg>
			Find a specialist
		</button>
	);

	if (!component.whatToDoNext) {
		return (
			<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
				<h3 className="text-lg font-semibold text-foreground mb-2">
					What to do next
				</h3>
				<p className="text-sm text-muted mb-4">
					No specific guidance available for this component
				</p>
				{findSpecialistButton}
			</div>
		);
	}

	return (
		<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
			<h3 className="text-lg font-semibold text-foreground mb-3">
				What to do next
			</h3>

			<p className="text-sm text-foreground leading-relaxed mb-4">
				{component.whatToDoNext}
			</p>

			{findSpecialistButton}
		</div>
	);
}

"use client";

import { QUICK_SYMPTOMS } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  QuickSymptoms — clickable chips above the chat input              */
/* ------------------------------------------------------------------ */

interface QuickSymptomsProps {
	onSelect: (symptom: string) => void;
}

export function QuickSymptoms({ onSelect }: QuickSymptomsProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{QUICK_SYMPTOMS.map((symptom) => (
				<button
					key={symptom}
					onClick={() => onSelect(symptom)}
					className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
				>
					{symptom}
				</button>
			))}
		</div>
	);
}

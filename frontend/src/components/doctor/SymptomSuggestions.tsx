"use client";

import { Lightbulb } from "lucide-react";

interface SymptomSuggestionsProps {
	symptoms: string[];
	message: string;
	suggestedSymptoms: string[];
	onSelect: (symptom: string) => void;
}

export function SymptomSuggestions({
	message,
	suggestedSymptoms,
	onSelect,
}: SymptomSuggestionsProps) {
	return (
		<div className="space-y-3 rounded-xl border border-yellow-200 bg-yellow-50/50 p-4">
			<div className="flex items-center gap-2">
				<Lightbulb className="size-4 text-yellow-600" />
				<p className="text-sm font-medium text-yellow-800">{message}</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{suggestedSymptoms.map((symptom) => (
					<button
						key={symptom}
						type="button"
						onClick={() => onSelect(symptom)}
						className="inline-flex items-center rounded-full border border-yellow-300 bg-white px-3 py-1.5 text-xs font-medium text-yellow-800 transition-colors hover:bg-yellow-100 hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-300"
					>
						+ {symptom}
					</button>
				))}
			</div>
		</div>
	);
}

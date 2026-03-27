"use client";

interface SymptomBreakdownProps {
	symptoms: string[];
}

export function SymptomBreakdown({ symptoms }: SymptomBreakdownProps) {
	if (symptoms.length === 0) return null;

	return (
		<div className="space-y-2">
			<h4 className="text-sm font-semibold text-foreground">Extracted Symptoms</h4>
			<div className="flex flex-wrap gap-2">
				{symptoms.map((symptom) => (
					<span
						key={symptom}
						className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
					>
						{symptom}
					</span>
				))}
			</div>
		</div>
	);
}

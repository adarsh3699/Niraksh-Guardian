"use client";

import { useCallback, useEffect, useRef, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionState } from "@/hooks/useSessionState";
import { useDrugInteraction } from "@/hooks/useHealthTools";
import { AnalysisResult, AnalysisResultSkeleton } from "@/components/health-tools/AnalysisResult";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Plus, X, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  DrugInteractionClient                                              */
/* ------------------------------------------------------------------ */

export function DrugInteractionClient() {
	const searchParams = useSearchParams();
	const urlMedicines = searchParams.get("medicines");
	const lastAutoRunKeyRef = useRef<string>("");

	const [medicines, setMedicines] = useSessionState<string[]>("ng:drug-interaction:medicines", [
		"",
	]);
	const { result, isLoading, error, checkInteraction, reset } = useDrugInteraction();

	// Keep URL-driven navigation authoritative over session state.
	useEffect(() => {
		if (!urlMedicines) return;

		const nextList = urlMedicines
			.split(",")
			.map((m) => decodeURIComponent(m).trim())
			.filter(Boolean);
		if (nextList.length === 0) nextList.push("");

		const normalizeKey = (list: string[]) =>
			list
				.map((item) => item.trim().toLowerCase())
				.filter(Boolean)
				.join("|");

		const incomingKey = normalizeKey(nextList);
		const currentKey = normalizeKey(medicines);

		if (incomingKey !== currentKey) {
			setMedicines(nextList);
			reset();
		}

		if (incomingKey && incomingKey !== lastAutoRunKeyRef.current) {
			lastAutoRunKeyRef.current = incomingKey;
			void checkInteraction(nextList);
		}
	}, [urlMedicines, medicines, setMedicines, reset, checkInteraction]);

	const handleChange = useCallback(
		(index: number, value: string) => {
			setMedicines((prev) => {
				const next = [...prev];
				next[index] = value;
				return next;
			});
		},
		[setMedicines],
	);

	const handleAdd = useCallback(() => {
		setMedicines((prev) => [...prev, ""]);
	}, [setMedicines]);

	const handleRemove = useCallback(
		(index: number) => {
			setMedicines((prev) => {
				if (prev.length <= 1) return prev; // Min 1
				return prev.filter((_, i) => i !== index);
			});
		},
		[setMedicines],
	);

	const filledCount = medicines.filter((m) => m.trim()).length;
	const resultMode = result?.mode ?? (filledCount === 1 ? "personalized" : "direct");

	const handleSubmit = useCallback(
		async (e?: FormEvent) => {
			e?.preventDefault();
			const cleaned = medicines.map((m) => m.trim()).filter(Boolean);
			if (cleaned.length < 1) return;
			await checkInteraction(cleaned);
		},
		[medicines, checkInteraction],
	);

	const handleReset = useCallback(() => {
		reset();
		setMedicines([""]);
	}, [reset, setMedicines]);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<div className="mb-2 flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
						<AlertTriangle className="size-5 text-warning" />
					</div>
					<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
						Drug Interaction Checker
					</h1>
				</div>
				<p className="text-sm text-muted sm:text-base">
					Enter one medicine for a personalized safety check against your last 1 year prescription
					history and symptom-based disease context, or enter two or more medicines for direct
					drug-drug interaction analysis.
				</p>
			</div>

			<div className="space-y-6">
				{/* Input section */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
					<h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
						Enter Medicines
					</h2>

					<form onSubmit={handleSubmit} className="space-y-3">
						{medicines.map((med, i) => (
							<div key={i} className="flex items-center gap-2">
								<span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
									{i + 1}
								</span>
								<input
									type="text"
									value={med}
									onChange={(e) => handleChange(i, e.target.value)}
									placeholder={`Medicine ${i + 1}`}
									className={cn(
										"h-11 flex-1 rounded-lg border border-border bg-background px-4 text-sm text-foreground",
										"placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
									)}
									disabled={isLoading}
								/>
								{medicines.length > 1 && (
									<button
										type="button"
										onClick={() => handleRemove(i)}
										disabled={isLoading}
										className="rounded-lg p-2 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
										aria-label={`Remove medicine ${i + 1}`}
									>
										<X className="size-4" />
									</button>
								)}
							</div>
						))}

						{/* Add more */}
						<button
							type="button"
							onClick={handleAdd}
							disabled={isLoading}
							className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
						>
							<Plus className="size-4" />
							Add another medicine
						</button>

						{/* Actions */}
						<div className="flex items-center gap-3 pt-1">
							<Button
								type="submit"
								variant="primary"
								size="md"
								disabled={filledCount < 1 || isLoading}
								loading={isLoading}
							>
								<Search className="mr-1.5 size-4" />
								{filledCount === 1 ? "Check Personalized Safety" : "Check Interactions"}
							</Button>

							{(result || medicines.some((m) => m.trim())) && (
								<Button
									type="button"
									variant="ghost"
									size="md"
									onClick={handleReset}
									disabled={isLoading}
								>
									<RotateCcw className="mr-1.5 size-4" />
									Clear
								</Button>
							)}
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}
					</form>
				</div>

				{/* Loading */}
				{isLoading && <AnalysisResultSkeleton />}

				{/* Result */}
				{result && (
					<div className="space-y-3">
						<div className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
							Mode:
							{resultMode === "personalized"
								? "Personalized (history + disease context)"
								: "Direct interaction"}
						</div>
						<AnalysisResult description={result.description} title="Interaction Analysis" />
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import React, { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionState } from "@/hooks/useSessionState";
import { useDrugInteraction } from "@/hooks/useHealthTools";
import {
	Plus,
	X,
	Search,
	RotateCcw,
	Activity,
	ShieldCheck,
	ArrowRight,
	Info,
	AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResearchPanel } from "@/components/health-tools/ResearchPanel";
import { AnalysisResult } from "@/components/health-tools/AnalysisResult";

/* ------------------------------------------------------------------ */
/*  DrugInteractionClient                                              */
/* ------------------------------------------------------------------ */

export function DrugInteractionClient() {
	const searchParams = useSearchParams();
	const urlMedicines = searchParams.get("medicines");
	const lastAutoRunKeyRef = useRef<string>("");
	const researchSectionRef = useRef<HTMLDivElement | null>(null);
	const [isResearchOpen, setIsResearchOpen] = useState(false);

	const [medicines, setMedicines] = useSessionState<string[]>("ng:drug-interaction:medicines", [
		"",
	]);
	const [activeMode, setActiveMode] = useState<"personal" | "direct">("direct");
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
	// Deriving mode based on filled inputs if not explicitly set
	const currentMode = activeMode;
	useEffect(() => {
		if (filledCount <= 1 && currentMode !== "personal") {
			setActiveMode("personal");
		} else if (filledCount > 1 && currentMode !== "direct") {
			setActiveMode("direct");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filledCount]);

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
		setIsResearchOpen(false);
	}, [reset, setMedicines]);

	const handleViewResearch = useCallback(() => {
		setIsResearchOpen(true);
		researchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Page Header */}
			<div className="mb-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
				<h1 className="mb-3 flex items-center gap-3 font-heading text-3xl text-foreground">
					<div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
						<Activity className="size-[22px] text-accent" />
					</div>
					Drug Interaction Checker
				</h1>
				<p className="max-w-2xl text-[14px] leading-relaxed text-muted">
					Enter one medicine for a safety check against your prescription history, or two or more
					for direct drug-drug interaction analysis.
				</p>
			</div>

			{/* Mode toggle */}
			<div className="mb-4 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-75 fill-mode-both">
				<button
					onClick={() => setActiveMode("personal")}
					className={cn(
						"flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all",
						activeMode === "personal"
							? "border-accent bg-accent/10 text-accent font-semibold"
							: "border-border bg-surface text-muted hover:border-accent/40 hover:text-accent",
					)}
				>
					<ShieldCheck className="size-4" /> Personal safety check
				</button>
				<button
					onClick={() => setActiveMode("direct")}
					className={cn(
						"flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all",
						activeMode === "direct"
							? "border-accent bg-accent/10 text-accent font-semibold"
							: "border-border bg-surface text-muted hover:border-accent/40 hover:text-accent",
					)}
				>
					<ArrowRight className="size-4" /> Direct drug-drug analysis
				</button>
			</div>

			<div className="space-y-5">
				{/* Input Card */}
				<div className="group rounded-[24px] border border-border bg-surface p-6 shadow-sm transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100 fill-mode-both">
					<div className="mb-5 flex items-center gap-3 text-base font-semibold text-foreground">
						<div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
							<Activity className="size-5 text-accent" />
						</div>
						Enter medicines to check
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-3">
							{medicines.map((med, i) => (
								<div
									key={i}
									className="flex items-center gap-2.5 animate-in slide-in-from-bottom-1 fade-in duration-300"
								>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-bold text-primary border border-primary/10">
										{i + 1}
									</div>
									<input
										type="text"
										value={med}
										onChange={(e) => handleChange(i, e.target.value)}
										placeholder={`Medicine name (e.g., Paracetamol, Ibuprofen)`}
										className={cn(
											"h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground transition-all",
											"placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/10",
										)}
										disabled={isLoading}
									/>
									{medicines.length > 1 && (
										<button
											type="button"
											onClick={() => handleRemove(i)}
											disabled={isLoading}
											className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted transition-all hover:border-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
											aria-label={`Remove medicine ${i + 1}`}
										>
											<X className="size-4" />
										</button>
									)}
								</div>
							))}
						</div>

						<button
							type="button"
							onClick={handleAdd}
							disabled={isLoading}
							className="group/add mt-2 flex items-center gap-2 px-1 py-1 text-sm font-medium text-primary transition-all hover:text-primary-light disabled:opacity-50"
						>
							<Plus className="size-4 transition-transform group-hover/add:rotate-90" />
							Add another
						</button>

						<div className="mt-5 flex items-center gap-2.5 border-t border-border pt-5">
							<button
								type="submit"
								disabled={filledCount < 1 || isLoading}
								className={cn(
									"flex h-11 items-center gap-2.5 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-all active:scale-[0.98]",
									"hover:bg-primary-light hover:shadow-[0_4px_16px_rgba(68,142,148,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none",
								)}
							>
								<Search className="size-4" />
								<span>Check Interactions</span>
							</button>

							{(result || medicines.some((m) => m.trim())) && (
								<button
									type="button"
									onClick={handleReset}
									disabled={isLoading}
									className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted transition-all hover:bg-surface hover:text-foreground hover:border-border/80 disabled:opacity-50"
								>
									<RotateCcw className="size-4" />
									<span>Clear</span>
								</button>
							)}
						</div>

						{error && (
							<div className="mt-3 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
								<AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}
					</form>
				</div>

				{/* Loader State */}
				{isLoading && (
					<div className="py-14 text-center animate-in fade-in duration-300">
						<div className="mx-auto mb-4 size-[52px] animate-spin rounded-full border-[3px] border-accent/20 border-t-accent" />
						<p className="text-sm font-medium text-muted">Analyzing drug interactions…</p>
						<p className="mt-1.5 text-[12px] text-muted/60">
							Checking clinical databases & mechanisms
						</p>
					</div>
				)}

				{/* Result View */}
				{result && (
					<div className="animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both">
						<div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs text-muted">
							<Activity className="size-3.5" />
							Mode: {activeMode === "personal" ? "Personal safety check" : "Direct interaction"}
						</div>

						{/* Drug Pairs Pill */}
						<div className="mb-5 flex flex-wrap items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-500">
							{medicines
								.filter((m) => m.trim())
								.map((m, i) => (
									<React.Fragment key={i}>
										<span
											className={cn(
												"rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
												i % 2 === 0
													? "border-blue-200/60 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300"
													: "border-green-200/60 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300",
											)}
										>
											{m}
										</span>
										{i < medicines.filter((x) => x.trim()).length - 1 && (
											<div className="text-muted/40">
												<X className="size-4" />
											</div>
										)}
									</React.Fragment>
								))}
						</div>

						<AnalysisResult
							description={result.description}
							title="Detailed Interaction Analysis"
							variant="drug-interaction"
							severity={result.severity}
							riskScore={result.riskScore}
							showResearchButton
							onResearchClick={handleViewResearch}
						/>

						<div ref={researchSectionRef}>
							<ResearchPanel
								query={medicines.filter((m) => m.trim()).join(" + ")}
								hideTriggerButton
								isExternallyOpen={isResearchOpen}
							/>
						</div>
						{/* Disclaimer */}
						<div className="flex items-start gap-3.5 rounded-2xl border border-warning/25 bg-warning/8 p-4 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-300 mt-4">
							<Info className="mt-0.5 size-5 shrink-0 text-warning" />
							<p className="text-sm leading-relaxed text-warning/90 dark:text-warning/85">
								<strong>Disclaimer:</strong> This tool provides informational analysis only and does
								not replace professional medical advice. Always consult a qualified healthcare
								provider or pharmacist before making any changes to your medications.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

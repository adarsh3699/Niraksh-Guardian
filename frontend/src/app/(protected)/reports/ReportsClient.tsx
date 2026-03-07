"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import {
	FileBarChart,
	Download,
	Plus,
	Clock,
	FileText,
	AlertCircle,
	ExternalLink,
	Stethoscope,
	Pill,
	FlaskConical,
	ClipboardList,
	MessageSquare,
} from "lucide-react";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/contexts/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatDate } from "@/lib/utils";
import type { HealthReport } from "@/types/report";

/* ------------------------------------------------------------------ */
/*  Data Source Options                                                */
/* ------------------------------------------------------------------ */

const DATA_SOURCES = [
	{ key: "symptoms", label: "Symptom Analysis", icon: Stethoscope, color: "text-rose-500" },
	{ key: "prescriptions", label: "Prescriptions", icon: ClipboardList, color: "text-blue-500" },
	{ key: "medicines", label: "Medicine Search", icon: Pill, color: "text-emerald-500" },
	{
		key: "drugInteractions",
		label: "Drug Interactions",
		icon: FlaskConical,
		color: "text-amber-500",
	},
	{ key: "chatHistory", label: "Chat History", icon: MessageSquare, color: "text-violet-500" },
] as const;

type SourceKey = (typeof DATA_SOURCES)[number]["key"];

/* ------------------------------------------------------------------ */
/*  ReportsClient                                                      */
/* ------------------------------------------------------------------ */

export function ReportsClient() {
	const { addToast } = useToast();
	const [isGenerating, setIsGenerating] = useState(false);

	// All sources enabled by default
	const [selectedSources, setSelectedSources] = useState<Set<SourceKey>>(
		() => new Set(DATA_SOURCES.map((s) => s.key)),
	);

	const toggleSource = useCallback((key: SourceKey) => {
		setSelectedSources((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	const {
		data: reports,
		isLoading,
		error,
	} = useSWR<HealthReport[]>(API_ROUTES.REPORTS, swrFetcher, {
		revalidateOnFocus: false,
	});

	const handleGenerate = useCallback(async () => {
		if (selectedSources.size === 0) {
			addToast("error", "Please select at least one data source.");
			return;
		}

		setIsGenerating(true);
		try {
			await apiClient(API_ROUTES.GENERATE_REPORT, {
				method: "POST",
				body: { sources: Array.from(selectedSources) },
			});
			await globalMutate(API_ROUTES.REPORTS);
			addToast("success", "Health report generated successfully!");
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Failed to generate report");
		} finally {
			setIsGenerating(false);
		}
	}, [addToast, selectedSources]);

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			{/* Page header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
						<FileBarChart className="size-5 text-primary" />
					</div>
					<div>
						<h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
							Unified Health Report
						</h1>
						<p className="text-sm text-muted">
							AI-generated report combining prescriptions, symptoms & insights
						</p>
					</div>
				</div>

				<Button
					variant="primary"
					onClick={handleGenerate}
					loading={isGenerating}
					disabled={isGenerating}
				>
					<Plus className="mr-1.5 size-4" />
					{isGenerating ? "Generating…" : "Generate Report"}
				</Button>
			</div>

			{/* Data source selector */}
			<div className="rounded-xl border border-border bg-surface p-4 shadow-card">
				<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
					Include data from
				</p>
				<div className="flex flex-wrap gap-2">
					{DATA_SOURCES.map(({ key, label, icon: Icon, color }) => {
						const active = selectedSources.has(key);
						return (
							<button
								key={key}
								type="button"
								onClick={() => toggleSource(key)}
								disabled={isGenerating}
								className={cn(
									"flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
									active
										? "border-primary/40 bg-primary/10 text-primary"
										: "border-border bg-background text-muted hover:bg-border/50",
									isGenerating && "cursor-not-allowed opacity-50",
								)}
								aria-pressed={active}
							>
								<Icon className={cn("size-3.5", active ? color : "text-muted")} />
								{label}
							</button>
						);
					})}
				</div>
				<p className="mt-2 text-[11px] text-muted">
					Health Profile is always included. Toggle additional data sources above.
				</p>
			</div>

			{/* Info banner */}
			<div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
				<AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-500" />
				<p className="text-xs text-blue-700 dark:text-blue-300">
					Reports are generated using your health profile and selected data sources. It may take
					5–10 seconds to generate. Maximum 10 reports are stored (oldest is removed automatically).
				</p>
			</div>

			{/* Generating state */}
			{isGenerating && (
				<div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
					<Spinner size="lg" className="mx-auto mb-3 text-primary" />
					<p className="font-heading text-sm font-bold text-foreground">
						Generating your health report…
					</p>
					<p className="mt-1 text-xs text-muted">
						Analyzing your profile and selected health data to create a comprehensive PDF report.
					</p>
				</div>
			)}

			{/* Content */}
			{error ? (
				<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
					<AlertCircle className="mx-auto mb-3 size-10 text-muted" />
					<p className="font-heading text-base font-bold text-foreground">Failed to load reports</p>
					<p className="mt-1 text-sm text-muted">Please try again later.</p>
				</div>
			) : isLoading ? (
				<div className="flex items-center justify-center py-16">
					<Spinner size="lg" className="text-primary" />
				</div>
			) : !reports || reports.length === 0 ? (
				<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
					<FileText className="mx-auto mb-3 size-10 text-muted" />
					<p className="font-heading text-base font-bold text-foreground">No reports yet</p>
					<p className="mt-1 text-sm text-muted">
						Click &quot;Generate Report&quot; to create your first AI-powered health summary.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					<p className="text-xs font-medium text-muted">
						{reports.length} report{reports.length !== 1 ? "s" : ""}
					</p>
					{reports.map((report, index) => (
						<div
							key={report.id}
							className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-md"
						>
							{/* Icon */}
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
								<FileBarChart className="size-5 text-emerald-500" />
							</div>

							{/* Info */}
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-foreground">
									Health Summary Report #{reports.length - index}
								</p>
								<p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
									<Clock className="size-3" />
									{formatDate(report.createdAt)}
								</p>
							</div>

							{/* Actions */}
							<div className="flex gap-2">
								<a
									href={report.reportUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-border"
								>
									<ExternalLink className="size-3.5" />
									<span className="hidden sm:inline">View</span>
								</a>
								<a
									href={report.reportUrl}
									download
									className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
								>
									<Download className="size-3.5" />
									<span className="hidden sm:inline">Download</span>
								</a>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

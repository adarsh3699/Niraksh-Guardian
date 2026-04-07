"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useSessionState } from "@/hooks/useSessionState";
import { usePrescriptionAnalysis } from "@/hooks/useHealthTools";
import { FileUploadZone } from "@/components/health-tools/FileUploadZone";
import { AnalysisResult, AnalysisResultSkeleton } from "@/components/health-tools/AnalysisResult";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
	FileText,
	ArrowRight,
	Pill,
	RotateCcw,
	AlertTriangle,
	Search,
	FlaskConical,
	Upload,
	TrendingUp,
	TrendingDown,
	Minus,
	Trash2,
} from "lucide-react";
import { apiClient, swrFetcher } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { API_ROUTES } from "@/lib/api-routes";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastProvider";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type {
	AnalyzeLabReportResponse,
	LabReportComponent,
	LabReportDetail,
	LabReportJobStatusResponse,
	LabReportListItem,
} from "@/types/report";

type AnalysisMode = "prescription" | "lab";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ------------------------------------------------------------------ */
/*  PrescriptionClient                                                 */
/* ------------------------------------------------------------------ */

export function PrescriptionClient() {
	const { addToast } = useToast();
	const searchParams = useSearchParams();
	const initialMode = searchParams.get("mode") === "lab" ? "lab" : "prescription";
	const [mode, setMode] = useState<AnalysisMode>(initialMode);

	const [files, setFiles] = useState<File[]>([]);
	const [selectedMedicines, setSelectedMedicines] = useSessionState<string[]>(
		"ng:prescription:selected",
		[],
	);
	const [labFiles, setLabFiles] = useState<File[]>([]);
	const [isLabAnalyzing, setIsLabAnalyzing] = useState(false);
	const [isLabPolling, setIsLabPolling] = useState(false);
	const [labJobId, setLabJobId] = useState<string | null>(null);
	const [labJobStatus, setLabJobStatus] = useState<
		"queued" | "processing" | "completed" | "failed" | null
	>(null);
	const [activeLabId, setActiveLabId] = useState<string | null>(null);
	const [labStatusFilter, setLabStatusFilter] = useState<"all" | "high" | "low" | "normal">("all");
	const [selectedLabComponentId, setSelectedLabComponentId] = useState<string | null>(null);
	const [deletingLabReportId, setDeletingLabReportId] = useState<string | null>(null);
	const [confirmDeleteReportId, setConfirmDeleteReportId] = useState<string | null>(null);

	const { result, isLoading, error, analyze, reset } = usePrescriptionAnalysis();
	const router = useRouter();

	const {
		data: labReports,
		isLoading: isLabListLoading,
		mutate: mutateLabReports,
	} = useSWR<LabReportListItem[]>(mode === "lab" ? API_ROUTES.LAB_REPORTS : null, swrFetcher, {
		revalidateOnFocus: false,
	});

	const { data: activeLabReport, isLoading: isLabDetailLoading } = useSWR<LabReportDetail>(
		mode === "lab" && activeLabId ? API_ROUTES.LAB_REPORT_DETAIL(activeLabId) : null,
		swrFetcher,
		{ revalidateOnFocus: false },
	);

	useEffect(() => {
		if (searchParams.get("mode") === "lab") {
			setMode("lab");
		}
	}, [searchParams]);

	useEffect(() => {
		setSelectedLabComponentId(null);
	}, [activeLabId]);

	const filteredLabComponents = useMemo(() => {
		const components = activeLabReport?.components ?? [];
		if (labStatusFilter === "all") return components;
		return components.filter((component) => component.status === labStatusFilter);
	}, [activeLabReport?.components, labStatusFilter]);

	const selectedLabComponent = useMemo<LabReportComponent | null>(() => {
		if (!selectedLabComponentId || !activeLabReport) return null;
		return (
			activeLabReport.components.find((component) => component.id === selectedLabComponentId) ??
			null
		);
	}, [activeLabReport, selectedLabComponentId]);

	const switchMode = useCallback(
		(nextMode: AnalysisMode) => {
			setMode(nextMode);
			if (nextMode === "lab") {
				router.replace("/prescription?mode=lab");
				return;
			}
			router.replace("/prescription");
		},
		[router],
	);

	const handleAnalyze = useCallback(async () => {
		if (files.length === 0) return;
		setSelectedMedicines([]);
		await analyze(files);
	}, [files, analyze, setSelectedMedicines]);

	const handleReset = useCallback(() => {
		reset();
		setFiles([]);
		setSelectedMedicines([]);
	}, [reset, setSelectedMedicines]);

	/** Toggle a medicine chip on/off */
	const toggleMedicine = useCallback(
		(medicine: string) => {
			setSelectedMedicines((prev) =>
				prev.includes(medicine) ? prev.filter((m) => m !== medicine) : [...prev, medicine],
			);
		},
		[setSelectedMedicines],
	);

	/** Navigate to interaction checker */
	const handleCheckInteractions = useCallback(() => {
		if (selectedMedicines.length >= 1) {
			const params = selectedMedicines.map(encodeURIComponent).join(",");
			router.push(`/drug-interaction?medicines=${params}`);
		}
	}, [selectedMedicines, router]);

	/** Navigate to medicine details when exactly one medicine is selected */
	const handleAboutMedicine = useCallback(() => {
		if (selectedMedicines.length !== 1) return;
		router.push(`/medicine?name=${encodeURIComponent(selectedMedicines[0])}`);
	}, [selectedMedicines, router]);

	const handleAnalyzeLabReport = useCallback(async () => {
		if (!labFiles.length) {
			addToast("error", "Please upload a lab report file first.");
			return;
		}

		setIsLabAnalyzing(true);
		try {
			const formData = new FormData();
			formData.append("file", labFiles[0]);
			const response = await apiClient<AnalyzeLabReportResponse>(API_ROUTES.LAB_REPORT_ANALYZE, {
				method: "POST",
				body: formData,
				isFile: true,
			});

			setActiveLabId(null);
			setSelectedLabComponentId(null);
			setLabJobId(response.jobId);
			setLabJobStatus(response.status);
			setIsLabPolling(true);
			setLabFiles([]);
			addToast("success", "Lab report queued. Processing in background...");
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Failed to analyze report.");
		} finally {
			setIsLabAnalyzing(false);
		}
	}, [addToast, labFiles]);

	const openDeleteDialog = useCallback((reportId: string) => {
		setConfirmDeleteReportId(reportId);
	}, []);

	const handleDeleteLabReport = useCallback(
		async (reportId: string) => {
			setDeletingLabReportId(reportId);
			try {
				await apiClient<{ message: string }>(API_ROUTES.LAB_REPORT_DELETE(reportId), {
					method: "DELETE",
				});

				if (activeLabId === reportId) {
					setActiveLabId(null);
					setSelectedLabComponentId(null);
				}

				await mutateLabReports();
				setConfirmDeleteReportId(null);
				addToast("success", "Lab report deleted successfully.");
			} catch (err) {
				addToast("error", err instanceof Error ? err.message : "Failed to delete lab report.");
			} finally {
				setDeletingLabReportId(null);
			}
		},
		[activeLabId, addToast, mutateLabReports],
	);

	const handleConfirmDeleteLabReport = useCallback(async () => {
		if (!confirmDeleteReportId) return;
		await handleDeleteLabReport(confirmDeleteReportId);
	}, [confirmDeleteReportId, handleDeleteLabReport]);

	useEffect(() => {
		if (!labJobId) return;

		const controller = new AbortController();

		const streamJob = async () => {
			try {
				const accessToken = getAccessToken();
				if (!accessToken) {
					throw new Error("Session expired. Please log in again.");
				}

				const response = await fetch(
					`${API_BASE_URL}${API_ROUTES.LAB_REPORT_JOB_STREAM(labJobId)}`,
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
						signal: controller.signal,
					},
				);

				if (!response.ok || !response.body) {
					throw new Error("Failed to open lab analysis stream.");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const events = buffer.split("\n\n");
					buffer = events.pop() ?? "";

					for (const event of events) {
						const dataLine = event
							.split("\n")
							.find((line) => line.startsWith("data: "))
							?.slice(6);
						if (!dataLine) continue;

						const status = JSON.parse(dataLine) as LabReportJobStatusResponse;
						setLabJobStatus(status.status);

						if (status.status === "completed" && status.reportId) {
							setIsLabPolling(false);
							setLabJobId(null);
							setActiveLabId(status.reportId);
							await mutateLabReports();
							addToast("success", "Lab report analyzed successfully.");
							controller.abort();
							return;
						}

						if (status.status === "failed") {
							setIsLabPolling(false);
							setLabJobId(null);
							addToast("error", status.error || "Lab report analysis failed.");
							controller.abort();
							return;
						}
					}
				}
			} catch (err) {
				if (controller.signal.aborted) return;
				setIsLabPolling(false);
				setLabJobId(null);
				addToast("error", err instanceof Error ? err.message : "Failed to fetch job status.");
			}
		};

		void streamJob();

		return () => {
			controller.abort();
		};
	}, [labJobId, mutateLabReports, addToast]);

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<div className="mb-2 flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
						<FileText className="size-5 text-primary" />
					</div>
					<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
						Prescription & Lab Analysis
					</h1>
				</div>
				<p className="text-sm text-muted sm:text-base">
					Switch between prescription explanations and lab marker interpretation in one workflow.
				</p>

				<div className="mt-5 inline-flex rounded-xl border border-border bg-surface p-1">
					<button
						type="button"
						onClick={() => switchMode("prescription")}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
							mode === "prescription"
								? "bg-primary/10 text-primary"
								: "text-muted hover:bg-background hover:text-foreground",
						)}
						aria-pressed={mode === "prescription"}
					>
						<FileText className="size-4" />
						Prescription
					</button>
					<button
						type="button"
						onClick={() => switchMode("lab")}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
							mode === "lab"
								? "bg-primary/10 text-primary"
								: "text-muted hover:bg-background hover:text-foreground",
						)}
						aria-pressed={mode === "lab"}
					>
						<FlaskConical className="size-4" />
						Lab Analysis
					</button>
				</div>
			</div>

			{/* Prescription mode */}
			{mode === "prescription" && (
				<div className="space-y-6">
					<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
						<h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
							Upload Prescription Images
						</h2>

						<FileUploadZone
							maxFiles={5}
							accept={{
								"image/*": [".png", ".jpg", ".jpeg", ".webp"],
								"application/pdf": [".pdf"],
							}}
							onFilesChange={setFiles}
							disabled={isLoading}
							label="Drop prescription images or PDFs here, or click to browse"
						/>

						<div className="mt-4 flex items-center gap-3">
							<Button
								variant="primary"
								size="md"
								onClick={handleAnalyze}
								disabled={files.length === 0 || isLoading}
								loading={isLoading}
							>
								<FileText className="mr-1.5 size-4" />
								Analyze Prescription
							</Button>

							{(result || files.length > 0) && (
								<Button variant="ghost" size="md" onClick={handleReset} disabled={isLoading}>
									<RotateCcw className="mr-1.5 size-4" />
									Clear
								</Button>
							)}
						</div>

						{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
					</div>

					{isLoading && <AnalysisResultSkeleton />}

					{result && (
						<>
							<AnalysisResult description={result.description} title="Prescription Analysis" />

							{result.medicines && result.medicines.length > 0 && (
								<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
									<h3 className="mb-1 font-heading text-base font-bold text-foreground">
										Extracted Medicines
									</h3>
									<p className="mb-4 text-xs text-muted">
										Select one medicine for personalized safety check, or multiple for direct
										interaction analysis
									</p>

									<div className="mb-4 flex flex-wrap gap-2">
										{result.medicines.map((med) => {
											const isSelected = selectedMedicines.includes(med);
											return (
												<button
													key={med}
													type="button"
													onClick={() => toggleMedicine(med)}
													className={cn(
														"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
														isSelected
															? "border-primary bg-primary/15 text-primary shadow-sm"
															: "border-border bg-background text-muted hover:border-primary/40 hover:text-foreground",
													)}
												>
													<Pill className="size-3" />
													{med}
												</button>
											);
										})}
									</div>

									{selectedMedicines.length === 1 ? (
										<div className="flex flex-wrap items-center gap-2">
											<Button variant="outline" size="md" onClick={handleAboutMedicine}>
												<Search className="mr-1.5 size-4" />
												About This Medicine
												<ArrowRight className="ml-1.5 size-4" />
											</Button>

											<Button variant="outline" size="md" onClick={handleCheckInteractions}>
												<AlertTriangle className="mr-1.5 size-4" />
												Check Drug Interactions
												<ArrowRight className="ml-1.5 size-4" />
											</Button>
										</div>
									) : (
										<Button
											variant="outline"
											size="md"
											onClick={handleCheckInteractions}
											disabled={selectedMedicines.length === 0}
										>
											<AlertTriangle className="mr-1.5 size-4" />
											Check Drug Interactions
											<ArrowRight className="ml-1.5 size-4" />
										</Button>
									)}
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* Lab mode */}
			{mode === "lab" && (
				<div className="space-y-6">
					<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="font-heading text-lg font-semibold text-foreground">
									Upload Lab Report
								</h2>
								<p className="text-sm text-muted">
									Upload PDF or image to classify markers as high, low, or normal.
								</p>
							</div>
							<Button
								variant="primary"
								onClick={handleAnalyzeLabReport}
								disabled={!labFiles.length || isLabAnalyzing || isLabPolling}
								loading={isLabAnalyzing}
							>
								<Upload className="mr-1.5 size-4" />
								{isLabAnalyzing
									? "Submitting..."
									: isLabPolling
										? "Processing..."
										: "Analyze Report"}
							</Button>
						</div>

						<FileUploadZone
							maxFiles={1}
							onFilesChange={setLabFiles}
							accept={{
								"application/pdf": [".pdf"],
								"image/jpeg": [".jpg", ".jpeg"],
								"image/png": [".png"],
								"image/webp": [".webp"],
							}}
							label="Drop lab report (PDF/image) here or click to browse"
							disabled={isLabAnalyzing}
						/>
					</div>

					{!activeLabId && !isLabPolling && (
						<div className="rounded-lg border border-border bg-surface p-4 shadow-card">
							<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
								Recent Analyses
							</p>
							{isLabListLoading ? (
								<div className="py-8 text-center">
									<Spinner className="mx-auto text-primary" />
								</div>
							) : !labReports?.length ? (
								<p className="text-sm text-muted">No lab analyses yet.</p>
							) : (
								<div className="grid gap-3 md:grid-cols-2">
									{labReports.map((report) => (
										<div
											key={report.id}
											className="w-full rounded-lg border border-border bg-background px-3 py-3 text-left"
										>
											<div className="flex items-start justify-between gap-2">
												<button
													type="button"
													onClick={() => setActiveLabId(report.id)}
													className="min-w-0 flex-1 text-left transition-colors hover:text-primary"
												>
													<p className="truncate text-sm font-medium text-foreground">
														{report.fileName}
													</p>
													<p className="mt-1 text-xs text-muted">{formatDate(report.createdAt)}</p>
													<p className="mt-1 text-xs text-muted">
														Abnormal: {report.abnormalCount}/{report.totalCount}
													</p>
												</button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => openDeleteDialog(report.id)}
													disabled={deletingLabReportId === report.id}
												>
													<Trash2 className="size-4 text-destructive" />
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{(activeLabId || isLabPolling) && (
						<div className="rounded-lg border border-border bg-surface p-4 shadow-card">
							{isLabPolling ? (
								<div className="py-12 text-center">
									<Spinner className="mx-auto text-primary" />
									<p className="mt-3 text-sm font-medium text-foreground">
										Analyzing lab report...
									</p>
									<p className="mt-1 text-xs text-muted capitalize">
										Status: {labJobStatus || "processing"}
									</p>
								</div>
							) : isLabDetailLoading ? (
								<div className="py-10 text-center">
									<Spinner className="mx-auto text-primary" />
								</div>
							) : !activeLabReport ? (
								<p className="text-sm text-muted">Unable to load this report. Please try again.</p>
							) : (
								<div className="space-y-4">
									<div className="flex items-center justify-between gap-2">
										<p className="text-sm font-semibold text-foreground">
											{activeLabReport.fileName}
										</p>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => openDeleteDialog(activeLabReport.id)}
												disabled={deletingLabReportId === activeLabReport.id}
											>
												<Trash2 className="mr-1 size-4 text-destructive" /> Delete
											</Button>
											<Button variant="ghost" size="sm" onClick={() => setActiveLabId(null)}>
												View Recent Analyses
											</Button>
										</div>
									</div>

									<div className="grid gap-3 sm:grid-cols-3">
										<div className="rounded-lg border border-border bg-background px-3 py-2">
											<p className="text-xs text-muted">Overall Risk</p>
											<p className="text-sm font-semibold capitalize text-foreground">
												{activeLabReport.overallRisk}
											</p>
										</div>
										<div className="rounded-lg border border-border bg-background px-3 py-2">
											<p className="text-xs text-muted">Abnormal Components</p>
											<p className="text-sm font-semibold text-foreground">
												{activeLabReport.abnormalCount}/{activeLabReport.totalCount}
											</p>
										</div>
										<div className="rounded-lg border border-border bg-background px-3 py-2">
											<p className="text-xs text-muted">Date</p>
											<p className="text-sm font-semibold text-foreground">
												{formatDate(activeLabReport.createdAt)}
											</p>
										</div>
									</div>

									{activeLabReport.overallSummary && (
										<div className="rounded-lg border border-border bg-background px-3 py-3">
											<p className="text-xs font-semibold uppercase tracking-wide text-muted">
												Summary
											</p>
											<p className="mt-1 text-sm text-foreground">
												{activeLabReport.overallSummary}
											</p>
										</div>
									)}

									<div className="flex flex-wrap gap-2">
										{(["all", "high", "low", "normal"] as const).map((status) => (
											<button
												key={status}
												type="button"
												onClick={() => setLabStatusFilter(status)}
												className={cn(
													"rounded-full border px-3 py-1 text-xs font-medium capitalize",
													labStatusFilter === status
														? "border-primary/40 bg-primary/10 text-primary"
														: "border-border bg-background text-muted",
												)}
											>
												{status}
											</button>
										))}
									</div>

									<div className="grid gap-4 xl:grid-cols-[1fr_280px]">
										<div className="overflow-hidden rounded-lg border border-border">
											<div className="overflow-x-auto">
												<table className="min-w-full divide-y divide-border text-sm">
													<thead className="bg-background">
														<tr>
															<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
																Component
															</th>
															<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
																Observed
															</th>
															<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
																Status
															</th>
															<th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">
																Action
															</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-border bg-surface">
														{filteredLabComponents.length === 0 ? (
															<tr>
																<td
																	colSpan={4}
																	className="px-3 py-8 text-center text-sm text-muted"
																>
																	No components in this filter.
																</td>
															</tr>
														) : (
															filteredLabComponents.map((component) => (
																<tr key={component.id}>
																	<td className="px-3 py-2 font-medium text-foreground">
																		{component.componentName}
																	</td>
																	<td className="px-3 py-2 text-muted">
																		{component.observedRaw || "N/A"} {component.unit || ""}
																	</td>
																	<td className="px-3 py-2">
																		<span
																			className={cn(
																				"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
																				component.status === "high" && "bg-red-100 text-red-700",
																				component.status === "low" && "bg-amber-100 text-amber-700",
																				component.status === "normal" &&
																					"bg-emerald-100 text-emerald-700",
																				component.status === "unknown" &&
																					"bg-slate-100 text-slate-700",
																			)}
																		>
																			{component.status === "high" && (
																				<TrendingUp className="size-3" />
																			)}
																			{component.status === "low" && (
																				<TrendingDown className="size-3" />
																			)}
																			{component.status === "normal" && (
																				<Minus className="size-3" />
																			)}
																			{component.status}
																		</span>
																	</td>
																	<td className="px-3 py-2 text-right">
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() => setSelectedLabComponentId(component.id)}
																		>
																			Details
																		</Button>
																	</td>
																</tr>
															))
														)}
													</tbody>
												</table>
											</div>
										</div>

										<aside className="rounded-lg border border-border bg-background p-3">
											<p className="text-xs font-semibold uppercase tracking-wide text-muted">
												Component Detail
											</p>
											{selectedLabComponent ? (
												<div className="mt-3 space-y-2 text-sm">
													<p className="font-semibold text-foreground">
														{selectedLabComponent.componentName}
													</p>
													<p className="text-muted">
														Observed: {selectedLabComponent.observedRaw || "N/A"}{" "}
														{selectedLabComponent.unit || ""}
													</p>
													<p className="text-muted">
														Reference: {selectedLabComponent.referenceMin ?? "N/A"} -{" "}
														{selectedLabComponent.referenceMax ?? "N/A"}
													</p>
													<p className="text-muted">
														{selectedLabComponent.effectSummary || "No effect summary available."}
													</p>
													{typeof selectedLabComponent.confidence === "number" &&
														selectedLabComponent.confidence < 0.55 && (
															<p className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
																<AlertTriangle className="size-3" />
																Low-confidence extraction.
															</p>
														)}
												</div>
											) : (
												<p className="mt-3 text-sm text-muted">
													Click Details on a row to inspect component interpretation.
												</p>
											)}
										</aside>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}

			<ConfirmDialog
				isOpen={Boolean(confirmDeleteReportId)}
				title="Delete Lab Analysis"
				description="Delete this lab analysis permanently? This removes file and report data."
				cancelLabel="Cancel"
				confirmLabel="Delete"
				onCancel={() => {
					if (deletingLabReportId) return;
					setConfirmDeleteReportId(null);
				}}
				onConfirm={handleConfirmDeleteLabReport}
				isLoading={Boolean(deletingLabReportId)}
				isDestructive
			/>
		</div>
	);
}

"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import {
	LabAnalysisHeader,
	SmartAlertBanner,
	LabReportSummary,
	ComparisonToggle,
	LabComponentsTable,
	ComponentDetailModal,
	type StatusFilter,
	type ExportFormat,
	type PanelGroupSummary,
} from "@/components/lab";
import { filterComponentsBySearch, filterComponentsByStatus } from "@/lib/lab";
import { sortComponents, type SortColumn, type SortDirection } from "@/lib/lab";
import { getAlertDismissals, setAlertDismissal } from "@/lib/lab";
import type { LabStatus } from "@/lib/lab";

type AnalysisMode = "prescription" | "lab";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ------------------------------------------------------------------ */
/*  Local types                                                        */
/* ------------------------------------------------------------------ */

interface ComponentNote {
	id: string;
	note: string;
	createdAt: string;
	updatedAt: string;
}

interface PreviousReportResponse {
	reportId: string;
	components: LabReportComponent[];
	createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  PrescriptionClient                                                 */
/* ------------------------------------------------------------------ */

export function PrescriptionClient() {
	const { addToast } = useToast();
	const searchParams = useSearchParams();
	const router = useRouter();
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
	const [deletingLabReportId, setDeletingLabReportId] = useState<string | null>(null);
	const [confirmDeleteReportId, setConfirmDeleteReportId] = useState<string | null>(null);

	// Task 11.1 – new state
	const [searchQuery, setSearchQuery] = useState("");
	const [labStatusFilter, setLabStatusFilter] = useState<StatusFilter>("all");
	const [sortColumn, setSortColumn] = useState<SortColumn>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({
		"Lipid Panel": true,
		Hematology: true,
		Thyroid: true,
		Metabolic: true,
		Liver: true,
		Kidney: true,
		Electrolytes: true,
		Vitamins: true,
		Hormones: true,
		Microbiology: true,
		Other: true,
	});
	const [comparisonMode, setComparisonMode] = useState(false);
	const [selectedLabComponentId, setSelectedLabComponentId] = useState<string | null>(null);
	const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() =>
		getAlertDismissals(),
	);
	// Notes keyed by componentId
	const [notes, setNotes] = useState<Record<string, ComponentNote[]>>({});

	// Accessibility: live region announcement message
	const [liveAnnouncement, setLiveAnnouncement] = useState("");

	const { result, isLoading, error, analyze, reset } = usePrescriptionAnalysis();

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

	// Task 11.1 – SWR hook for previous report (comparison mode)
	const { data: previousReport } = useSWR<PreviousReportResponse>(
		comparisonMode && activeLabId
			? `${API_BASE_URL}/api/reports/lab/${activeLabId}/previous`
			: null,
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

	// Task 11.2 – useMemo: displayedComponents (search + status filter + sort)
	const displayedComponents = useMemo(() => {
		type TypedComponent = LabReportComponent & { status: LabStatus };
		const components = (activeLabReport?.components ?? []) as TypedComponent[];
		const afterSearch = filterComponentsBySearch(components, searchQuery);
		const afterStatus = filterComponentsByStatus(afterSearch, labStatusFilter);
		return sortComponents(afterStatus, sortColumn, sortDirection) as LabReportComponent[];
	}, [activeLabReport?.components, searchQuery, labStatusFilter, sortColumn, sortDirection]);

	// Task 11.2 – useMemo: filterCounts (count per status)
	const filterCounts = useMemo(() => {
		const components = activeLabReport?.components ?? [];
		return {
			all: components.length,
			critical: components.filter((c) => c.status === "critical").length,
			high: components.filter((c) => c.status === "high").length,
			borderline: components.filter((c) => c.status === "borderline").length,
			normal: components.filter((c) => c.status === "normal").length,
			low: components.filter((c) => c.status === "low").length,
			unknown: components.filter((c) => c.status === "unknown").length,
		} satisfies Record<StatusFilter, number>;
	}, [activeLabReport?.components]);

	// Task 11.2 – useMemo: selectedComponent
	const selectedComponent = useMemo<LabReportComponent | null>(() => {
		if (!selectedLabComponentId || !activeLabReport) return null;
		return (
			activeLabReport.components.find((c) => c.id === selectedLabComponentId) ?? null
		);
	}, [selectedLabComponentId, activeLabReport]);

	// Derived: should show smart alert banner
	const shouldShowAlert = useMemo(() => {
		if (!activeLabReport) return false;
		if (dismissedAlerts.has(activeLabReport.id)) return false;
		return filterCounts.critical > 0;
	}, [activeLabReport, dismissedAlerts, filterCounts.critical]);

	// Derived: risk score (0-100) from overallRisk string
	const riskScore = useMemo(() => {
		if (!activeLabReport) return 0;
		const risk = activeLabReport.overallRisk;
		if (risk === "high") return 75;
		if (risk === "moderate") return 45;
		return 15;
	}, [activeLabReport]);

	// Derived: panel group summaries
	const panelGroups = useMemo<PanelGroupSummary[]>(() => {
		if (!activeLabReport) return [];
		const groups: Record<string, string[]> = {};
		for (const c of activeLabReport.components) {
			const cat = c.category || "Other";
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(c.status);
		}
		return Object.entries(groups).map(([category, statuses]) => {
			const hasCritical = statuses.includes("critical");
			const hasHigh = statuses.includes("high") || statuses.includes("low");
			const healthStatus = hasCritical ? "alert" : hasHigh ? "warning" : "ok";
			return { category, healthStatus } as PanelGroupSummary;
		});
	}, [activeLabReport]);

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

	// Task 11.3 – useCallback handlers

	const handleSearchChange = useCallback((query: string) => {
		setSearchQuery(query);
	}, []);

	const handleFilterChange = useCallback((filter: StatusFilter) => {
		setLabStatusFilter(filter);
	}, []);

	const handleSort = useCallback(
		(column: SortColumn) => {
			setSortColumn((prev) => {
				if (prev === column) {
					setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
					return prev;
				}
				setSortDirection("asc");
				return column;
			});
		},
		[],
	);

	const handleToggleCategory = useCallback((category: string) => {
		setCategoryExpanded((prev) => ({
			...prev,
			[category]: !(prev[category] ?? true),
		}));
	}, []);

	const handleComponentSelect = useCallback((componentId: string) => {
		setSelectedLabComponentId(componentId);
	}, []);

	const handleCloseModal = useCallback(() => {
		setSelectedLabComponentId(null);
	}, []);

	const handleToggleComparison = useCallback(() => {
		setComparisonMode((prev) => !prev);
	}, []);

	const handleDismissAlert = useCallback(() => {
		if (!activeLabReport) return;
		setAlertDismissal(activeLabReport.id);
		setDismissedAlerts((prev) => {
			const next = new Set(prev);
			next.add(activeLabReport.id);
			return next;
		});
	}, [activeLabReport]);

	// Accessibility: announce filter changes to screen readers
	useEffect(() => {
		if (!activeLabReport) return;
		const filterLabel = labStatusFilter === "all" ? "all" : labStatusFilter;
		setLiveAnnouncement(
			`Showing ${displayedComponents.length} ${filterLabel} component${displayedComponents.length !== 1 ? "s" : ""}`,
		);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [labStatusFilter, searchQuery]);

	// Accessibility: announce sort changes to screen readers
	const prevSortRef = useRef<{ column: SortColumn; direction: SortDirection } | null>(null);
	useEffect(() => {
		const prev = prevSortRef.current;
		if (prev && (prev.column !== sortColumn || prev.direction !== sortDirection)) {
			const columnLabel =
				sortColumn === "name" ? "Component" : sortColumn === "value" ? "Observed Value" : "Status";
			const dirLabel = sortDirection === "asc" ? "ascending" : "descending";
			setLiveAnnouncement(`Sorted by ${columnLabel} ${dirLabel}`);
		}
		prevSortRef.current = { column: sortColumn, direction: sortDirection };
	}, [sortColumn, sortDirection]);

	// Accessibility: announce modal open/close to screen readers
	useEffect(() => {
		if (selectedLabComponentId) {
			setLiveAnnouncement("Component details opened");
		} else if (prevSortRef.current !== null) {
			// Only announce close if modal was previously open (avoid announcing on initial render)
			setLiveAnnouncement("Component details closed");
		}
	 
	}, [selectedLabComponentId]);

	// Task 11.4 – Note CRUD handlers with optimistic updates

	const handleAddNote = useCallback(
		async (componentId: string, note: string) => {
			if (!activeLabId) return;
			const tempId = `temp-${Date.now()}`;
			const tempNote: ComponentNote = {
				id: tempId,
				note,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			// Optimistic update
			setNotes((prev) => ({
				...prev,
				[componentId]: [...(prev[componentId] ?? []), tempNote],
			}));
			try {
				const response = await apiClient<ComponentNote>(
					`${API_BASE_URL}/api/reports/lab/${activeLabId}/notes`,
					{
						method: "PATCH",
						body: JSON.stringify({ componentId, note }),
					},
				);
				setNotes((prev) => ({
					...prev,
					[componentId]: (prev[componentId] ?? []).map((n) =>
						n.id === tempId ? response : n,
					),
				}));
			} catch (err) {
				// Rollback
				setNotes((prev) => ({
					...prev,
					[componentId]: (prev[componentId] ?? []).filter((n) => n.id !== tempId),
				}));
				addToast("error", err instanceof Error ? err.message : "Failed to add note.");
			}
		},
		[activeLabId, addToast],
	);

	const handleEditNote = useCallback(
		async (componentId: string, noteId: string, note: string) => {
			if (!activeLabId) return;
			// Optimistic update
			setNotes((prev) => ({
				...prev,
				[componentId]: (prev[componentId] ?? []).map((n) =>
					n.id === noteId ? { ...n, note, updatedAt: new Date().toISOString() } : n,
				),
			}));
			try {
				await apiClient<ComponentNote>(
					`${API_BASE_URL}/api/reports/lab/${activeLabId}/notes`,
					{
						method: "PATCH",
						body: JSON.stringify({ noteId, note }),
					},
				);
			} catch (err) {
				addToast("error", err instanceof Error ? err.message : "Failed to edit note.");
				// Revert by re-fetching (simple approach)
			}
		},
		[activeLabId, addToast],
	);

	const handleDeleteNote = useCallback(
		async (componentId: string, noteId: string) => {
			if (!activeLabId) return;
			// Optimistic update
			setNotes((prev) => ({
				...prev,
				[componentId]: (prev[componentId] ?? []).filter((n) => n.id !== noteId),
			}));
			try {
				await apiClient<{ message: string }>(
					`${API_BASE_URL}/api/reports/lab/${activeLabId}/notes/${noteId}`,
					{ method: "DELETE" },
				);
			} catch (err) {
				addToast("error", err instanceof Error ? err.message : "Failed to delete note.");
			}
		},
		[activeLabId, addToast],
	);

	// Task 11.5 – Export handlers

	const handleExportPDF = useCallback(async () => {
		if (!activeLabId) return;
		try {
			const accessToken = getAccessToken();
			const response = await fetch(
				`${API_BASE_URL}/api/reports/lab/${activeLabId}/export/pdf`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			);
			if (!response.ok) throw new Error("Failed to export PDF.");
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `lab-report-${activeLabId}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Failed to export PDF.");
		}
	}, [activeLabId, addToast]);

	const handleExportCSV = useCallback(async () => {
		if (!activeLabId) return;
		try {
			const accessToken = getAccessToken();
			const response = await fetch(
				`${API_BASE_URL}/api/reports/lab/${activeLabId}/export/csv`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			);
			if (!response.ok) throw new Error("Failed to export CSV.");
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `lab-report-${activeLabId}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Failed to export CSV.");
		}
	}, [activeLabId, addToast]);

	const handleShareReport = useCallback(async () => {
		if (!activeLabId) return;
		try {
			const response = await apiClient<{ shareLink: string; expiresAt: string }>(
				`${API_BASE_URL}/api/reports/lab/${activeLabId}/share`,
				{ method: "POST" },
			);
			await navigator.clipboard.writeText(response.shareLink);
			addToast("success", "Share link copied to clipboard.");
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Failed to share report.");
		}
	}, [activeLabId, addToast]);

	const handlePrint = useCallback(() => {
		window.print();
	}, []);

	const handleExport = useCallback(
		(format: ExportFormat) => {
			if (format === "pdf") void handleExportPDF();
			else if (format === "csv") void handleExportCSV();
			else if (format === "share") void handleShareReport();
			else if (format === "print") handlePrint();
		},
		[handleExportPDF, handleExportCSV, handleShareReport, handlePrint],
	);

	// Task 11.6 – handleFindSpecialist
	const handleFindSpecialist = useCallback(
		(specialization: string) => {
			router.push(`/doctors?specialization=${encodeURIComponent(specialization)}`);
		},
		[router],
	);

	// Task 11.7 – handleSymptomClick
	const handleSymptomClick = useCallback(
		(symptom: string) => {
			addToast("info", `Symptom: ${symptom}`);
		},
		[addToast],
	);

	// Panel badge click – scroll to category section
	const handlePanelBadgeClick = useCallback((category: string) => {
		const el = document.getElementById(`category-${category}`);
		if (el) el.scrollIntoView({ behavior: "smooth" });
	}, []);

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
		<div className="mx-auto max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
			{/* Visually-hidden aria-live region for screen reader announcements */}
			<div
				aria-live="polite"
				aria-atomic="true"
				className="sr-only"
			>
				{liveAnnouncement}
			</div>
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

									{/* Task 11.8 – SmartAlertBanner */}
									<SmartAlertBanner
										shouldShowAlert={shouldShowAlert}
										onDismiss={handleDismissAlert}
									/>

									{/* Task 11.8 – LabReportSummary */}
									<LabReportSummary
										criticalCount={filterCounts.critical}
										normalCount={filterCounts.normal}
										totalCount={filterCounts.all}
										riskScore={riskScore}
										panelGroups={panelGroups}
										onPanelBadgeClick={handlePanelBadgeClick}
									/>

									{/* Task 11.8 – ComparisonToggle */}
									<ComparisonToggle
										isActive={comparisonMode}
										hasPreviousReport={Boolean(previousReport)}
										onToggle={handleToggleComparison}
									/>

									{/* Task 11.8 – LabAnalysisHeader */}
									<LabAnalysisHeader
										searchQuery={searchQuery}
										onSearchChange={handleSearchChange}
										onClearSearch={() => handleSearchChange("")}
										activeFilter={labStatusFilter}
										onFilterChange={handleFilterChange}
										filterCounts={filterCounts}
										onExport={handleExport}
										reportId={activeLabReport.id}
									/>

									{/* Task 11.8 – LabComponentsTable */}
									<LabComponentsTable
										components={displayedComponents}
										sortColumn={sortColumn}
										sortDirection={sortDirection}
										onSort={handleSort}
										categoryExpanded={categoryExpanded}
										onToggleCategory={handleToggleCategory}
										comparisonMode={comparisonMode}
										previousComponents={previousReport?.components}
										onComponentSelect={handleComponentSelect}
										onAddNote={handleAddNote}
										onEditNote={handleEditNote}
										onDeleteNote={handleDeleteNote}
										notes={notes}
									/>

									{/* Task 11.8 – ComponentDetailModal */}
									<ComponentDetailModal
										component={selectedComponent}
										isOpen={selectedLabComponentId !== null}
										onClose={handleCloseModal}
										onSymptomClick={handleSymptomClick}
										onFindSpecialist={handleFindSpecialist}
									/>
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

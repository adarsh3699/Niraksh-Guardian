"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	History,
	Pill,
	FileText,
	AlertTriangle,
	Stethoscope,
	Trash2,
	ChevronDown,
	ChevronUp,
	Clock,
	SearchX,
	FileText as FileTextIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/contexts/ToastProvider";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatDate } from "@/lib/utils";
import type {
	MedicineHistory,
	PrescriptionHistory,
	DrugInteractionHistory,
	SymptomAnalysisHistory,
	HistoryType,
} from "@/types/health";

/* ------------------------------------------------------------------ */
/*  Tab config                                                         */
/* ------------------------------------------------------------------ */

const TABS: {
	key: HistoryType;
	label: string;
	icon: React.ElementType;
	color: string;
	endpoint: string;
}[] = [
	{
		key: "medicine",
		label: "Medicine",
		icon: Pill,
		color: "text-amber-500",
		endpoint: API_ROUTES.HISTORY_MEDICINE,
	},
	{
		key: "prescription",
		label: "Prescription",
		icon: FileText,
		color: "text-purple-500",
		endpoint: API_ROUTES.HISTORY_PRESCRIPTION,
	},
	{
		key: "interaction",
		label: "Drug Interaction",
		icon: AlertTriangle,
		color: "text-rose-500",
		endpoint: API_ROUTES.HISTORY_INTERACTION,
	},
	{
		key: "symptom",
		label: "Symptom Analysis",
		icon: Stethoscope,
		color: "text-blue-500",
		endpoint: API_ROUTES.HISTORY_SYMPTOM,
	},
];

/* ------------------------------------------------------------------ */
/*  Expandable history entry                                           */
/* ------------------------------------------------------------------ */

interface HistoryEntryProps {
	id: string;
	type: HistoryType;
	title: string;
	subtitle: string;
	date: string;
	icon: React.ElementType;
	iconColor: string;
	expandedContent: string;
	imageUrl?: string;
	onDelete: (type: HistoryType, id: string) => void;
	isDeleting: boolean;
	onAction?: () => void;
	actionLabel?: string;
}

function HistoryEntry({
	id,
	type,
	title,
	subtitle,
	date,
	icon: Icon,
	iconColor,
	expandedContent,
	imageUrl,
	onDelete,
	isDeleting,
	onAction,
	actionLabel,
}: HistoryEntryProps) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="rounded-xl border border-border bg-surface shadow-card transition-shadow hover:shadow-md">
			{/* Header row */}
			<button
				type="button"
				onClick={() => setExpanded((prev) => !prev)}
				className="flex w-full items-center gap-3 p-4 text-left"
			>
				<div className={cn("rounded-lg p-2", iconColor.replace("text-", "bg-") + "/10")}>
					<Icon className={cn("size-4", iconColor)} />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-foreground">{title}</p>
					<p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<span className="hidden text-xs text-muted sm:inline">
						<Clock className="mr-1 inline size-3" />
						{formatDate(date)}
					</span>
					{expanded ? (
						<ChevronUp className="size-4 text-muted" />
					) : (
						<ChevronDown className="size-4 text-muted" />
					)}
				</div>
			</button>

			{/* Mobile date */}
			{!expanded && (
				<div className="border-t border-border px-4 py-2 sm:hidden">
					<span className="text-xs text-muted">
						<Clock className="mr-1 inline size-3" />
						{formatDate(date)}
					</span>
				</div>
			)}

			{/* Expanded content */}
			{expanded && (
				<div className="border-t border-border p-4">
					{imageUrl && (
						<div className="mb-4">
							<a
								href={imageUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block transition-opacity hover:opacity-80"
								title="Click to view full size or document"
							>
								{imageUrl.toLowerCase().includes(".pdf") ? (
									<div className="flex h-32 w-28 flex-col items-center justify-center rounded-lg border border-border bg-accent/5 text-accent">
										<FileTextIcon className="mb-2 size-8" />
										<span className="text-xs font-semibold">View PDF</span>
									</div>
								) : (
									<>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={imageUrl}
											alt={title}
											className="max-h-32 rounded-lg border border-border object-contain"
										/>
									</>
								)}
							</a>
						</div>
					)}
					<div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-p:text-muted-foreground">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{expandedContent}</ReactMarkdown>
					</div>
					<div className="mt-4 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
						<span className="text-xs text-muted sm:hidden">
							<Clock className="mr-1 inline size-3" />
							{formatDate(date)}
						</span>
						<div className="flex w-full items-center justify-between sm:w-auto sm:justify-end sm:gap-3">
							{onAction && actionLabel && (
								<Button variant="outline" size="sm" type="button" onClick={onAction}>
									{actionLabel}
								</Button>
							)}
							<Button
								variant="destructive"
								size="sm"
								onClick={() => onDelete(type, id)}
								loading={isDeleting}
								disabled={isDeleting}
							>
								<Trash2 className="mr-1.5 size-3.5" />
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  HistoryClient                                                      */
/* ------------------------------------------------------------------ */

function formatMedicineContent(content: string) {
	const match = content.match(
		/\n(#+|\*\*)\s*(Uses|Side Effects|Dosage|Precautions|Safety|How to use|Interactions|Warnings)/i,
	);
	if (match) {
		return content.substring(0, match.index).trim();
	}
	return content;
}

function formatPrescriptionContent(content: string) {
	// Cut off at the first heading (like "# 1. Comprehensive Explanation..." or "**1. List of Medicines...**")
	const match = content.match(
		/\n(#+|\*\*)\s*(1\.|Detailed|Comprehensive|List of|Medication Details|Dosage Instructions|Side Effects)/i,
	);
	if (match) {
		return content.substring(0, match.index).trim();
	}
	return content;
}

function resolveInteractionContent(content: unknown): string {
	if (typeof content === "string") return content;
	if (!content || typeof content !== "object") return "No interaction data available";

	const payload = content as {
		description?: unknown;
		tabs?: Array<{ title?: unknown; content?: unknown }>;
		rawTabs?: Array<{ title?: unknown; content?: unknown }>;
	};

	if (typeof payload.description === "string" && payload.description.trim()) {
		return payload.description;
	}

	const tabs = Array.isArray(payload.rawTabs)
		? payload.rawTabs
		: Array.isArray(payload.tabs)
			? payload.tabs
			: [];
	const preferred =
		tabs.find((tab) =>
			String(tab?.title ?? "")
				.toLowerCase()
				.includes("overview"),
		) ?? tabs[0];
	const text = typeof preferred?.content === "string" ? preferred.content.trim() : "";

	return text ? `## Overview\n\n${text}` : "No interaction data available";
}

function formatInteractionContent(content: unknown) {
	const text = resolveInteractionContent(content).trim();
	if (!text || text === "No interaction data available") return "No interaction data available";

	const overview = text.match(/(?:^|\n)#{2,3}\s*overview\s*\n([\s\S]*?)(?=\n#{2,3}\s|$)/i);
	if (overview?.[1]) return `## Overview\n\n${overview[1].trim()}`;

	return text.split(/\n#{2,3}\s/)[0].trim();
}

function formatSymptomContent(s: SymptomAnalysisHistory): string {
	const parts: string[] = [];

	// Severity & urgency
	if (s.severity) {
		parts.push(`**Severity:** ${s.severity} · **Urgency:** ${s.urgencyLevel}`);
	}

	// Possible conditions
	const conditions = Array.isArray(s.predictedConditions)
		? (s.predictedConditions as string[])
		: [];
	if (conditions.length > 0) {
		parts.push(`**Possible Conditions:** ${conditions.join(", ")}`);
	}

	// Specialist
	if (s.recommendedSpecialist) {
		parts.push(`**Recommended Specialist:** ${s.recommendedSpecialist}`);
	}

	// Reasoning (truncated for history)
	if (s.reasoning) {
		const truncated = s.reasoning.length > 200 ? s.reasoning.slice(0, 200) + "…" : s.reasoning;
		parts.push(`\n${truncated}`);
	}

	// Home remedies (show first 3)
	if (s.homeRemedies && s.homeRemedies.length > 0) {
		const shown = s.homeRemedies.slice(0, 3);
		parts.push(`\n**Home Remedies:**\n${shown.map((r) => `- ${r}`).join("\n")}`);
	}

	return parts.join("\n\n") || "No analysis available";
}

// Helper to transform raw API data into unified HistoryEntryProps
function transformHistoryData(
	activeTab: HistoryType,
	item: unknown,
	router: ReturnType<typeof useRouter>,
): Partial<HistoryEntryProps> & {
	id: string;
	title: string;
	subtitle: string;
	date: string;
	content: string;
	imageUrl?: string;
} {
	switch (activeTab) {
		case "medicine": {
			const m = item as MedicineHistory;
			const fullContent =
				typeof m.analysisResult === "string"
					? m.analysisResult
					: ((m.analysisResult as { description?: string })?.description ??
						"No analysis available");
			return {
				id: m.id,
				title: m.medicineName ?? "Unknown Medicine",
				subtitle: "Medicine analysis",
				date: m.createdAt,
				content: formatMedicineContent(fullContent),
				imageUrl: m.imageUrl,
				onAction: m.medicineName
					? () => {
							sessionStorage.setItem("ng:medicine:name", JSON.stringify(m.medicineName));
							sessionStorage.setItem(
								"ng:medicine:result",
								JSON.stringify({
									status: "success",
									description: fullContent,
								}),
							);
							router.push("/medicine");
						}
					: undefined,
				actionLabel: "Open Details",
			};
		}
		case "prescription": {
			const p = item as PrescriptionHistory;
			const medicines = (p.analysisResult as { medicines?: string[] })?.medicines ?? [];
			const fullContent =
				typeof p.analysisResult === "string"
					? p.analysisResult
					: ((p.analysisResult as { description?: string })?.description ??
						"No analysis available");
			return {
				id: p.id,
				title: medicines.length > 0 ? medicines.slice(0, 3).join(", ") : "Prescription Analysis",
				subtitle: `${medicines.length} medicine${medicines.length !== 1 ? "s" : ""} extracted`,
				date: p.createdAt,
				content: formatPrescriptionContent(fullContent) || "No analysis available",
				imageUrl: p.imageUrl,
				onAction: p.imageUrl
					? () => {
							sessionStorage.setItem(
								"ng:prescription:result",
								JSON.stringify({
									status: "success",
									medicines,
									description: fullContent,
								}),
							);
							router.push("/prescription");
						}
					: undefined,
				actionLabel: "Open Details",
			};
		}
		case "interaction": {
			const d = item as DrugInteractionHistory;
			const fullContent = resolveInteractionContent(d.interactionResult);
			return {
				id: d.id,
				title: d.drugs.join(" + "),
				subtitle: `${d.drugs.length} drugs checked`,
				date: d.createdAt,
				content: formatInteractionContent(d.interactionResult) || "No interaction data available",
				onAction:
					d.drugs.length > 0
						? () => {
								sessionStorage.setItem("ng:drug-interaction:medicines", JSON.stringify(d.drugs));
								sessionStorage.setItem(
									"ng:drug-interaction:result",
									JSON.stringify({
										status: "success",
										description: fullContent,
									}),
								);
								router.push("/drug-interaction");
							}
						: undefined,
				actionLabel: "Open Details",
			};
		}
		case "symptom": {
			const s = item as SymptomAnalysisHistory;
			return {
				id: s.id,
				title: s.symptoms.slice(0, 3).join(", "),
				subtitle: `${s.severity ? s.severity + " · " : ""}${s.urgencyLevel} · Specialist: ${s.recommendedSpecialist}`,
				date: s.createdAt,
				content: formatSymptomContent(s),
				imageUrl: s.imageUrl ?? undefined,
				onAction:
					s.symptoms.length > 0
						? () => {
								const analysisResult = {
									possibleConditions: Array.isArray(s.predictedConditions)
										? s.predictedConditions
										: [],
									severity: s.severity || "Unknown",
									urgency: s.urgencyLevel || "Unknown",
									reasoning: s.reasoning || "",
									recommendedSpecialists: s.recommendedSpecialist
										? s.recommendedSpecialist.split(", ")
										: [],
									homeRemedies: s.homeRemedies || [],
								};
								sessionStorage.setItem("ng:symptom:result", JSON.stringify(analysisResult));
								sessionStorage.setItem(
									"ng:symptom:symptoms",
									JSON.stringify(s.symptoms.join(", ")),
								);
								router.push("/symptom-analysis");
							}
						: undefined,
				actionLabel: "Open Details",
			};
		}
		default:
			throw new Error(`Unsupported tab: ${activeTab}`);
	}
}

export function HistoryClient() {
	const router = useRouter();
	const { addToast } = useToast();
	const [activeTab, setActiveTab] = useState<HistoryType>("medicine");
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{ type: HistoryType; id: string } | null>(null);

	const activeConfig = TABS.find((t) => t.key === activeTab)!;

	// Fetch history for the active tab
	const { data, isLoading, error, mutate } = useSWR<
		// Destructure mutate from useSWR
		MedicineHistory[] | PrescriptionHistory[] | DrugInteractionHistory[] | SymptomAnalysisHistory[]
	>(activeConfig.endpoint, swrFetcher, {
		revalidateOnFocus: false,
	});

	const handleDelete = useCallback((type: HistoryType, id: string) => {
		// Instead of window.confirm, open the custom dialog
		setDeleteTarget({ type, id });
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!deleteTarget) return;
		const { type, id } = deleteTarget;

		setDeletingId(id);
		try {
			// Find the active tab config for endpoint lookup
			const config = TABS.find((t) => t.key === type);
			if (!config) throw new Error("Invalid history type");

			await apiClient(API_ROUTES.DELETE_HISTORY(type, id), { method: "DELETE" });

			// Refresh data
			mutate();
			// Revalidate global metrics/history limits if needed
			globalMutate(activeConfig.endpoint);

			addToast("success", "Record deleted successfully.");
			setDeleteTarget(null);
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Failed to delete record.");
		} finally {
			setDeletingId(null);
		}
	}, [deleteTarget, mutate, addToast, activeConfig.endpoint]);

	// Transform data into HistoryEntry props
	const entries = (data ?? []).map((item) => transformHistoryData(activeTab, item, router));

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			{/* Page header */}
			<div className="flex items-center gap-3">
				<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
					<History className="size-5 text-primary" />
				</div>
				<div>
					<h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
						Health History
					</h1>
					<p className="text-sm text-muted">Your past health tool analyses and results</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-card">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={cn(
							"flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-medium transition-all sm:text-sm",
							activeTab === tab.key
								? "bg-primary/10 text-primary shadow-sm"
								: "text-muted hover:bg-border hover:text-foreground",
						)}
					>
						<tab.icon className="size-4" />
						<span className="hidden sm:inline">{tab.label}</span>
					</button>
				))}
			</div>

			{/* Content */}
			{error ? (
				<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
					<SearchX className="mx-auto mb-3 size-10 text-muted" />
					<p className="font-heading text-base font-bold text-foreground">Failed to load history</p>
					<p className="mt-1 text-sm text-muted">Please try again later.</p>
				</div>
			) : isLoading ? (
				<div className="flex items-center justify-center py-16">
					<Spinner size="lg" className="text-primary" />
				</div>
			) : entries.length === 0 ? (
				<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
					<activeConfig.icon className={cn("mx-auto mb-3 size-10", activeConfig.color)} />
					<p className="font-heading text-base font-bold text-foreground">
						No {activeConfig.label} history yet
					</p>
					<p className="mt-1 text-sm text-muted">
						Start using the {activeConfig.label.toLowerCase()} tool to see your history here.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					<p className="text-xs font-medium text-muted">
						{entries.length} record{entries.length !== 1 ? "s" : ""}
					</p>
					{entries.map((entry) => (
						<HistoryEntry
							key={entry.id}
							id={entry.id}
							type={activeTab}
							title={entry.title}
							subtitle={entry.subtitle}
							date={entry.date}
							icon={activeConfig.icon}
							iconColor={activeConfig.color}
							expandedContent={entry.content}
							imageUrl={entry.imageUrl}
							onDelete={handleDelete}
							isDeleting={deletingId === entry.id}
							onAction={entry.onAction}
							actionLabel={entry.actionLabel}
						/>
					))}
				</div>
			)}

			{/* Deletion confirmation dialog */}
			<ConfirmDialog
				isOpen={!!deleteTarget}
				title="Confirm Deletion"
				description="Are you sure you want to delete this history record? This action cannot be undone."
				confirmLabel="Delete"
				cancelLabel="Cancel"
				isDestructive
				isLoading={!!deletingId}
				onCancel={() => setDeleteTarget(null)}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}

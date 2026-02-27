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
} from "lucide-react";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/contexts/ToastProvider";
import { Button } from "@/components/ui/Button";
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
	onDelete: (type: HistoryType, id: string) => void;
	isDeleting: boolean;
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
	onDelete,
	isDeleting,
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
					<div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-p:text-muted-foreground">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{expandedContent}</ReactMarkdown>
					</div>
					<div className="mt-4 flex items-center justify-between border-t border-border pt-3">
						<span className="text-xs text-muted sm:hidden">
							<Clock className="mr-1 inline size-3" />
							{formatDate(date)}
						</span>
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
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  HistoryClient                                                      */
/* ------------------------------------------------------------------ */

export function HistoryClient() {
	const { addToast } = useToast();
	const [activeTab, setActiveTab] = useState<HistoryType>("medicine");
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const activeConfig = TABS.find((t) => t.key === activeTab)!;

	// Fetch history for the active tab
	const { data, isLoading, error } = useSWR<
		MedicineHistory[] | PrescriptionHistory[] | DrugInteractionHistory[] | SymptomAnalysisHistory[]
	>(activeConfig.endpoint, swrFetcher, {
		revalidateOnFocus: false,
	});

	const handleDelete = useCallback(
		async (type: HistoryType, id: string) => {
			if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) return;

			setDeletingId(id);
			try {
				await apiClient(API_ROUTES.DELETE_HISTORY(type, id), { method: "DELETE" });
				await globalMutate(activeConfig.endpoint);
				addToast("success", "Record deleted successfully");
			} catch (err) {
				addToast("error", err instanceof Error ? err.message : "Failed to delete record");
			} finally {
				setDeletingId(null);
			}
		},
		[activeConfig.endpoint, addToast],
	);

	// Transform data into HistoryEntry props
	const entries = (data ?? []).map((item) => {
		switch (activeTab) {
			case "medicine": {
				const m = item as MedicineHistory;
				return {
					id: m.id,
					title: m.medicineName ?? "Unknown Medicine",
					subtitle: "Medicine analysis",
					date: m.createdAt,
					content:
						typeof m.analysisResult === "string"
							? m.analysisResult
							: ((m.analysisResult as { description?: string })?.description ??
								"No analysis available"),
				};
			}
			case "prescription": {
				const p = item as PrescriptionHistory;
				const medicines = (p.analysisResult as { medicines?: string[] })?.medicines ?? [];
				return {
					id: p.id,
					title: medicines.length > 0 ? medicines.slice(0, 3).join(", ") : "Prescription Analysis",
					subtitle: `${medicines.length} medicine${medicines.length !== 1 ? "s" : ""} extracted`,
					date: p.createdAt,
					content:
						typeof p.analysisResult === "string"
							? p.analysisResult
							: ((p.analysisResult as { description?: string })?.description ??
								"No analysis available"),
				};
			}
			case "interaction": {
				const d = item as DrugInteractionHistory;
				return {
					id: d.id,
					title: d.drugs.join(" + "),
					subtitle: `${d.drugs.length} drugs checked`,
					date: d.createdAt,
					content:
						typeof d.interactionResult === "string"
							? d.interactionResult
							: ((d.interactionResult as { description?: string })?.description ??
								"No interaction data available"),
				};
			}
			case "symptom": {
				const s = item as SymptomAnalysisHistory;
				return {
					id: s.id,
					title: s.symptoms.slice(0, 3).join(", "),
					subtitle: `Urgency: ${s.urgencyLevel} • Specialist: ${s.recommendedSpecialist}`,
					date: s.createdAt,
					content:
						typeof s.predictedConditions === "string"
							? s.predictedConditions
							: JSON.stringify(s.predictedConditions, null, 2),
				};
			}
		}
	});

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
							onDelete={handleDelete}
							isDeleting={deletingId === entry.id}
						/>
					))}
				</div>
			)}
		</div>
	);
}

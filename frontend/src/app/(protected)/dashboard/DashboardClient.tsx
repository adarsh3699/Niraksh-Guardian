"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
	MessageSquare,
	Stethoscope,
	FileText,
	Pill,
	AlertTriangle,
	BookOpen,
	Heart,
	Activity,
	TrendingUp,
	Clock,
	ArrowRight,
	Shield,
	FileBarChart,
	UserCircle,
	LineChart,
	FlaskConical,
	Siren,
	RefreshCw,
	ArrowUpRight,
	ArrowDownRight,
	Minus,
	Sparkles,
	ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { cn, formatDate } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { DashboardTrendSeries } from "@/types/health";

/* ------------------------------------------------------------------ */
/*  Quick action items                                                 */
/* ------------------------------------------------------------------ */

const quickActions = [
	{
		title: "Prepare for Visit",
		description: "Share your clinical history",
		icon: ClipboardList,
		href: "/clinical-intake",
		gradient: "from-teal-500/20 to-teal-600/5",
		iconColor: "text-teal-600",
	},
	{
		title: "Niraksh AI",
		description: "Chat about your health",
		icon: MessageSquare,
		href: "/niraksh-ai",
		gradient: "from-blue-500/20 to-blue-600/5",
		iconColor: "text-blue-500",
	},
	{
		title: "Symptom Analysis",
		description: "Analyze your symptoms",
		icon: Stethoscope,
		href: "/symptom-analysis",
		gradient: "from-emerald-500/20 to-emerald-600/5",
		iconColor: "text-emerald-500",
	},
	{
		title: "Prescription",
		description: "Scan & understand",
		icon: FileText,
		href: "/prescription",
		gradient: "from-purple-500/20 to-purple-600/5",
		iconColor: "text-purple-500",
	},
	{
		title: "Medicine Search",
		description: "Look up any medicine",
		icon: Pill,
		href: "/medicine",
		gradient: "from-amber-500/20 to-amber-600/5",
		iconColor: "text-amber-500",
	},
	{
		title: "Drug Interaction",
		description: "Check interactions",
		icon: AlertTriangle,
		href: "/drug-interaction",
		gradient: "from-rose-500/20 to-rose-600/5",
		iconColor: "text-rose-500",
	},
	{
		title: "Disease Info",
		description: "Learn about conditions",
		icon: BookOpen,
		href: "/disease",
		gradient: "from-cyan-500/20 to-cyan-600/5",
		iconColor: "text-cyan-500",
	},
];

const trendColors = [
	"text-emerald-500",
	"text-blue-500",
	"text-rose-500",
	"text-amber-500",
	"text-cyan-500",
] as const;
const reportWindowOptions = [3, 6, 12] as const;

/* ------------------------------------------------------------------ */
/*  Health score gauge (inline)                                        */
/* ------------------------------------------------------------------ */

function ScoreGauge({ score }: { score: number }) {
	const color =
		score <= 20
			? "text-green-500"
			: score <= 50
				? "text-yellow-500"
				: score <= 80
					? "text-orange-500"
					: "text-red-500";
	const barColor =
		score <= 20
			? "bg-green-500"
			: score <= 50
				? "bg-yellow-500"
				: score <= 80
					? "bg-orange-500"
					: "bg-red-500";
	const label = score <= 20 ? "Low" : score <= 50 ? "Moderate" : score <= 80 ? "High" : "Critical";

	return (
		<div className="space-y-1.5">
			<div className="flex items-end justify-between">
				<span className={cn("font-heading text-3xl font-bold", color)}>{score}</span>
				<span className="text-xs font-medium text-muted">{label} Risk</span>
			</div>
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
				<div
					className={cn("h-full rounded-full transition-all duration-700", barColor)}
					style={{ width: `${score}%` }}
				/>
			</div>
		</div>
	);
}

function TrendDirectionIcon({ direction }: { direction: "up" | "down" | "stable" }) {
	if (direction === "up") {
		return <ArrowUpRight className="size-4 text-emerald-500" />;
	}
	if (direction === "down") {
		return <ArrowDownRight className="size-4 text-rose-500" />;
	}
	return <Minus className="size-4 text-muted" />;
}

function LabTrendsChart({ series }: { series: DashboardTrendSeries[] }) {
	const [manualSelectedNames, setManualSelectedNames] = useState<string[] | null>(null);

	const selectedNames = useMemo(() => {
		if (series.length === 0) return [];
		const defaults = series
			.slice(0, Math.min(3, series.length))
			.map((entry) => entry.componentName);
		if (!manualSelectedNames || manualSelectedNames.length === 0) return defaults;

		const allowed = new Set(series.map((entry) => entry.componentName));
		const filtered = manualSelectedNames.filter((name) => allowed.has(name));
		return filtered.length > 0 ? filtered : defaults;
	}, [series, manualSelectedNames]);

	const selectedSeries = useMemo(
		() => series.filter((entry) => selectedNames.includes(entry.componentName)),
		[series, selectedNames],
	);

	const reportDates = useMemo(() => {
		const dateSet = new Set<string>();
		selectedSeries.forEach((entry) => {
			entry.points.forEach((point) => dateSet.add(point.date));
		});
		return Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
	}, [selectedSeries]);

	const [minValue, maxValue] = useMemo(() => {
		const values = selectedSeries.flatMap((entry) => entry.points.map((point) => point.value));
		if (values.length === 0) return [0, 100];
		const min = Math.min(...values);
		const max = Math.max(...values);
		if (min === max) {
			return [min - 1, max + 1];
		}
		return [min, max];
	}, [selectedSeries]);

	const width = 760;
	const height = 300;
	const padding = 30;
	const yRange = maxValue - minValue || 1;

	const toX = (index: number) => {
		if (reportDates.length <= 1) return width / 2;
		return padding + (index / (reportDates.length - 1)) * (width - padding * 2);
	};

	const toY = (value: number) => {
		return height - padding - ((value - minValue) / yRange) * (height - padding * 2);
	};

	if (series.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border bg-surface/40 p-8 text-center">
				<LineChart className="mx-auto mb-3 size-7 text-muted" />
				<p className="text-sm font-semibold text-foreground">No trend data yet</p>
				<p className="mt-1 text-xs text-muted">
					Upload at least two lab reports to visualize how values change over time.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
						Lab Trends Over Time
					</h3>
					<p className="text-xs text-muted">
						Track key markers and identify direction shifts quickly.
					</p>
				</div>
				<Link href="/prescription" className="text-xs font-semibold text-primary hover:underline">
					View full report details
				</Link>
			</div>

			<div className="mb-3 flex flex-wrap gap-2">
				{series.map((entry, index) => {
					const active = selectedNames.includes(entry.componentName);
					const colorClass = trendColors[index % trendColors.length];
					return (
						<button
							type="button"
							key={entry.componentName}
							onClick={() => {
								setManualSelectedNames((current) => {
									const baseline = current ?? selectedNames;
									if (baseline.includes(entry.componentName)) {
										if (baseline.length === 1) return baseline;
										return baseline.filter((name) => name !== entry.componentName);
									}
									if (baseline.length >= 5) return baseline;
									return [...baseline, entry.componentName];
								});
							}}
							className={cn(
								"rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
								active
									? cn("border-transparent bg-foreground text-background", colorClass)
									: "border-border bg-surface text-muted hover:border-primary/40 hover:text-foreground",
							)}
						>
							{entry.componentName}
						</button>
					);
				})}
			</div>

			<div className="overflow-x-auto">
				<div className="min-w-[740px]">
					<svg
						viewBox={`0 0 ${width} ${height}`}
						className="h-[280px] w-full"
						role="img"
						aria-label="Lab trend chart"
					>
						{Array.from({ length: 4 }).map((_, index) => {
							const y = padding + (index / 3) * (height - padding * 2);
							return (
								<line
									key={`grid-${index}`}
									x1={padding}
									y1={y}
									x2={width - padding}
									y2={y}
									stroke="currentColor"
									strokeWidth="1"
									className="text-border/40"
								/>
							);
						})}

						{selectedSeries.map((entry, seriesIndex) => {
							const colorClass = trendColors[seriesIndex % trendColors.length];
							const pointLookup = new Map(entry.points.map((point) => [point.date, point]));
							const pointsInOrder = reportDates
								.map((date, dateIndex) => {
									const point = pointLookup.get(date);
									if (!point) return null;
									return {
										x: toX(dateIndex),
										y: toY(point.value),
										status: point.status,
										value: point.value,
									};
								})
								.filter(
									(point): point is { x: number; y: number; status: string; value: number } =>
										point !== null,
								);

							const path = pointsInOrder
								.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
								.join(" ");

							return (
								<g key={entry.componentName}>
									<path
										d={path}
										fill="none"
										stroke="currentColor"
										strokeWidth="3"
										className={colorClass}
									/>
									{pointsInOrder.map((point, idx) => {
										const abnormal = ["critical", "high", "borderline", "low"].includes(
											point.status,
										);
										return (
											<circle
												key={`${entry.componentName}-point-${idx}`}
												cx={point.x}
												cy={point.y}
												r={abnormal ? 5 : 4}
												className={cn(colorClass, abnormal && "ring-2 ring-rose-500")}
												fill="currentColor"
											>
												<title>{`${entry.componentName}: ${point.value.toFixed(2)}`}</title>
											</circle>
										);
									})}
								</g>
							);
						})}
					</svg>
				</div>
			</div>

			<div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
				<span>
					Min {minValue.toFixed(2)} / Max {maxValue.toFixed(2)} across selected markers
				</span>
				<span>{reportDates.length} report points</span>
			</div>
		</div>
	);
}

function AbnormalityTimeline({
	timeline,
}: {
	timeline: Array<{
		reportId: string;
		date: string;
		criticalCount: number;
		highCount: number;
		lowCount: number;
		borderlineCount: number;
		normalCount: number;
		totalCount: number;
	}>;
}) {
	if (timeline.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center">
				<p className="text-sm font-semibold text-foreground">No report timeline yet</p>
				<p className="mt-1 text-xs text-muted">
					Upload lab reports to track high, low, and normal shifts.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
						Abnormality Timeline
					</h3>
					<p className="text-xs text-muted">
						Per-report distribution of critical, high, low, and normal components.
					</p>
				</div>
				<FlaskConical className="size-5 text-primary" />
			</div>

			<div className="space-y-3">
				{timeline.map((point) => {
					const total = Math.max(point.totalCount, 1);
					const outOfRange =
						point.criticalCount + point.highCount + point.lowCount + point.borderlineCount;
					return (
						<div key={point.reportId} className="space-y-1.5">
							<div className="flex items-center justify-between text-xs">
								<span className="font-medium text-foreground">{formatDate(point.date)}</span>
								<span className="text-muted">
									{outOfRange} out-of-range / {point.totalCount} total
								</span>
							</div>
							<div className="flex h-2 overflow-hidden rounded-full bg-border/60">
								<div
									className="bg-rose-500"
									style={{ width: `${((point.criticalCount + point.highCount) / total) * 100}%` }}
								/>
								<div
									className="bg-amber-500"
									style={{ width: `${((point.lowCount + point.borderlineCount) / total) * 100}%` }}
								/>
								<div
									className="bg-emerald-500"
									style={{ width: `${(point.normalCount / total) * 100}%` }}
								/>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-4 flex flex-wrap gap-4 text-[11px] text-muted">
				<span className="inline-flex items-center gap-1">
					<span className="size-2 rounded-full bg-rose-500" /> High / Critical
				</span>
				<span className="inline-flex items-center gap-1">
					<span className="size-2 rounded-full bg-amber-500" /> Low / Borderline
				</span>
				<span className="inline-flex items-center gap-1">
					<span className="size-2 rounded-full bg-emerald-500" /> Normal
				</span>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  DashboardClient                                                    */
/* ------------------------------------------------------------------ */

export function DashboardClient() {
	const { user } = useAuth();
	const [reportWindow, setReportWindow] = useState<(typeof reportWindowOptions)[number]>(6);
	const { insights, isLoading, error, retry } = useDashboardData(reportWindow);

	const snapshot = insights?.snapshot;
	const medicines = insights?.prescribedMedicines;
	const labTrends = insights?.labTrends;

	const totalAnalyses =
		(insights?.recentActivity.length ?? 0) +
		(snapshot?.totalPrescriptionScans ?? 0) +
		(snapshot?.totalLabReports ?? 0);

	const recentActivity = useMemo(() => {
		const iconByType = {
			medicine: { icon: Pill, iconColor: "text-amber-500", iconBg: "bg-amber-500/10" },
			prescription: { icon: FileText, iconColor: "text-violet-500", iconBg: "bg-violet-500/10" },
			interaction: { icon: AlertTriangle, iconColor: "text-rose-500", iconBg: "bg-rose-500/10" },
			symptom: { icon: Stethoscope, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
		} as const;

		return (insights?.recentActivity ?? []).map((item) => ({
			...item,
			...iconByType[item.type],
		}));
	}, [insights?.recentActivity]);

	const greeting = (() => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	})();

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/20">
					<div className="flex items-start gap-3">
						<Siren className="mt-0.5 size-5 text-rose-600" />
						<div>
							<h2 className="font-heading text-lg font-bold text-foreground">
								Unable to load dashboard insights
							</h2>
							<p className="mt-1 text-sm text-muted">
								There was a temporary issue while loading prescription and lab trends.
							</p>
							<button
								type="button"
								onClick={retry}
								className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
							>
								<RefreshCw className="size-4" /> Retry
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
			{/* Welcome header */}
			<div className="mb-8">
				<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
					{greeting}, {user?.name?.split(" ")[0] ?? "there"}!
				</h1>
				<p className="mt-1 text-sm text-muted">
					Your latest prescriptions and lab changes are summarized below.
				</p>
			</div>

			{/* Profile incomplete banner */}
			{!snapshot?.profileComplete && (
				<Link
					href="/profile"
					className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
				>
					<UserCircle className="size-5 text-amber-600" />
					<div className="flex-1">
						<p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
							Complete your health profile
						</p>
						<p className="text-xs text-amber-600 dark:text-amber-400">
							Add your blood group, allergies, and chronic conditions for better doctor
							recommendations.
						</p>
					</div>
					<ArrowRight className="size-4 text-amber-500" />
				</Link>
			)}

			{/* Stat cards */}
			<div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				{/* Health Score */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-muted">Health Score</span>
						<div className="rounded-lg bg-rose-500/10 p-2">
							<Heart className="size-4 text-rose-500" />
						</div>
					</div>
					{typeof snapshot?.healthScore === "number" ? (
						<ScoreGauge score={snapshot.healthScore} />
					) : (
						<>
							<p className="font-heading text-2xl font-bold text-foreground">—</p>
							<p className="mt-0.5 text-xs text-muted">Complete your profile</p>
						</>
					)}
				</div>

				{/* Analyses */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-muted">Total Analyses</span>
						<div className="rounded-lg bg-emerald-500/10 p-2">
							<TrendingUp className="size-4 text-emerald-500" />
						</div>
					</div>
					<p className="font-heading text-2xl font-bold text-foreground">{totalAnalyses}</p>
					<p className="mt-0.5 text-xs text-muted">Recent scans, reports, and interactions</p>
				</div>

				{/* Reports */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-muted">Reports</span>
						<div className="rounded-lg bg-blue-500/10 p-2">
							<FileBarChart className="size-4 text-blue-500" />
						</div>
					</div>
					<p className="font-heading text-2xl font-bold text-foreground">
						{snapshot?.totalLabReports ?? 0}
					</p>
					<p className="mt-0.5 text-xs text-muted">
						{(snapshot?.totalLabReports ?? 0) > 0 ? "Lab reports analyzed" : "No lab reports yet"}
					</p>
				</div>

				{/* Recent report */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-muted">Latest Report</span>
						<div className="rounded-lg bg-amber-500/10 p-2">
							<Clock className="size-4 text-amber-500" />
						</div>
					</div>
					<p className="font-heading text-2xl font-bold text-foreground">
						{snapshot?.lastLabReportAt ? formatDate(snapshot.lastLabReportAt) : "—"}
					</p>
					<p className="mt-0.5 text-xs text-muted">
						{snapshot?.lastLabReportAt ? "Most recent lab upload" : "No report uploaded"}
					</p>
				</div>
			</div>

			{/* Prescribed medicines + insights */}
			<div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<h2 className="font-heading text-base font-bold text-foreground sm:text-lg">
								Recent Prescribed Medicines
							</h2>
							<p className="text-xs text-muted">From your latest prescription analysis history</p>
						</div>
						<Pill className="size-5 text-primary" />
					</div>

					{(medicines?.recent.length ?? 0) === 0 ? (
						<div className="rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center">
							<p className="text-sm font-semibold text-foreground">No medicines found yet</p>
							<p className="mt-1 text-xs text-muted">
								Scan a prescription to extract and track medicines here.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							<div>
								<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
									Most Recent
								</p>
								<div className="space-y-2">
									{(medicines?.recent ?? []).map((medicine) => (
										<div
											key={`recent-${medicine.name}`}
											className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
										>
											<div>
												<p className="text-sm font-semibold text-foreground">{medicine.name}</p>
												<p className="text-xs text-muted">Seen {formatDate(medicine.lastSeenAt)}</p>
											</div>
											<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
												{medicine.count}x
											</span>
										</div>
									))}
								</div>
							</div>

							<div>
								<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
									Most Repeated
								</p>
								<div className="flex flex-wrap gap-2">
									{(medicines?.frequent ?? []).map((medicine) => (
										<span
											key={`freq-${medicine.name}`}
											className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground"
										>
											{medicine.name} ({medicine.count})
										</span>
									))}
								</div>
							</div>
						</div>
					)}

					<div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
						<span>
							Last prescription:{" "}
							{medicines?.lastPrescriptionAt ? formatDate(medicines.lastPrescriptionAt) : "—"}
						</span>
						<Link href="/prescription" className="font-semibold text-primary hover:underline">
							Open prescription tool
						</Link>
					</div>
				</div>

				<div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<h2 className="font-heading text-base font-bold text-foreground sm:text-lg">
								Health Insights
							</h2>
							<p className="text-xs text-muted">
								Plain-language highlights from your latest trend movement
							</p>
						</div>
						<Sparkles className="size-5 text-primary" />
					</div>

					{(labTrends?.insights.length ?? 0) === 0 ? (
						<div className="rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center">
							<p className="text-sm font-semibold text-foreground">No insight cards yet</p>
							<p className="mt-1 text-xs text-muted">
								Add more lab reports to generate meaningful change summaries.
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{(labTrends?.insights ?? []).map((insight) => (
								<div key={insight.title} className="rounded-xl border border-border/70 p-3">
									<div className="mb-1 flex items-center justify-between gap-2">
										<div className="inline-flex items-center gap-1.5">
											<TrendDirectionIcon direction={insight.direction} />
											<p className="text-sm font-semibold text-foreground">{insight.title}</p>
										</div>
										<span
											className={cn(
												"rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
												insight.severity === "high"
													? "bg-rose-500/10 text-rose-600"
													: insight.severity === "moderate"
														? "bg-amber-500/10 text-amber-600"
														: "bg-emerald-500/10 text-emerald-600",
											)}
										>
											{insight.severity}
										</span>
									</div>
									<p className="text-xs leading-relaxed text-muted">{insight.message}</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="mb-8">
				<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold uppercase tracking-wide text-muted">
							Report Range
						</span>
						<div className="inline-flex rounded-full border border-border bg-surface p-1">
							{reportWindowOptions.map((option) => {
								const active = reportWindow === option;
								return (
									<button
										type="button"
										key={option}
										onClick={() => setReportWindow(option)}
										className={cn(
											"rounded-full px-3 py-1 text-xs font-semibold transition-colors",
											active ? "bg-foreground text-background" : "text-muted hover:text-foreground",
										)}
									>
										{option} reports
									</button>
								);
							})}
						</div>
					</div>
					<span className="text-xs text-muted">
						Using last {insights?.meta.reportWindow ?? reportWindow} report
						{(insights?.meta.reportWindow ?? reportWindow) > 1 ? "s" : ""}
					</span>
				</div>
				<LabTrendsChart series={labTrends?.series ?? []} />
			</div>

			<div className="mb-8">
				<AbnormalityTimeline timeline={labTrends?.timeline ?? []} />
			</div>

			{/* Quick actions */}
			<div className="mb-8">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-heading text-lg font-bold text-foreground">Quick Actions</h2>
					<div className="flex items-center gap-1 text-primary">
						<Shield className="size-4" />
						<span className="text-xs font-semibold">AI-Powered</span>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{quickActions.map((action) => (
						<Link
							key={action.href}
							href={action.href}
							className="group rounded-xl border border-border bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
						>
							<div className="flex items-start gap-3">
								<div className={cn("rounded-lg bg-gradient-to-br p-2.5", action.gradient)}>
									<action.icon className={cn("size-5", action.iconColor)} />
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between">
										<h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
										<ArrowRight className="size-4 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
									</div>
									<p className="mt-0.5 text-xs text-muted">{action.description}</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			</div>

			{/* Recent activity */}
			<div>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-heading text-lg font-bold text-foreground">Recent Activity</h2>
					{recentActivity.length > 0 && (
						<Link
							href="/history"
							className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
						>
							View all <ArrowRight className="size-3" />
						</Link>
					)}
				</div>

				{recentActivity.length === 0 ? (
					<div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
						<Activity className="mx-auto mb-3 size-8 text-muted" />
						<h3 className="font-heading text-sm font-bold text-foreground">No activity yet</h3>
						<p className="mt-1 text-xs text-muted">
							Start using health tools to see your activity feed here.
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{recentActivity.map((item) => (
							<Link
								key={`${item.type}-${item.id}`}
								href="/history"
								className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-card transition-colors hover:bg-border/30"
							>
								<div className={cn("rounded-lg p-2", item.iconBg)}>
									<item.icon className={cn("size-4", item.iconColor)} />
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-foreground">{item.title}</p>
									<p className="truncate text-xs text-muted">{item.subtitle}</p>
								</div>
								<span className="shrink-0 text-xs text-muted">{formatDate(item.date)}</span>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import { useMemo } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { cn, formatDate } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { useDashboardData } from "@/hooks/useDashboardData";

/* ------------------------------------------------------------------ */
/*  Quick action items                                                 */
/* ------------------------------------------------------------------ */

const quickActions = [
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

/* ------------------------------------------------------------------ */
/*  Activity item definitions                                          */
/* ------------------------------------------------------------------ */

interface ActivityItem {
	id: string;
	type: "medicine" | "prescription" | "interaction" | "symptom";
	title: string;
	subtitle: string;
	date: string;
	icon: React.ElementType;
	iconColor: string;
	iconBg: string;
}

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

/* ------------------------------------------------------------------ */
/*  DashboardClient                                                    */
/* ------------------------------------------------------------------ */

export function DashboardClient() {
	const { user } = useAuth();
	const { profile, profileLoading, medHistory, rxHistory, intHistory, symHistory, reports } =
		useDashboardData();

	// Compute stats
	const healthScore = profile?.healthProfile?.healthRiskScore ?? 0;
	const totalAnalyses =
		(medHistory?.length ?? 0) +
		(rxHistory?.length ?? 0) +
		(intHistory?.length ?? 0) +
		(symHistory?.length ?? 0);
	const totalReports = reports?.length ?? 0;
	const profileComplete = !!profile?.healthProfile;

	// Merge + sort recent activity (last 8)
	const recentActivity: ActivityItem[] = useMemo(() => {
		const items: ActivityItem[] = [];

		(medHistory ?? []).forEach((m) =>
			items.push({
				id: m.id,
				type: "medicine",
				title: m.medicineName ?? "Medicine Lookup",
				subtitle: "Medicine analysis",
				date: m.createdAt,
				icon: Pill,
				iconColor: "text-amber-500",
				iconBg: "bg-amber-500/10",
			}),
		);
		(rxHistory ?? []).forEach((p) =>
			items.push({
				id: p.id,
				type: "prescription",
				title: "Prescription Scan",
				subtitle: `${(p.analysisResult as { medicines?: string[] })?.medicines?.length ?? 0} medicines extracted`,
				date: p.createdAt,
				icon: FileText,
				iconColor: "text-purple-500",
				iconBg: "bg-purple-500/10",
			}),
		);
		(intHistory ?? []).forEach((d) =>
			items.push({
				id: d.id,
				type: "interaction",
				title: d.drugs.slice(0, 2).join(" + "),
				subtitle: `${d.drugs.length} drugs checked`,
				date: d.createdAt,
				icon: AlertTriangle,
				iconColor: "text-rose-500",
				iconBg: "bg-rose-500/10",
			}),
		);
		(symHistory ?? []).forEach((s) =>
			items.push({
				id: s.id,
				type: "symptom",
				title: s.symptoms.slice(0, 2).join(", "),
				subtitle: `Urgency: ${s.urgencyLevel}`,
				date: s.createdAt,
				icon: Stethoscope,
				iconColor: "text-blue-500",
				iconBg: "bg-blue-500/10",
			}),
		);

		items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		return items.slice(0, 8);
	}, [medHistory, rxHistory, intHistory, symHistory]);

	const greeting = (() => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	})();

	return (
		<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
			{/* Welcome header */}
			<div className="mb-8">
				<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
					{greeting}, {user?.name?.split(" ")[0] ?? "there"}!
				</h1>
				<p className="mt-1 text-sm text-muted">
					Welcome to your health dashboard. Here&apos;s an overview of your health journey.
				</p>
			</div>

			{/* Profile incomplete banner */}
			{!profileLoading && !profileComplete && (
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
					{profileLoading ? (
						<Spinner size="sm" className="text-muted" />
					) : profileComplete ? (
						<ScoreGauge score={healthScore} />
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
					<p className="mt-0.5 text-xs text-muted">
						{totalAnalyses > 0 ? "Across all health tools" : "Start using health tools"}
					</p>
				</div>

				{/* Reports */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-muted">Reports</span>
						<div className="rounded-lg bg-blue-500/10 p-2">
							<FileBarChart className="size-4 text-blue-500" />
						</div>
					</div>
					<p className="font-heading text-2xl font-bold text-foreground">{totalReports}</p>
					<p className="mt-0.5 text-xs text-muted">
						{totalReports > 0 ? "Health summaries generated" : "No reports generated"}
					</p>
				</div>

				{/* Recent */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-muted">Recent Activity</span>
						<div className="rounded-lg bg-amber-500/10 p-2">
							<Clock className="size-4 text-amber-500" />
						</div>
					</div>
					<p className="font-heading text-2xl font-bold text-foreground">
						{recentActivity.length > 0 ? formatDate(recentActivity[0].date) : "—"}
					</p>
					<p className="mt-0.5 text-xs text-muted">
						{recentActivity.length > 0 ? "Last health tool usage" : "Nothing yet"}
					</p>
				</div>
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

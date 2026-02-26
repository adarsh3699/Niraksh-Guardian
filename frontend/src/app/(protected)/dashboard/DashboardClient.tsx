"use client";

import Link from "next/link";
import {
	MessageSquare,
	Stethoscope,
	FileText,
	Pill,
	AlertTriangle,
	BookOpen,
	Activity,
	Shield,
	Heart,
	TrendingUp,
	Clock,
	ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthProvider";

/* ------------------------------------------------------------------ */
/*  Quick action items                                                 */
/* ------------------------------------------------------------------ */

const quickActions = [
	{
		title: "AI Assistant",
		description: "Chat about your health",
		icon: MessageSquare,
		href: "/assistance",
		gradient: "from-blue-500/20 to-blue-600/5",
		iconColor: "text-blue-500",
	},
	{
		title: "Doctor Suggest",
		description: "Find the right doctor",
		icon: Stethoscope,
		href: "/doctor-suggest",
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
/*  Stat cards (placeholder data)                                      */
/* ------------------------------------------------------------------ */

const statCards = [
	{
		label: "Health Score",
		value: "—",
		subtext: "Complete your profile",
		icon: Heart,
		color: "text-rose-500",
		bg: "bg-rose-500/10",
	},
	{
		label: "Consultations",
		value: "0",
		subtext: "No consultations yet",
		icon: Activity,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
	},
	{
		label: "Analyses",
		value: "0",
		subtext: "Start using health tools",
		icon: TrendingUp,
		color: "text-emerald-500",
		bg: "bg-emerald-500/10",
	},
	{
		label: "Recent Activity",
		value: "—",
		subtext: "Nothing yet",
		icon: Clock,
		color: "text-amber-500",
		bg: "bg-amber-500/10",
	},
];

/* ------------------------------------------------------------------ */
/*  DashboardClient                                                    */
/* ------------------------------------------------------------------ */

export function DashboardClient() {
	const { user } = useAuth();

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

			{/* Stat cards */}
			<div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				{statCards.map((stat) => (
					<div
						key={stat.label}
						className="rounded-xl border border-border bg-surface p-4 shadow-card"
					>
						<div className="mb-3 flex items-center justify-between">
							<span className="text-xs font-medium text-muted">{stat.label}</span>
							<div className={cn("rounded-lg p-2", stat.bg)}>
								<stat.icon className={cn("size-4", stat.color)} />
							</div>
						</div>
						<p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
						<p className="mt-0.5 text-xs text-muted">{stat.subtext}</p>
					</div>
				))}
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

			{/* Placeholder — future sections */}
			<div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
				<Activity className="mx-auto mb-3 size-8 text-muted" />
				<h3 className="font-heading text-sm font-bold text-foreground">More coming soon</h3>
				<p className="mt-1 text-xs text-muted">
					Health analytics, activity feed, and personalized recommendations will appear here.
				</p>
			</div>
		</div>
	);
}

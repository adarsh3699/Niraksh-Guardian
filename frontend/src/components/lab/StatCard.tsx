"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
	label: string;
	value: string | number;
	subtext?: string;
	variant?: "default" | "critical" | "warning" | "success";
	className?: string;
}

const VARIANTS = {
	default:  { card: "border-border bg-surface",                  value: "text-foreground",  dot: "" },
	critical: { card: "border-destructive/20 bg-destructive/5",    value: "text-destructive", dot: "bg-destructive" },
	warning:  { card: "border-warning/20 bg-warning/5",            value: "text-warning",     dot: "bg-warning" },
	success:  { card: "border-success/20 bg-success/5",            value: "text-success",     dot: "bg-success" },
};

export function StatCard({ label, value, subtext, variant = "default", className }: StatCardProps) {
	const v = VARIANTS[variant];
	return (
		<div className={cn("flex flex-col gap-2 rounded-xl border p-4 shadow-card min-w-[120px]", v.card, className)}>
			<div className="flex items-center gap-1.5">
				{v.dot && <span className={cn("size-1.5 rounded-full shrink-0", v.dot)} aria-hidden="true" />}
				<span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</span>
			</div>
			<span className={cn("text-3xl font-bold tabular-nums font-heading leading-none", v.value)}>{value}</span>
			{subtext && <span className="text-[10px] text-muted">{subtext}</span>}
		</div>
	);
}

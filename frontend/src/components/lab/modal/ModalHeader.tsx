"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/lab";
import type { LabReportComponent } from "@/types/report";
import type { LabStatus } from "@/lib/lab";

interface ModalHeaderProps {
	component: LabReportComponent;
	onClose: () => void;
	className?: string;
}

// Soft status badge styles for the modal (no solid background — more refined)
const MODAL_BADGE: Record<string, string> = {
	critical:   "bg-destructive/10 text-destructive border border-destructive/20",
	high:       "bg-warning/10 text-warning border border-warning/20",
	low:        "bg-warning/10 text-warning border border-warning/20",
	borderline: "bg-info/10 text-info border border-info/20",
	normal:     "bg-success/10 text-success border border-success/20",
	unknown:    "bg-border text-muted",
};

const MARKER_COLOR: Record<string, string> = {
	critical: "bg-destructive",
	high:     "bg-warning",
	low:      "bg-warning",
	borderline: "bg-info",
	normal:   "bg-success",
	unknown:  "bg-muted",
};

export function ModalHeader({ component, onClose, className }: ModalHeaderProps) {
	// Unused — kept for type safety
	void getStatusColor(component.status as LabStatus);

	const markerPosition = (() => {
		if (component.observedValue === null || component.referenceMin === null || component.referenceMax === null) return null;
		const range = component.referenceMax - component.referenceMin;
		if (range === 0) return null;
		return ((component.observedValue - component.referenceMin) / range) * 100;
	})();

	const badgeClass = MODAL_BADGE[component.status] ?? MODAL_BADGE.unknown;
	const markerClass = MARKER_COLOR[component.status] ?? MARKER_COLOR.unknown;

	return (
		<div className={cn("relative border-b border-border bg-surface", className)}>
			{/* Gradient accent line */}
			<div className="block md:hidden absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-accent via-primary to-primary-light" />

			<div className="px-6 py-5">
				{/* Name + close */}
				<div className="flex items-start justify-between gap-4 mb-3">
					<div className="flex-1 min-w-0">
						<h2 id="modal-title" className="font-heading text-xl font-bold text-foreground truncate">
							{component.componentName}
						</h2>
						<div className="mt-2 flex items-center gap-2 flex-wrap">
							<span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeClass)}>
								{component.status.charAt(0).toUpperCase() + component.status.slice(1)}
							</span>
							<span className="text-lg font-bold text-foreground tabular-nums">
								{component.observedRaw || component.observedValue?.toFixed(2) || "—"}
								{component.unit && <span className="ml-1 text-sm font-normal text-muted">{component.unit}</span>}
							</span>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="shrink-0 inline-flex items-center justify-center rounded-full p-2 text-muted hover:text-foreground hover:bg-border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						aria-label="Close modal"
					>
						<X className="size-5" aria-hidden="true" />
					</button>
				</div>

				{/* Range bar */}
				{component.referenceMin !== null && component.referenceMax !== null && markerPosition !== null && (
					<div>
						<div className="flex items-center justify-between text-xs text-muted mb-1.5">
							<span className="font-medium">Reference range</span>
							<span className="tabular-nums font-medium">
								{component.referenceMin.toFixed(2)} – {component.referenceMax.toFixed(2)}
								{component.unit && ` ${component.unit}`}
							</span>
						</div>
						<div className="relative h-1.5 rounded-full bg-border">
							{/* Normal zone */}
							<div className="absolute inset-0 rounded-full bg-success/15" />
							{/* Marker dot */}
							<div
								className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
								style={{ left: `${Math.max(2, Math.min(98, markerPosition))}%` }}
							>
								<div className={cn("size-3.5 rounded-full border-2 border-white shadow-md", markerClass)} />
							</div>
						</div>
						<div className="flex items-center justify-between mt-1 text-[10px] text-muted tabular-nums">
							<span>{component.referenceMin.toFixed(2)}</span>
							<span>{component.referenceMax.toFixed(2)}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

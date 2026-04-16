/**
 * Lab analysis utilities — status, sorting, filtering, delta, colors, storage.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LabStatus = "critical" | "high" | "borderline" | "normal" | "low" | "unknown";
export type DeltaDirection = "up" | "down" | "stable";
export type SortColumn = "name" | "value" | "status";
export type SortDirection = "asc" | "desc";

export interface DeltaResult {
	percentage: number;
	absolute: number;
	direction: DeltaDirection;
}

// ─── Status classification ────────────────────────────────────────────────────

/**
 * Classifies a lab component status from its observed value and reference range.
 * - critical: >150% upper OR <50% lower
 * - high/low: outside range but not critical
 * - borderline: within 10% of either boundary
 * - normal: safely within range
 */
export function classifyStatus(
	observedValue: number | null,
	referenceMin: number | null,
	referenceMax: number | null,
): LabStatus {
	if (observedValue === null || referenceMin === null || referenceMax === null) return "unknown";
	if (observedValue > referenceMax * 1.5 || observedValue < referenceMin * 0.5) return "critical";
	if (observedValue > referenceMax) return "high";
	if (observedValue < referenceMin) return "low";
	const range = referenceMax - referenceMin;
	const lowerBoundary = referenceMin + range * 0.1;
	const upperBoundary = referenceMax - range * 0.1;
	if (observedValue < lowerBoundary || observedValue > upperBoundary) return "borderline";
	return "normal";
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

const STATUS_SEVERITY: Record<LabStatus, number> = {
	critical: 0, high: 1, borderline: 2, normal: 3, low: 4, unknown: 5,
};

/** Sorts lab components by name (alpha), value (numeric), or status (severity). Does not mutate. */
export function sortComponents<T extends { componentName: string; observedValue: number | null; status: LabStatus }>(
	components: T[],
	column: SortColumn,
	direction: SortDirection,
): T[] {
	return [...components].sort((a, b) => {
		let cmp = 0;
		if (column === "name") cmp = a.componentName.localeCompare(b.componentName);
		else if (column === "value") cmp = (a.observedValue ?? 0) - (b.observedValue ?? 0);
		else cmp = STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status];
		return direction === "asc" ? cmp : -cmp;
	});
}

// ─── Filtering ────────────────────────────────────────────────────────────────

/** Filters by case-insensitive partial match on componentName. Empty query returns all. */
export function filterComponentsBySearch<T extends { componentName: string }>(
	components: T[],
	searchQuery: string,
): T[] {
	const q = searchQuery.trim().toLowerCase();
	return q ? components.filter((c) => c.componentName.toLowerCase().includes(q)) : components;
}

/** Filters by status. "all" returns all components. */
export function filterComponentsByStatus<T extends { status: LabStatus }>(
	components: T[],
	status: LabStatus | "all",
): T[] {
	return status === "all" ? components : components.filter((c) => c.status === status);
}

// ─── Delta calculation ────────────────────────────────────────────────────────

const STABLE_THRESHOLD = 5; // percent

/** Calculates percentage/absolute change and direction between two lab values. */
export function calculateDelta(
	currentValue: number | null,
	previousValue: number | null,
): DeltaResult {
	if (currentValue === null || previousValue === null) return { percentage: 0, absolute: 0, direction: "stable" };
	const absolute = currentValue - previousValue;
	if (previousValue === 0) return { percentage: 0, absolute, direction: absolute === 0 ? "stable" : absolute > 0 ? "up" : "down" };
	const percentage = (absolute / previousValue) * 100;
	const direction: DeltaDirection = Math.abs(percentage) < STABLE_THRESHOLD ? "stable" : absolute > 0 ? "up" : "down";
	return { percentage, absolute, direction };
}

// ─── Colors ───────────────────────────────────────────────────────────────────

// WCAG AA verified: all text/bg combos ≥ 4.5:1. See lab-colors.ts history for ratios.
const STATUS_COLORS: Record<LabStatus, { bg: string; text: string; border: string; badge: string }> = {
	critical:   { bg: "bg-red-100",    text: "text-red-900",    border: "border-red-300",    badge: "bg-red-500 text-white" },
	high:       { bg: "bg-amber-100",  text: "text-amber-900",  border: "border-amber-300",  badge: "bg-amber-500 text-white" },
	low:        { bg: "bg-amber-100",  text: "text-amber-900",  border: "border-amber-300",  badge: "bg-amber-500 text-white" },
	borderline: { bg: "bg-blue-100",   text: "text-blue-900",   border: "border-blue-300",   badge: "bg-blue-500 text-white" },
	normal:     { bg: "bg-green-100",  text: "text-green-900",  border: "border-green-300",  badge: "bg-green-500 text-white" },
	unknown:    { bg: "bg-gray-100",   text: "text-gray-900",   border: "border-gray-300",   badge: "bg-gray-500 text-white" },
};

const DELTA_COLORS = {
	worsening: { text: "text-red-700",   icon: "text-red-600",   bg: "bg-red-50" },
	improving: { text: "text-green-700", icon: "text-green-600", bg: "bg-green-50" },
	stable:    { text: "text-gray-700",  icon: "text-gray-600",  bg: "bg-gray-50" },
} as const;

/** Returns Tailwind color classes for a lab status (bg, text, border, badge). */
export function getStatusColor(status: LabStatus) {
	return STATUS_COLORS[status];
}

/** Returns Tailwind color classes for a delta indicator (text, icon, bg). */
export function getDeltaColor(direction: DeltaDirection, status: LabStatus) {
	if (direction === "stable") return DELTA_COLORS.stable;
	if (status === "critical" || status === "high") return direction === "up" ? DELTA_COLORS.worsening : DELTA_COLORS.improving;
	if (status === "low") return direction === "down" ? DELTA_COLORS.worsening : DELTA_COLORS.improving;
	return DELTA_COLORS.worsening; // borderline/normal: any change is potentially worsening
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const DISMISSED_ALERTS_KEY = "ng:lab:dismissed-alerts";

/** Returns the set of report IDs whose critical alert has been dismissed. */
export function getAlertDismissals(): Set<string> {
	try {
		const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
		const parsed = stored ? JSON.parse(stored) : [];
		return new Set(Array.isArray(parsed) ? parsed : []);
	} catch {
		return new Set();
	}
}

/** Marks a report's critical alert as dismissed (persisted to localStorage). */
export function setAlertDismissal(reportId: string): void {
	try {
		const dismissed = getAlertDismissals();
		dismissed.add(reportId);
		localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...dismissed]));
	} catch {
		// fail silently — non-critical
	}
}

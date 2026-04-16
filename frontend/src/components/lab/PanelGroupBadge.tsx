"use client";

import { useCallback, type KeyboardEvent } from "react";
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Clickable badge for a lab panel category showing its health status (normal/warning/alert).

/**
 * Health status for a panel group badge.
 *
 * - "normal"   → all components in the category are within normal range
 * - "warning"  → one or more components are high, low, or borderline
 * - "alert"    → one or more components are critical
 */
export type PanelHealthStatus = "normal" | "warning" | "alert";

interface PanelGroupBadgeProps {
	/** The category name to display (e.g. "Lipid Panel", "Hematology") */
	category: string;
	/** Health status derived from the worst component status in the category */
	healthStatus: PanelHealthStatus;
	/** Called with the category name when the badge is clicked */
	onBadgeClick: (category: string) => void;
	className?: string;
}

interface StatusConfig {
	icon: React.ReactNode;
	containerClass: string;
	iconClass: string;
	label: string;
}

function getStatusConfig(status: PanelHealthStatus): StatusConfig {
	switch (status) {
		case "alert":
			return {
				icon: <AlertCircle className="size-4 shrink-0" aria-hidden="true" />,
				containerClass:
					"border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30",
				iconClass: "text-red-600 dark:text-red-400",
				label: "Critical values detected",
			};
		case "warning":
			return {
				icon: <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />,
				containerClass:
					"border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30",
				iconClass: "text-amber-600 dark:text-amber-400",
				label: "Abnormal values detected",
			};
		case "normal":
		default:
			return {
				icon: <CheckCircle className="size-4 shrink-0" aria-hidden="true" />,
				containerClass:
					"border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30",
				iconClass: "text-green-600 dark:text-green-400",
				label: "All values normal",
			};
	}
}

export function PanelGroupBadge({
	category,
	healthStatus,
	onBadgeClick,
	className,
}: PanelGroupBadgeProps) {
	const { icon, containerClass, iconClass, label } = getStatusConfig(healthStatus);

	const handleClick = useCallback(() => {
		onBadgeClick(category);
	}, [category, onBadgeClick]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onBadgeClick(category);
			}
		},
		[category, onBadgeClick],
	);

	return (
		<button
			type="button"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			aria-label={`${category}: ${label}. Click to navigate to this section.`}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
				"text-xs font-medium",
				"cursor-pointer transition-colors duration-150",
				"focus:outline-none focus:ring-2 focus:ring-primary/30",
				containerClass,
				className,
			)}
		>
			<span className={iconClass}>{icon}</span>
			<span>{category}</span>
		</button>
	);
}

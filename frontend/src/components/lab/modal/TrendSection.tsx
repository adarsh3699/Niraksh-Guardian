"use client";

import { cn } from "@/lib/utils";
import type { LabReportComponent } from "@/types/report";

// Renders a lightweight SVG sparkline of historical lab values with min/max and trend direction.

interface TrendSectionProps {
	component: LabReportComponent;
	className?: string;
}

export function TrendSection({
	component,
	className,
}: TrendSectionProps) {
	if (!component.trend || component.trend.length < 2) {
		return (
			<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
				<h3 className="text-lg font-semibold text-foreground mb-2">
					Intelligence & Trend
				</h3>
				<p className="text-sm text-muted">
					Insufficient data for trend analysis
				</p>
			</div>
		);
	}

	const width = 300;
	const height = 60;
	const padding = 4;
	const dataPoints = component.trend;
	const dataCount = dataPoints.length;

	const minValue = Math.min(...dataPoints);
	const maxValue = Math.max(...dataPoints);
	const valueRange = maxValue - minValue || 1;

	const points = dataPoints.map((value, index) => {
		const x = padding + (index / (dataCount - 1)) * (width - 2 * padding);
		const y = height - padding - ((value - minValue) / valueRange) * (height - 2 * padding);
		return { x, y, value };
	});

	const pathData = points
		.map((point, index) => {
			const command = index === 0 ? "M" : "L";
			return `${command} ${point.x},${point.y}`;
		})
		.join(" ");

	const firstValue = dataPoints[0];
	const lastValue = dataPoints[dataCount - 1];
	const trendDirection = lastValue > firstValue ? "up" : lastValue < firstValue ? "down" : "stable";
	const trendPercentage = firstValue !== 0
		? (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
		: "0.0";

	const trendStyles = {
		up: { color: "text-green-600 dark:text-green-400", arrow: "↑", label: "Increasing" },
		down: { color: "text-red-600 dark:text-red-400", arrow: "↓", label: "Decreasing" },
		stable: { color: "text-gray-600 dark:text-gray-400", arrow: "→", label: "Stable" },
	};

	const trendStyle = trendStyles[trendDirection];

	return (
		<div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
			<div className="flex items-center justify-between gap-3 mb-3">
				<h3 className="text-lg font-semibold text-foreground">
					Intelligence & Trend
				</h3>
				<span
					className={cn(
						"inline-flex items-center gap-1 text-sm font-semibold",
						trendStyle.color,
					)}
					aria-label={`Trend: ${trendStyle.label}`}
				>
					<span className="text-lg">{trendStyle.arrow}</span>
					{trendPercentage}%
				</span>
			</div>

			<div className="mb-3">
				<svg
					width={width}
					height={height}
					viewBox={`0 0 ${width} ${height}`}
					className="w-full h-auto"
					role="img"
					aria-label={`Trend chart showing ${dataCount} historical values`}
				>
					<line
						x1={padding}
						y1={height / 2}
						x2={width - padding}
						y2={height / 2}
						stroke="currentColor"
						strokeWidth="0.5"
						className="text-border opacity-30"
						strokeDasharray="2,2"
					/>

					<path
						d={pathData}
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-primary"
					/>

					{points.map((point, index) => (
						<circle
							key={index}
							cx={point.x}
							cy={point.y}
							r="3"
							fill="currentColor"
							className="text-primary"
						>
							<title>{`Value ${index + 1}: ${point.value.toFixed(2)}`}</title>
						</circle>
					))}

					<circle
						cx={points[0].x}
						cy={points[0].y}
						r="4"
						fill="currentColor"
						className="text-primary opacity-70"
					/>
					<circle
						cx={points[dataCount - 1].x}
						cy={points[dataCount - 1].y}
						r="4"
						fill="currentColor"
						className="text-primary"
					/>
				</svg>
			</div>

			<div className="flex items-center justify-between text-xs text-muted">
				<span>Min: {minValue.toFixed(2)} {component.unit || ""}</span>
				<span>{dataCount} readings</span>
				<span>Max: {maxValue.toFixed(2)} {component.unit || ""}</span>
			</div>
		</div>
	);
}

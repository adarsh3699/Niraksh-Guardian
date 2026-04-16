"use client";

// Hero health score card — circular arc gauge with score, label, and subtext.

interface RiskScoreGaugeProps {
	score: number;
	size?: number;
	className?: string;
}

function getRiskColor(score: number) {
	if (score <= 30) return { stroke: "#16a34a", text: "text-green-600", label: "Good" };
	if (score <= 60) return { stroke: "#d97706", text: "text-amber-600", label: "Moderate" };
	return { stroke: "#dc2626", text: "text-red-600", label: "High Risk" };
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
	const rad = ((deg - 90) * Math.PI) / 180;
	return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, start: number, end: number) {
	const s = polarToCartesian(cx, cy, r, start);
	const e = polarToCartesian(cx, cy, r, end);
	return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
}

export function RiskScoreGauge({ score, size = 140, className }: RiskScoreGaugeProps) {
	const s = Math.max(0, Math.min(100, score));
	const cx = size / 2, cy = size / 2;
	const sw = size * 0.09;
	const r = (size - sw) / 2;
	const START = -135, END = 135, TOTAL = 270;
	const { stroke, text, label } = getRiskColor(s);

	return (
		<div className={`flex flex-col items-center gap-1 ${className ?? ""}`} role="img" aria-label={`Health score: ${s} out of 100. ${label}.`}>
			<div className="relative" style={{ width: size, height: size }}>
				<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
					{/* Track */}
					<path d={arc(cx, cy, r, START, END)} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" className="text-border" />
					{/* Score fill */}
					{s > 0 && (
						<path d={arc(cx, cy, r, START, START + (s / 100) * TOTAL)} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
					)}
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: size * 0.08 }}>
					<span className={`font-heading font-bold tabular-nums leading-none ${text}`} style={{ fontSize: size * 0.26 }}>
						{s}
					</span>
					<span className="text-muted leading-none mt-0.5" style={{ fontSize: size * 0.09 }}>/100</span>
				</div>
			</div>
			<div className="text-center -mt-1">
				<p className={`text-sm font-bold ${text}`}>{label}</p>
				<p className="text-[10px] text-muted">Overall Health Score</p>
			</div>
		</div>
	);
}

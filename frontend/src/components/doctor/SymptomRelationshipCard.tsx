"use client";

import { useMemo, useState } from "react";
import { Network, GitGraph } from "lucide-react";
import type { SymptomRelationshipGraph } from "@/types/doctor";
import { cn } from "@/lib/utils";

interface SymptomRelationshipCardProps {
	relationship: SymptomRelationshipGraph;
}

// Math helper for curved lines and bounding box snapping
function getEdgePathAndMidpoint(
	sx: number,
	sy: number,
	ex: number,
	ey: number,
	isCenterStart: boolean,
	isCenterEnd: boolean,
	cx: number,
	cy: number,
) {
	// Base dimensions (w/h) for the HTML nodes + extra padding
	const startW = isCenterStart ? 120 : 110;
	const startH = isCenterStart ? 48 : 42;
	const endW = isCenterEnd ? 120 + 20 : 110 + 20; // Extra room for arrowhead
	const endH = isCenterEnd ? 48 + 20 : 42 + 20;

	const dx = ex - sx;
	const dy = ey - sy;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist === 0) return { pathD: `M ${sx} ${sy} L ${ex} ${ey}`, midX: sx, midY: sy };

	let tStart = 0,
		tEnd = 0;
	if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
		tStart = Math.min(Math.abs(startW / 2 / dx), Math.abs(startH / 2 / dy));
		tEnd = Math.min(Math.abs(endW / 2 / dx), Math.abs(endH / 2 / dy));
	}

	let startX = sx,
		startY = sy,
		endX = ex,
		endY = ey;
	if (tStart + tEnd < 1) {
		startX = sx + dx * tStart;
		startY = sy + dy * tStart;
		endX = ex - dx * tEnd;
		endY = ey - dy * tEnd;
	} else {
		endX = sx + dx * 0.5;
		endY = sy + dy * 0.5;
	}

	// Calculate Bezier control point
	let controlX = (startX + endX) / 2;
	let controlY = (startY + endY) / 2;

	if (!isCenterStart && !isCenterEnd) {
		// Cross-outer-node edge: bow outwards to avoid center
		const ox = controlX - cx;
		const oy = controlY - cy;
		const odist = Math.sqrt(ox * ox + oy * oy) || 1;
		controlX += (ox / odist) * 60;
		controlY += (oy / odist) * 60;
	} else {
		// Center-connected edge: slight pinwheel curve
		controlX -= dy * 0.1;
		controlY += dx * 0.1;
	}

	// Midpoint of a quadratic bezier is at t=0.5
	const midX = 0.25 * startX + 0.5 * controlX + 0.25 * endX;
	const midY = 0.25 * startY + 0.5 * controlY + 0.25 * endY;
	const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

	return { pathD, midX, midY };
}

export function SymptomRelationshipCard({ relationship }: SymptomRelationshipCardProps) {
	const { nodes, edges, cluster } = relationship;
	const [activeNode, setActiveNode] = useState<string | null>(null);

	const width = 800;
	const height = 600;
	const cx = width / 2;
	const cy = height / 2;
	const r = 240;

	const centerNode = useMemo(() => {
		const degrees: Record<string, number> = {};
		nodes.forEach((n) => (degrees[n] = 0));
		edges.forEach((e) => {
			if (degrees[e.from] !== undefined) degrees[e.from]++;
			if (degrees[e.to] !== undefined) degrees[e.to]++;
		});
		let maxNode = nodes[0];
		let maxDeg = -1;
		for (const [node, deg] of Object.entries(degrees)) {
			if (deg > maxDeg) {
				maxDeg = deg;
				maxNode = node;
			}
		}
		return maxNode;
	}, [nodes, edges]);

	const nodeCoords = useMemo(() => {
		const coords: Record<string, { x: number; y: number }> = {};
		if (nodes.length === 1) {
			coords[nodes[0]] = { x: cx, y: cy };
			return coords;
		}

		coords[centerNode] = { x: cx, y: cy };
		const otherNodes = nodes.filter((n) => n !== centerNode);

		otherNodes.forEach((node, i) => {
			const angle = (i / otherNodes.length) * 2 * Math.PI - Math.PI / 2;
			coords[node] = {
				x: cx + r * Math.cos(angle),
				y: cy + r * Math.sin(angle),
			};
		});
		return coords;
	}, [nodes, centerNode, cx, cy, r]);

	return (
		<div className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6 overflow-hidden">
			<div className="mb-4">
				<div className="mb-1 flex items-center gap-2">
					<Network className="size-4 text-info" />
					<h4 className="text-sm font-bold text-foreground">{cluster.name}</h4>
				</div>
				<p className="text-sm leading-relaxed text-muted">{cluster.description}</p>
			</div>

			<div className="mt-6 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/50 p-2 sm:p-4 shadow-inner">
				<div className="mb-4 flex items-center justify-between px-2">
					<h5 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
						<GitGraph className="size-3.5" />
						Symptom Mind Map
					</h5>
					<span className="text-[10px] text-muted-foreground hidden sm:inline-block">
						Hover nodes and links to explore
					</span>
				</div>

				<div className="relative isolate z-0 mx-auto w-full max-w-[800px] aspect-[4/3] bg-white/40 dark:bg-slate-900/40 rounded-lg">
					{/* SVG Layer for Edges ONLY */}
					<svg
						className="pointer-events-none absolute inset-0 h-full w-full"
						viewBox={`0 0 ${width} ${height}`}
						preserveAspectRatio="xMidYMid meet"
					>
						<defs>
							<marker
								id="arrowhead"
								markerWidth="6"
								markerHeight="6"
								refX="2"
								refY="3"
								orient="auto"
							>
								<polygon points="0 0, 6 3, 0 6" className="fill-info/50" />
							</marker>
							<marker
								id="arrowhead-active"
								markerWidth="6"
								markerHeight="6"
								refX="2"
								refY="3"
								orient="auto"
							>
								<polygon points="0 0, 6 3, 0 6" className="fill-info" />
							</marker>
						</defs>

						{edges.map((edge, i) => {
							const start = nodeCoords[edge.from];
							const end = nodeCoords[edge.to];
							if (!start || !end) return null;

							const isActive = activeNode === edge.from || activeNode === edge.to;
							const isDimmed = activeNode !== null && !isActive;
							const { pathD } = getEdgePathAndMidpoint(
								start.x,
								start.y,
								end.x,
								end.y,
								edge.from === centerNode,
								edge.to === centerNode,
								cx,
								cy,
							);

							return (
								<path
									key={`path-${i}`}
									d={pathD}
									fill="none"
									className={cn(
										"transition-all duration-300",
										isDimmed ? "opacity-10" : "opacity-100",
										isActive
											? "stroke-info stroke-[2px]"
											: "stroke-info/40 stroke-[1.5px] dark:stroke-info/50",
									)}
									markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
								/>
							);
						})}
					</svg>

					{/* HTML Layer for Edge Labels & Tooltips */}
					<div className="pointer-events-none absolute inset-0">
						{edges.map((edge, i) => {
							const start = nodeCoords[edge.from];
							const end = nodeCoords[edge.to];
							if (!start || !end) return null;

							const isActive = activeNode === edge.from || activeNode === edge.to;
							const isDimmed = activeNode !== null && !isActive;
							const { midX, midY } = getEdgePathAndMidpoint(
								start.x,
								start.y,
								end.x,
								end.y,
								edge.from === centerNode,
								edge.to === centerNode,
								cx,
								cy,
							);

							// Smart positioning: if in the bottom half, tooltip expands upwards to avoid clipping
							const isBottomHalf = midY > height / 2;

							return (
								<div
									key={`label-${i}`}
									className={cn(
										"absolute group pointer-events-auto flex items-center justify-center transition-opacity duration-300",
										isDimmed ? "opacity-10 z-0" : "opacity-100 z-40 hover:z-[100]", // Fixes tooltip overlapping adjacent edges/nodes
									)}
									style={{
										left: `${(midX / width) * 100}%`,
										top: `${(midY / height) * 100}%`,
										transform: "translate(-50%, -50%)",
									}}
								>
									{/* Edge Cutout Annotation (No borders, just text over background) */}
									<div
										className={cn(
											"bg-white/95 dark:bg-slate-900/95 text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase text-info/70 px-1.5 py-0.5 transition-all duration-200 cursor-help max-w-[140px] truncate text-center",
											isActive && "text-info scale-105 rounded-[4px] shadow-sm ring-1 ring-info/20",
										)}
									>
										{edge.relation}
									</div>

									{/* Instant HTML Tooltip with Dynamic Placement */}
									<div
										className={cn(
											"absolute left-1/2 -translate-x-1/2 w-48 sm:w-64 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none text-center leading-relaxed font-medium",
											isBottomHalf ? "bottom-full mb-2" : "top-full mt-2",
										)}
									>
										{edge.relation}
										{/* Triangle arrow for tooltip */}
										<div
											className={cn(
												"absolute left-1/2 -translate-x-1/2 border-[6px] border-transparent",
												isBottomHalf
													? "-bottom-1.5 border-t-slate-900 dark:border-t-slate-50"
													: "-top-1.5 border-b-slate-900 dark:border-b-slate-50",
											)}
										/>
									</div>
								</div>
							);
						})}
					</div>

					{/* HTML Layer for Nodes */}
					<div className="pointer-events-none absolute inset-0">
						{nodes.map((node) => {
							const coords = nodeCoords[node];
							if (!coords) return null;

							const isCenter = node === centerNode;
							const isActive = activeNode === node;
							const isConnected = edges.some(
								(e) =>
									(e.from === node && e.to === activeNode) ||
									(e.to === node && e.from === activeNode),
							);
							const isDimmed = activeNode !== null && !isActive && !isConnected;

							let nodeClass =
								"border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-info/40 z-10 shadow-sm";
							if (isActive) {
								nodeClass =
									"z-50 scale-110 border-info bg-info text-info-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-bold text-xs ring-2 ring-info/30";
							} else if (isConnected) {
								nodeClass = isCenter
									? "z-30 scale-105 border-info bg-info text-info-foreground ring-4 ring-info/20 font-bold"
									: "z-30 scale-105 border-info/50 bg-info/10 text-info dark:bg-info/20 font-semibold shadow-md";
							} else if (isCenter) {
								nodeClass =
									"z-20 border-info bg-info text-info-foreground shadow-md font-bold text-xs ring-4 ring-info/20";
							}

							return (
								<div
									key={node}
									className={cn(
										"pointer-events-auto absolute flex min-h-[36px] min-w-[100px] max-w-[140px] cursor-pointer items-center justify-center rounded-2xl px-3 py-2 text-center text-[11px] transition-all duration-300",
										nodeClass,
										isDimmed && "opacity-30 grayscale",
									)}
									style={{
										left: `${(coords.x / width) * 100}%`,
										top: `${(coords.y / height) * 100}%`,
										transform: "translate(-50%, -50%)",
									}}
									onMouseEnter={() => setActiveNode(node)}
									onMouseLeave={() => setActiveNode(null)}
								>
									<span className="line-clamp-3 leading-snug tracking-tight">{node}</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

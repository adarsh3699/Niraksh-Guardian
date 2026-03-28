"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AnalysisResultProps {
	/** Markdown description from the AI response */
	description: string;
	/** Optional title for the result card */
	title?: string;
	/** Optional rendering variant */
	variant?: "default" | "drug-interaction";
	/** Optional severity for risk badge (drug-interaction variant) */
	severity?: string;
	/** Optional risk score (drug-interaction variant) */
	riskScore?: number;
	/** Show CTA to jump to related research section (drug-interaction variant) */
	showResearchButton?: boolean;
	/** Handler for research CTA click (drug-interaction variant) */
	onResearchClick?: () => void;
	/** Additional class names */
	className?: string;
}

function parseMarkdownSections(markdown: string): { title: string; content: string }[] {
	if (!markdown) return [];

	const regex = /^(#{2,3})\s+(.*)$/gm;
	let match = regex.exec(markdown);
	const parsedTabs: { title: string; content: string }[] = [];

	if (match) {
		const intro = markdown.substring(0, match.index).trim();
		if (intro) parsedTabs.push({ title: "Overview", content: intro });

		let currentTitle = match[2].trim();
		let currentIndex = match.index + match[0].length;

		while ((match = regex.exec(markdown)) !== null) {
			const content = markdown.substring(currentIndex, match.index).trim();
			parsedTabs.push({
				title: currentTitle.replace(/\*\*/g, ""),
				content,
			});
			currentTitle = match[2].trim();
			currentIndex = match.index + match[0].length;
		}

		const lastContent = markdown.substring(currentIndex).trim();
		parsedTabs.push({
			title: currentTitle.replace(/\*\*/g, ""),
			content: lastContent,
		});
	} else {
		parsedTabs.push({ title: "Analysis", content: markdown });
	}

	return parsedTabs.filter((tab) => tab.content.length > 0);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AnalysisResult({
	description,
	title,
	variant = "default",
	severity,
	riskScore,
	showResearchButton,
	onResearchClick,
	className,
}: AnalysisResultProps) {
	const safeDescription = description || "";

	const tabs = useMemo(() => parseMarkdownSections(safeDescription), [safeDescription]);
	const [activeTabIndex, setActiveTabIndex] = useState(0);
	const selectedTabIndex = activeTabIndex >= tabs.length ? 0 : activeTabIndex;

	if (!safeDescription) return null;

	if (variant === "drug-interaction") {
		const safeRiskScore = Math.max(0, Math.min(100, riskScore ?? 0));
		const safeSeverity = (severity || "none").toLowerCase();

		return (
			<div
				className={cn(
					"rounded-[24px] border border-border bg-surface p-6 shadow-sm relative overflow-hidden group/card hover:border-primary/50 transition-all duration-300",
					className,
				)}
			>
				<div className="absolute left-0 top-0 h-full w-1 origin-bottom scale-y-0 bg-gradient-to-b from-accent via-primary to-primary/40 transition-transform duration-500 group-hover/card:scale-y-100" />

				<div className="mb-6 pb-6 border-b border-border">
					<h3 className="mb-2 font-heading text-xl font-semibold text-foreground tracking-tight">
						{title || "Detailed Interaction Analysis"}
					</h3>
					<p className="text-sm text-muted leading-relaxed">
						Evidence-based clinical breakdown with interaction mechanisms and recommendations
					</p>
				</div>

				<div className="mb-6 p-4 rounded-lg bg-background/50 border border-border/50">
					<div className="flex items-center justify-between mb-2">
						<div className="text-xs font-semibold uppercase tracking-widest text-muted">
							Interaction Risk Level
						</div>
						<span
							className={cn(
								"text-xs font-bold px-2 py-1 rounded-full",
								safeSeverity === "none"
									? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
									: safeSeverity === "mild"
										? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
										: safeSeverity === "moderate"
											? "bg-warning/20 text-warning"
											: "bg-destructive/20 text-destructive",
							)}
						>
							{safeSeverity === "none"
								? "No Interaction"
								: safeSeverity.charAt(0).toUpperCase() + safeSeverity.slice(1)}
						</span>
					</div>
					<div className="relative h-2.5 overflow-hidden rounded-full bg-background border border-border/30">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-1000 ease-out",
								safeRiskScore <= 10
									? "bg-green-500"
									: safeRiskScore <= 33
										? "bg-blue-500"
										: safeRiskScore <= 66
											? "bg-gradient-to-r from-warning via-accent to-warning"
											: "bg-gradient-to-r from-warning via-destructive to-destructive",
							)}
							style={{ width: `${safeRiskScore}%` }}
						/>
					</div>
					<div className="mt-2.5 flex justify-between text-[11px] font-medium text-muted/70">
						<span>Low (0%)</span>
						<span>Moderate (50%)</span>
						<span>High (100%)</span>
					</div>
				</div>

				{tabs.length > 1 && (
					<div className="mb-6 flex flex-wrap gap-1 border-b border-border pb-0 overflow-x-auto scrollbar-hide">
						{tabs.map((tab, idx) => (
							<button
								key={idx}
								onClick={() => setActiveTabIndex(idx)}
								className={cn(
									"relative px-4 py-3 text-sm font-medium transition-all whitespace-nowrap",
									selectedTabIndex === idx
										? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
										: "text-muted hover:text-foreground hover:bg-background/50",
								)}
							>
								{tab.title}
								{selectedTabIndex === idx && (
									<span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-t-full" />
								)}
							</button>
						))}
					</div>
				)}

				<div className="mb-6">
					<div className="prose prose-sm max-w-none text-muted prose-headings:font-heading prose-headings:text-foreground prose-h2:text-base prose-h3:text-sm prose-h2:mt-4 prose-h2:mb-2 prose-h3:mt-3 prose-h3:mb-2 prose-p:my-1.5 prose-strong:text-foreground prose-li:my-0.5 prose-li:text-muted prose-a:text-primary prose-a:font-medium hover:prose-a:text-primary/80">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{tabs[selectedTabIndex]?.content ?? safeDescription}
						</ReactMarkdown>
					</div>
				</div>

				{showResearchButton && (
					<>
						<div className="border-t border-border my-4" />
						<div>
							<button
								type="button"
								onClick={onResearchClick}
								className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium transition-all hover:bg-primary-light hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
							>
								<FlaskConical className="size-4" />
								<span>View Research Papers</span>
							</button>
						</div>
					</>
				)}
			</div>
		);
	}

	return (
		<div
			className={cn("rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6", className)}
		>
			{title && <h3 className="mb-4 font-heading text-lg font-bold text-foreground">{title}</h3>}

			<div className="prose prose-sm max-w-none text-foreground prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted prose-strong:text-foreground prose-li:text-muted prose-a:text-primary">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>{safeDescription}</ReactMarkdown>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

export function AnalysisResultSkeleton() {
	return (
		<div className="animate-pulse rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
			<div className="mb-4 h-5 w-32 rounded bg-border" />
			<div className="space-y-3">
				<div className="h-4 w-full rounded bg-border" />
				<div className="h-4 w-5/6 rounded bg-border" />
				<div className="h-4 w-4/6 rounded bg-border" />
				<div className="h-4 w-full rounded bg-border" />
				<div className="h-4 w-3/4 rounded bg-border" />
			</div>
		</div>
	);
}

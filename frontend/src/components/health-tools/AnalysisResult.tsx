"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AnalysisResultProps {
	/** Markdown description from the AI response */
	description: string;
	/** Optional title for the result card */
	title?: string;
	/** Additional class names */
	className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AnalysisResult({ description, title, className }: AnalysisResultProps) {
	if (!description) return null;

	return (
		<div
			className={cn("rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6", className)}
		>
			{title && <h3 className="mb-4 font-heading text-lg font-bold text-foreground">{title}</h3>}

			<div className="prose prose-sm max-w-none text-foreground prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted prose-strong:text-foreground prose-li:text-muted prose-a:text-primary">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
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

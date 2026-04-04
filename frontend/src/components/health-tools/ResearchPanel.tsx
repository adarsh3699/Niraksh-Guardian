"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { FlaskConical, ChevronDown, ExternalLink, Loader2, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import { useSessionState } from "@/hooks/useSessionState";
import type {
	ResearchMetadata,
	ResearchPaper,
	ResearchRagSummary,
	ResearchResponse,
} from "@/types/research";

interface ResearchCacheEntry {
	data: ResearchResponse;
	cachedAt: number;
}

type ResearchCacheMap = Record<string, ResearchCacheEntry>;

const RESEARCH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function normalizeQueryKey(query: string): string {
	return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCacheExpired(entry: ResearchCacheEntry): boolean {
	return Date.now() - entry.cachedAt > RESEARCH_CACHE_TTL_MS;
}

function PaperCard({ paper, index }: { paper: ResearchPaper; index: number }) {
	const [open, setOpen] = useState(false);
	const isPubMed = paper.source === "PubMed";

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-start gap-3 p-3 text-left hover:bg-primary/5 transition-colors"
			>
				<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
					{index + 1}
				</span>
				<div className="min-w-0 flex-1">
					<p
						className={cn(
							"text-[13px] font-medium leading-snug text-foreground",
							!open && "line-clamp-2",
						)}
					>
						{paper.title}
					</p>
					<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
						<span
							className={cn(
								"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
								isPubMed
									? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200"
									: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-200",
							)}
						>
							<BookOpen className="size-2.5" />
							{paper.source}
						</span>
						{paper.year && <span className="text-[11px] text-muted">{paper.year}</span>}
						{paper.journal && (
							<span className="max-w-[180px] truncate text-[11px] text-muted">
								· {paper.journal}
							</span>
						)}
						{(paper.citationCount ?? 0) > 0 && (
							<span className="text-[11px] text-muted">
								· {paper.citationCount?.toLocaleString()} citations
							</span>
						)}
					</div>
				</div>
				<ChevronDown
					className={cn(
						"mt-0.5 size-4 shrink-0 text-muted transition-transform duration-200",
						open && "rotate-180",
					)}
				/>
			</button>

			{open && (
				<div className="border-t border-border/50 px-3 pb-3 pt-2 pl-11">
					{paper.authors.length > 0 && (
						<p className="mb-2 text-[11px] text-muted">
							<span className="font-medium text-foreground">Authors: </span>
							{paper.authors.join(", ")}
							{paper.authors.length === 3 ? " et al." : ""}
						</p>
					)}
					{paper.abstract ? (
						<p className="mb-3 rounded-lg border-l-2 border-primary/40 bg-primary/5 px-3 py-2 text-[12px] leading-relaxed text-foreground/80">
							{paper.abstract}
						</p>
					) : (
						<p className="mb-3 text-[12px] italic text-muted">Abstract not available.</p>
					)}
					<a
						href={paper.url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/5"
					>
						Read full paper <ExternalLink className="size-3" />
					</a>
				</div>
			)}
		</div>
	);
}

interface ResearchPanelProps {
	query: string; // the search term — medicine name, disease, or drug names joined with space
	hideTriggerButton?: boolean;
	isExternallyOpen?: boolean;
	prefetchOnQueryChange?: boolean;
}

export function ResearchPanel({
	query,
	hideTriggerButton = false,
	isExternallyOpen = false,
	prefetchOnQueryChange = true,
}: ResearchPanelProps) {
	const [cache, setCache] = useSessionState<ResearchCacheMap>("ng:research:cache", {});
	const [papers, setPapers] = useState<ResearchPaper[]>([]);
	const [keywords, setKeywords] = useState<string[]>([]);
	const [rag, setRag] = useState<ResearchRagSummary | null>(null);
	const [metadata, setMetadata] = useState<ResearchMetadata | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [hasFetched, setHasFetched] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inFlightRequest = useRef<Promise<ResearchResponse> | null>(null);

	const cacheKey = useMemo(() => normalizeQueryKey(query), [query]);

	const getCachedResponse = useCallback(
		(key: string): ResearchResponse | null => {
			if (!key) return null;
			const entry = cache[key];
			if (!entry) return null;
			if (Date.now() - entry.cachedAt > RESEARCH_CACHE_TTL_MS) return null;
			return entry.data;
		},
		[cache],
	);

	const hydrateFromResponse = useCallback((data: ResearchResponse) => {
		setPapers(data.papers ?? []);
		setKeywords(data.keywords ?? []);
		setRag(data.rag ?? null);
		setMetadata(data.metadata ?? null);
		setHasFetched(true);
	}, []);

	const clearResearchData = useCallback((nextHasFetched: boolean) => {
		setPapers([]);
		setKeywords([]);
		setRag(null);
		setMetadata(null);
		setHasFetched(nextHasFetched);
	}, []);

	useEffect(() => {
		setError(null);

		if (!query.trim()) {
			clearResearchData(false);
			setIsVisible(false);
			return;
		}

		const cached = getCachedResponse(cacheKey);
		if (cached) {
			hydrateFromResponse(cached);
			setIsVisible(false);
			return;
		}

		clearResearchData(false);
		setIsVisible(false);

		if (cache[cacheKey] && isCacheExpired(cache[cacheKey])) {
			setCache((prev) => {
				const next = { ...prev };
				delete next[cacheKey];
				return next;
			});
		}
	}, [query, cacheKey, cache, getCachedResponse, hydrateFromResponse, clearResearchData, setCache]);

	const fetchResearch = useCallback(
		async (mode: "interactive" | "prefetch") => {
			if (!query.trim()) return;

			const cached = getCachedResponse(cacheKey);
			if (cached) {
				hydrateFromResponse(cached);
				if (mode === "interactive") {
					setIsVisible(true);
					setError(null);
				}
				return;
			}

			if (mode === "interactive") {
				setIsLoading(true);
				setError(null);
			}

			if (!inFlightRequest.current) {
				inFlightRequest.current = apiClient<ResearchResponse>(
					`${API_ROUTES.RESEARCH_PAPERS}?q=${encodeURIComponent(query)}`,
				);
			}

			try {
				const data = await inFlightRequest.current;
				hydrateFromResponse(data);
				setCache((prev) => ({
					...prev,
					[cacheKey]: {
						data,
						cachedAt: Date.now(),
					},
				}));
				if (mode === "interactive") {
					setIsVisible(true);
				}
			} catch {
				if (mode === "interactive") {
					setError("Unable to fetch research right now. Please try again in a moment.");
					clearResearchData(true);
					setIsVisible(true);
				}
			} finally {
				inFlightRequest.current = null;
				if (mode === "interactive") {
					setIsLoading(false);
				}
			}
		},
		[query, cacheKey, getCachedResponse, hydrateFromResponse, clearResearchData, setCache],
	);

	const handleToggle = useCallback(() => {
		if (!hasFetched) {
			setIsVisible(true);
			void fetchResearch("interactive");
		} else {
			setIsVisible((v) => !v);
		}
	}, [hasFetched, fetchResearch]);

	useEffect(() => {
		if (!isExternallyOpen || !query.trim()) return;
		if (!hasFetched) {
			setIsVisible(true);
			void fetchResearch("interactive");
			return;
		}
		setIsVisible(true);
	}, [isExternallyOpen, query, hasFetched, fetchResearch]);

	useEffect(() => {
		if (!prefetchOnQueryChange || !query.trim() || hasFetched) return;

		const cached = getCachedResponse(cacheKey);
		if (cached) return;

		const timeoutId = window.setTimeout(() => {
			void fetchResearch("prefetch");
		}, 250);

		return () => window.clearTimeout(timeoutId);
	}, [prefetchOnQueryChange, query, hasFetched, cacheKey, getCachedResponse, fetchResearch]);

	if (!query.trim()) return null;

	return (
		<div className="mt-4">
			{/* Trigger button */}
			{!hideTriggerButton && (
				<button
					type="button"
					onClick={handleToggle}
					disabled={isLoading}
					className={cn(
						"flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
						isVisible
							? "border-primary/30 bg-primary/10 text-primary"
							: "border-border bg-surface text-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
						"disabled:cursor-not-allowed disabled:opacity-60",
					)}
				>
					{isLoading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<FlaskConical className="size-4" />
					)}
					{isLoading ? "Fetching research..." : "View Research Papers"}
				</button>
			)}

			{/* Panel */}
			{isVisible && (
				<div className="mt-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-500/5">
					{/* Header */}
					<div className="flex items-center gap-2.5 border-b border-primary/10 px-4 py-3">
						<div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-500 text-white">
							<FlaskConical className="size-3.5" />
						</div>
						<div>
							<p className="text-[13px] font-semibold text-foreground">Research Evidence</p>
							<p className="text-[11px] text-muted">
								{papers.length} peer-reviewed paper{papers.length !== 1 ? "s" : ""} found
								{keywords.length > 0 && (
									<>
										{" "}
										· <em>{keywords.slice(0, 3).join(", ")}</em>
									</>
								)}
							</p>
							{metadata && (
								<p className="text-[10px] text-muted">
									Retrieval:{" "}
									{metadata.embeddingsUsed ? "Semantic + Lexical RAG" : "Lexical fallback"} ·
									candidates {metadata.totalCandidates} · query join {metadata.keywordJoinerUsed}
								</p>
							)}
						</div>
					</div>

					{rag?.summary && (
						<div className="border-b border-primary/10 bg-primary/5 px-4 py-3">
							<p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary/90">
								Evidence Summary ({rag.confidence} confidence)
							</p>
							<div className="prose prose-sm max-w-none text-foreground/85 prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-2 prose-strong:text-foreground prose-headings:text-foreground prose-headings:font-semibold">
								<ReactMarkdown remarkPlugins={[remarkGfm]}>{rag.summary}</ReactMarkdown>
							</div>
						</div>
					)}

					{/* Cards */}
					<div className="flex flex-col gap-2 p-3">
						{isLoading && !hasFetched ? (
							<div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
								<Loader2 className="size-4 animate-spin" />
								Fetching research papers...
							</div>
						) : error ? (
							<p className="py-4 text-center text-sm text-destructive">{error}</p>
						) : papers.length === 0 ? (
							<p className="py-4 text-center text-sm text-muted">
								No research papers found for this query.
							</p>
						) : (
							papers.map((paper, i) => <PaperCard key={paper.id} paper={paper} index={i} />)
						)}
						<p className="mt-1 text-center text-[10px] text-muted">
							Always consult a licensed medical professional for diagnosis and treatment.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

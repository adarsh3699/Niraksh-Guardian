"use client";

import {
	useState,
	useCallback,
	useEffect,
	useRef,
} from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionState } from "@/hooks/useSessionState";
import { useDebounce } from "@/hooks/useDebounce";
import { useMedicineAnalysis } from "@/hooks/useHealthTools";
import { FileUploadZone } from "@/components/health-tools/FileUploadZone";
import { AnalysisResult, AnalysisResultSkeleton } from "@/components/health-tools/AnalysisResult";
import { Button } from "@/components/ui/Button";
import { Search, Pill, RotateCcw, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import Image from "next/image";
import { ResearchPanel } from "@/components/health-tools/ResearchPanel";

/* ------------------------------------------------------------------ */
/*  1mg autocomplete types                                            */
/* ------------------------------------------------------------------ */

interface OneMgSuggestion {
	name: string;
	search_term?: string | null;
	type?: string;
	slug?: string | null;
	url?: string | null;
	image?: string | null;
	pack_size_label?: string | null;
	manufacturer_name?: string | null;
}

interface AutocompleteResponse {
	suggestions: OneMgSuggestion[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function buildOneMgUrl(suggestion: OneMgSuggestion): string {
	if (suggestion.url) {
		const path = suggestion.url.startsWith("/") ? suggestion.url : `/${suggestion.url}`;
		return `https://www.1mg.com${path}`;
	}
	if (suggestion.slug) {
		return `https://www.1mg.com/drugs/${suggestion.slug}`;
	}
	// fallback: search by name on 1mg
	return `https://www.1mg.com/search/all?name=${encodeURIComponent(suggestion.name)}`;
}

/** Strip HTML tags from 1mg label strings like "<b>dolo</b> 650" */
function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, "");
}

/* ------------------------------------------------------------------ */
/*  MedicineClient                                                     */
/* ------------------------------------------------------------------ */

export function MedicineClient() {
	const searchParams = useSearchParams();
	const urlName = searchParams.get("name");

	const [name, setName] = useSessionState("ng:medicine:name", urlName ?? "");
	const [files, setFiles] = useState<File[]>([]);
	const { result, isLoading, error, analyze, reset } = useMedicineAnalysis();

	// Autocomplete state
	const [suggestions, setSuggestions] = useState<OneMgSuggestion[]>([]);
	const [isFetching, setIsFetching] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const debouncedName = useDebounce(name, 300);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Keep URL-driven navigation authoritative over session state.
	useEffect(() => {
		if (!urlName) return;
		const incomingName = urlName.trim();
		if (!incomingName) return;
		const currentName = name.trim();
		if (incomingName.toLowerCase() !== currentName.toLowerCase()) {
			reset();
			setName(incomingName);
			void analyze(incomingName);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [urlName]);

	// Fetch autocomplete suggestions
	useEffect(() => {
		const q = debouncedName.trim();
		if (!q || q.length < 2) {
			setSuggestions([]);
			setIsOpen(false);
			return;
		}

		let cancelled = false;
		setIsFetching(true);

		apiClient<AutocompleteResponse>(
			`${API_ROUTES.MEDICINE_AUTOCOMPLETE}?q=${encodeURIComponent(q)}`,
		)
			.then((res) => {
				if (cancelled) return;
				setSuggestions(res?.suggestions ?? []);
				setIsOpen(true);
				setActiveIndex(-1);
			})
			.catch(() => {
				if (!cancelled) setSuggestions([]);
			})
			.finally(() => {
				if (!cancelled) setIsFetching(false);
			});

		return () => {
			cancelled = true;
		};
	}, [debouncedName]);

	// Close dropdown on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleSubmit = useCallback(
		async (e?: FormEvent) => {
			e?.preventDefault();
			if (!name.trim() && files.length === 0) return;
			setIsOpen(false);
			await analyze(name || undefined, files[0] ?? undefined);
		},
		[name, files, analyze],
	);

	const handleReset = useCallback(() => {
		reset();
		setName("");
		setFiles([]);
		setSuggestions([]);
		setIsOpen(false);
	}, [reset, setName]);

	const handleSelectSuggestion = useCallback((suggestion: OneMgSuggestion) => {
		setIsOpen(false);
		window.open(buildOneMgUrl(suggestion), "_blank", "noopener,noreferrer");
	}, []);

	const handleSearchWithAI = useCallback(async () => {
		setIsOpen(false);
		if (!name.trim()) return;
		await analyze(name.trim());
	}, [name, analyze]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (!isOpen) return;
			// +1 for the "Search with AI" option at the end
			const total = suggestions.length + 1;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setActiveIndex((i) => (i + 1) % total);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setActiveIndex((i) => (i - 1 + total) % total);
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (activeIndex >= 0 && activeIndex < suggestions.length) {
					handleSelectSuggestion(suggestions[activeIndex]);
				} else if (activeIndex === suggestions.length) {
					void handleSearchWithAI();
				} else {
					void handleSubmit();
				}
			} else if (e.key === "Escape") {
				setIsOpen(false);
			}
		},
		[isOpen, suggestions, activeIndex, handleSelectSuggestion, handleSearchWithAI, handleSubmit],
	);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<div className="mb-2 flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
						<Pill className="size-5 text-accent" />
					</div>
					<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
						Medicine Search
					</h1>
				</div>
				<p className="text-sm text-muted sm:text-base">
					Search by medicine name or upload an image to get detailed information about composition,
					uses, side effects, and dosage.
				</p>
			</div>

			<div className="space-y-6">
				{/* Input section */}
				<div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Text input with autocomplete */}
						<div>
							<label
								htmlFor="medicine-name"
								className="mb-1.5 block text-sm font-medium text-foreground"
							>
								Medicine Name
							</label>

							<div ref={containerRef} className="relative">
								<div className="relative">
									<input
										ref={inputRef}
										id="medicine-name"
										type="text"
										value={name}
										onChange={(e) => {
											setName(e.target.value);
											if (!e.target.value.trim()) setIsOpen(false);
										}}
										onFocus={() => {
											if (suggestions.length > 0) setIsOpen(true);
										}}
										onKeyDown={handleKeyDown}
										placeholder="E.g., Paracetamol, Amoxicillin, Ibuprofen..."
										className={cn(
											"h-11 w-full rounded-lg border border-border bg-background px-4 pr-10 text-sm text-foreground",
											"placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
										)}
										disabled={isLoading}
										autoComplete="off"
									/>
									{isFetching && (
										<Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />
									)}
								</div>

								{/* Dropdown */}
								{isOpen && (suggestions.length > 0 || name.trim().length >= 2) && (
									<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
										<ul role="listbox" className="max-h-72 overflow-y-auto py-1">
											{suggestions.map((s, i) => (
												<li
													key={`${s.name}-${i}`}
													role="option"
													aria-selected={activeIndex === i}
													onMouseDown={(e) => {
														e.preventDefault();
														handleSelectSuggestion(s);
													}}
													onMouseEnter={() => setActiveIndex(i)}
													className={cn(
														"flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors",
														activeIndex === i
															? "bg-primary/10"
															: "hover:bg-muted/10",
													)}
												>
													{/* Medicine image */}
													<div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
														{s.image ? (
															<Image
																src={s.image}
																alt={s.search_term ?? stripHtml(s.name)}
																fill
																sizes="48px"
																className="object-contain p-0.5"
															/>
														) : (
															<Pill className="size-5 text-muted" />
														)}
													</div>

													{/* Text */}
													<div className="min-w-0 flex-1">
														<p className={cn(
															"truncate font-medium",
															activeIndex === i ? "text-primary" : "text-foreground",
														)}>
															{s.search_term ?? stripHtml(s.name)}
														</p>
														{(s.pack_size_label || s.manufacturer_name) && (
															<p className="truncate text-xs text-muted">
																{[s.pack_size_label, s.manufacturer_name]
																	.filter(Boolean)
																	.join(" · ")}
															</p>
														)}
													</div>

													<ExternalLink className="size-3.5 shrink-0 text-muted" />
												</li>
											))}

											{/* Search with AI option */}
											{name.trim().length >= 2 && (
												<li
													role="option"
													aria-selected={activeIndex === suggestions.length}
													onMouseDown={(e) => {
														e.preventDefault();
														void handleSearchWithAI();
													}}
													onMouseEnter={() => setActiveIndex(suggestions.length)}
													className={cn(
														"flex cursor-pointer items-center gap-2.5 border-t border-border px-4 py-2.5 text-sm font-medium transition-colors",
														activeIndex === suggestions.length
															? "bg-accent/10 text-accent"
															: "text-accent hover:bg-accent/10",
													)}
												>
													<Sparkles className="size-4 shrink-0" />
													Search &quot;{name.trim()}&quot; with AI
												</li>
											)}
										</ul>
									</div>
								)}
							</div>
						</div>

						{/* Divider */}
						<div className="flex items-center gap-3">
							<div className="h-px flex-1 bg-border" />
							<span className="text-xs font-medium text-muted">OR</span>
							<div className="h-px flex-1 bg-border" />
						</div>

						{/* Image upload */}
						<div>
							<p className="mb-1.5 text-sm font-medium text-foreground">Upload Medicine Image</p>
							<FileUploadZone
								maxFiles={1}
								onFilesChange={setFiles}
								disabled={isLoading}
								label="Drop an image of the medicine or packaging"
							/>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-3">
							<Button
								type="submit"
								variant="primary"
								size="md"
								disabled={(!name.trim() && files.length === 0) || isLoading}
								loading={isLoading}
							>
								<Search className="mr-1.5 size-4" />
								Analyze Medicine
							</Button>

							{(result || name || files.length > 0) && (
								<Button
									type="button"
									variant="ghost"
									size="md"
									onClick={handleReset}
									disabled={isLoading}
								>
									<RotateCcw className="mr-1.5 size-4" />
									Clear
								</Button>
							)}
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}
					</form>
				</div>

				{/* Loading */}
				{isLoading && <AnalysisResultSkeleton />}

				{/* Result */}
				{result && (
					<div className="space-y-3">
						<AnalysisResult description={result.description} title="Medicine Information" />
						<ResearchPanel query={name.trim()} />
					</div>
				)}
			</div>
		</div>
	);
}

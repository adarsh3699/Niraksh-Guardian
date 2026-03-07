"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useDoctorSearch, useUserProfile } from "@/hooks/useDoctors";
import { SymptomAnalysis } from "@/components/doctor/SymptomAnalysis";
import { DoctorFilters } from "@/components/doctor/DoctorFilters";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import { Pagination } from "@/components/doctor/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { Stethoscope, SearchX } from "lucide-react";
import type { DoctorSearchParams, SymptomAnalysis as SymptomAnalysisType } from "@/types/doctor";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DEFAULT_PARAMS: DoctorSearchParams = {
	page: 1,
	limit: 12,
	sortBy: "rating",
	order: "desc",
};

/* ------------------------------------------------------------------ */
/*  DoctorSuggestClient                                               */
/* ------------------------------------------------------------------ */

export function DoctorSuggestClient() {
	const searchParams = useSearchParams();

	// Pre-fill from URL query params (?symptoms=...&condition=...&chatId=...)
	const urlSymptoms = searchParams.get("symptoms") ?? undefined;
	const urlCondition = searchParams.get("condition") ?? undefined;
	const chatId = searchParams.get("chatId") ?? undefined;

	// Read symptom summary from sessionStorage (set by chat "Find Doctors" flow)
	const [storedSummary] = useState<string | undefined>(() => {
		if (typeof window === "undefined") return undefined;
		const summary = sessionStorage.getItem("symptomSummary");
		if (summary) {
			sessionStorage.removeItem("symptomSummary"); // one-time read
			return summary;
		}
		return undefined;
	});

	// Read pre-stored analysis from history "Open Details" flow
	const [storedResult] = useState<SymptomAnalysisType | null>(() => {
		if (typeof window === "undefined") return null;
		const raw = sessionStorage.getItem("ng:symptom:result");
		if (raw) {
			sessionStorage.removeItem("ng:symptom:result");
			try {
				return JSON.parse(raw) as SymptomAnalysisType;
			} catch {
				return null;
			}
		}
		return null;
	});

	const [storedSymptoms] = useState<string | undefined>(() => {
		if (typeof window === "undefined") return undefined;
		const raw = sessionStorage.getItem("ng:symptom:symptoms");
		if (raw) {
			sessionStorage.removeItem("ng:symptom:symptoms");
			try {
				return JSON.parse(raw) as string;
			} catch {
				return undefined;
			}
		}
		return undefined;
	});

	// Priority: storedSummary (from chat) > storedSymptoms (from history) > urlSymptoms (from URL)
	const effectiveSymptoms = storedSummary || storedSymptoms || urlSymptoms;

	// User's location for doctor proximity sorting
	const { city: userCity, state: userState } = useUserProfile();

	// Latest full analysis result (for possibleConditions → matchTags)
	const [lastAnalysis, setLastAnalysis] = useState<SymptomAnalysisType | null>(storedResult);

	const [params, setParams] = useState<DoctorSearchParams>(() => ({
		...DEFAULT_PARAMS,
		// Auto-fill search when arriving from disease page (?condition=Diabetes)
		search: urlCondition || undefined,
	}));

	const { doctors, meta, isLoading, isError } = useDoctorSearch(params);

	const handleFilterChange = useCallback((partial: Partial<DoctorSearchParams>) => {
		setParams((prev) => ({ ...prev, ...partial }));
	}, []);

	/** Fired when symptom analysis completes — store the result for matchTags extraction */
	const handleAnalysisComplete = useCallback((result: SymptomAnalysisType) => {
		setLastAnalysis(result);
	}, []);

	const handleSpecialistFound = useCallback(
		(specialists: string[]) => {
			// Join multiple specialists as comma-separated for backend OR query
			const specialization = specialists.join(",");

			// Extract condition keywords from analysis for relevance scoring
			const matchTags = lastAnalysis?.possibleConditions?.join(",") ?? undefined;

			setParams((prev) => ({
				...prev,
				specialization,
				search: undefined,
				page: 1,
				matchTags,
				userCity: userCity ?? undefined,
				userState: userState ?? undefined,
			}));

			// Scroll to doctor results
			document.getElementById("doctor-results")?.scrollIntoView({ behavior: "smooth" });
		},
		[lastAnalysis, userCity, userState],
	);

	const handlePageChange = useCallback((page: number) => {
		setParams((prev) => ({ ...prev, page }));
	}, []);

	const [searchResetKey, setSearchResetKey] = useState(0);

	const handleResetFilters = useCallback(() => {
		setParams({ ...DEFAULT_PARAMS });
		setLastAnalysis(null);
		setSearchResetKey((k) => k + 1);
	}, []);

	return (
		<div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			{/* Page header */}
			<div className="flex items-center gap-3">
				<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
					<Stethoscope className="size-5 text-primary" />
				</div>
				<div>
					<h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
						Doctor Suggestion
					</h1>
					<p className="text-sm text-muted">Analyze symptoms &amp; find the right specialist</p>
				</div>
			</div>

			{/* Symptom analysis */}
			<SymptomAnalysis
				chatId={chatId}
				initialSymptoms={effectiveSymptoms}
				initialResult={storedResult}
				autoAnalyze={!!storedSummary}
				onSpecialistFound={handleSpecialistFound}
				onAnalysisComplete={handleAnalysisComplete}
			/>

			{/* Filters */}
			<div id="doctor-results">
				<DoctorFilters
					params={params}
					onChange={handleFilterChange}
					onReset={handleResetFilters}
					searchResetKey={searchResetKey}
				/>
			</div>

			{/* Results */}
			{isError ? (
				<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
					<SearchX className="mx-auto mb-3 size-10 text-muted" />
					<p className="font-heading text-base font-bold text-foreground">Failed to load doctors</p>
					<p className="mt-1 text-sm text-muted">Please try again later.</p>
				</div>
			) : isLoading ? (
				<div className="flex items-center justify-center py-16">
					<Spinner size="lg" className="text-primary" />
				</div>
			) : doctors.length === 0 ? (
				<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
					<SearchX className="mx-auto mb-3 size-10 text-muted" />
					<p className="font-heading text-base font-bold text-foreground">No doctors found</p>
					<p className="mt-1 text-sm text-muted">Try adjusting your filters or search terms.</p>
				</div>
			) : (
				<>
					{/* Relevance sort indicator */}
					{params.matchTags && (
						<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
							<span className="flex items-center gap-1.5 font-medium text-primary">
								<svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 1l1.9 3.8 4.1.6-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1L2 5.4l4.1-.6z" />
								</svg>
								Sorted by symptom relevance
							</span>
							{!userCity && (
								<a
									href="/profile"
									className="text-muted underline-offset-2 hover:text-primary hover:underline"
								>
									📍 Add your location for nearby doctor boost
								</a>
							)}
						</div>
					)}

					{/* Doctor cards grid */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{doctors.map((doctor, index) => (
							<DoctorCard key={doctor.id} doctor={doctor} rank={index} />
						))}
					</div>

					{/* Pagination */}
					{meta && (
						<Pagination
							meta={meta}
							onPageChange={handlePageChange}
							scrollTargetId="doctor-results"
						/>
					)}
				</>
			)}
		</div>
	);
}

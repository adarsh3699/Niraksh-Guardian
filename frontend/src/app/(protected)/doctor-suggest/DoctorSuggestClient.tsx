"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useDoctorSearch } from "@/hooks/useDoctors";
import { SymptomAnalysis } from "@/components/doctor/SymptomAnalysis";
import { DoctorFilters } from "@/components/doctor/DoctorFilters";
import { DoctorCard } from "@/components/doctor/DoctorCard";
import { Pagination } from "@/components/doctor/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { Stethoscope, SearchX } from "lucide-react";
import type { DoctorSearchParams } from "@/types/doctor";

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

	const [params, setParams] = useState<DoctorSearchParams>(() => ({
		...DEFAULT_PARAMS,
		specialization: urlCondition || undefined,
	}));

	const { doctors, meta, isLoading, isError } = useDoctorSearch(params);

	const handleFilterChange = useCallback((partial: Partial<DoctorSearchParams>) => {
		setParams((prev) => ({ ...prev, ...partial }));
	}, []);

	const handleSpecialistFound = useCallback((specialists: string[]) => {
		// Join multiple specialists as comma-separated for backend OR query
		const specialization = specialists.join(",");
		setParams((prev) => ({
			...prev,
			specialization,
			search: undefined,
			page: 1,
		}));

		// Scroll to doctor results
		document.getElementById("doctor-results")?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setParams((prev) => ({ ...prev, page }));
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
				initialSymptoms={urlSymptoms}
				onSpecialistFound={handleSpecialistFound}
			/>

			{/* Filters */}
			<div id="doctor-results">
				<DoctorFilters params={params} onChange={handleFilterChange} />
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
					{/* Doctor cards grid */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{doctors.map((doctor) => (
							<DoctorCard key={doctor.id} doctor={doctor} />
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

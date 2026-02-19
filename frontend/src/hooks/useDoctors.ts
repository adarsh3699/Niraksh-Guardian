"use client";

import useSWR from "swr";
import { useCallback, useMemo, useState } from "react";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
	Doctor,
	DoctorSearchParams,
	SymptomAnalysis,
	SymptomSummaryResponse,
} from "@/types/doctor";
import type { PaginatedResponse } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Build query string from DoctorSearchParams                        */
/* ------------------------------------------------------------------ */

function buildDoctorQuery(params: DoctorSearchParams): string {
	const qs = new URLSearchParams();
	if (params.search) qs.set("search", params.search);
	if (params.specialization) qs.set("specialization", params.specialization);
	if (params.city) qs.set("city", params.city);
	if (params.state) qs.set("state", params.state);
	if (params.minFee !== undefined) qs.set("minFee", String(params.minFee));
	if (params.maxFee !== undefined) qs.set("maxFee", String(params.maxFee));
	if (params.sortBy) qs.set("sortBy", params.sortBy);
	if (params.order) qs.set("order", params.order);
	qs.set("page", String(params.page ?? 1));
	qs.set("limit", String(params.limit ?? 12));
	return `${API_ROUTES.DOCTORS}?${qs.toString()}`;
}

/* ------------------------------------------------------------------ */
/*  useDoctorSearch — paginated doctor search with filters            */
/* ------------------------------------------------------------------ */

export function useDoctorSearch(params: DoctorSearchParams) {
	const key = useMemo(() => buildDoctorQuery(params), [params]);

	const { data, error, isLoading } = useSWR<PaginatedResponse<Doctor>>(key, swrFetcher, {
		revalidateOnFocus: false,
		keepPreviousData: true,
	});

	return {
		doctors: data?.data ?? [],
		meta: data?.meta ?? { total: 0, page: 1, limit: 12, pages: 0 },
		isLoading,
		isError: !!error,
	};
}

/* ------------------------------------------------------------------ */
/*  useSymptomAnalysis — POST /api/ai/analyze                         */
/* ------------------------------------------------------------------ */

export function useSymptomAnalysis() {
	const [result, setResult] = useState<SymptomAnalysis | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyze = useCallback(async (symptoms: string[], image?: File, language = "en") => {
		setIsAnalyzing(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("symptoms", JSON.stringify(symptoms));
			formData.append("language", language);
			if (image) formData.append("image", image);

			const data = await apiClient<SymptomAnalysis>(API_ROUTES.ANALYZE_SYMPTOMS, {
				method: "POST",
				body: formData,
				isFile: true,
			});

			setResult(data);
			return data;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Analysis failed";
			setError(message);
			throw err;
		} finally {
			setIsAnalyzing(false);
		}
	}, []);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, []);

	return { result, isAnalyzing, error, analyze, reset };
}

/* ------------------------------------------------------------------ */
/*  useChatSummary — POST /api/ai/summarize-symptoms                  */
/* ------------------------------------------------------------------ */

export function useChatSummary() {
	const [summary, setSummary] = useState<SymptomSummaryResponse | null>(null);
	const [isSummarizing, setIsSummarizing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const summarize = useCallback(async (chatId: string) => {
		setIsSummarizing(true);
		setError(null);

		try {
			const data = await apiClient<SymptomSummaryResponse>(API_ROUTES.SUMMARIZE_SYMPTOMS, {
				method: "POST",
				body: { chatId },
			});

			setSummary(data);
			return data;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Summarization failed";
			setError(message);
			throw err;
		} finally {
			setIsSummarizing(false);
		}
	}, []);

	const reset = useCallback(() => {
		setSummary(null);
		setError(null);
	}, []);

	return { summary, isSummarizing, error, summarize, reset };
}

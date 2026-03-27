"use client";

import useSWR from "swr";
import { useCallback, useMemo, useState } from "react";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
	Doctor,
	DoctorSearchParams,
	SymptomSummaryResponse,
	SymptomRelationshipResponse,
} from "@/types/doctor";
import type { PaginatedResponse } from "@/types/api";
import type { ProfileResponse } from "@/types/health";

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
	if (params.matchTags) qs.set("matchTags", params.matchTags);
	if (params.userCity) qs.set("userCity", params.userCity);
	if (params.userState) qs.set("userState", params.userState);
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

/* ------------------------------------------------------------------ */
/*  useUserProfile — GET /api/profile (city/state for doctor sorting) */
/* ------------------------------------------------------------------ */

/**
 * Lightweight hook used by DoctorSuggestClient to grab the user's
 * city and state for location-based relevance sorting.
 */
export function useUserProfile() {
	const { data } = useSWR<ProfileResponse>(API_ROUTES.PROFILE, swrFetcher, {
		revalidateOnFocus: false,
	});

	return {
		city: data?.healthProfile?.city ?? undefined,
		state: data?.healthProfile?.state ?? undefined,
	};
}

/* ------------------------------------------------------------------ */
/*  useSymptomRelationship — POST /api/symptoms/analyze               */
/* ------------------------------------------------------------------ */

export function useSymptomRelationship() {
	const [result, setResult] = useState<SymptomRelationshipResponse | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyze = useCallback(async (input: string, image?: File) => {
		setIsAnalyzing(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("input", input);
			if (image) {
				formData.append("image", image);
			}

			const data = await apiClient<SymptomRelationshipResponse>(API_ROUTES.SYMPTOM_RELATIONSHIP, {
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

"use client";

import { useCallback } from "react";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useSessionState } from "@/hooks/useSessionState";
import { useAsyncToolRunner } from "@/hooks/useAsyncToolRunner";
import type {
	MedicineAnalysisResponse,
	PrescriptionAnalysisResponse,
	DrugInteractionResponse,
	DiseaseInfo,
} from "@/types/health";

function useAsyncToolResult<T>(sessionKey: string) {
	const [result, setResult] = useSessionState<T | null>(sessionKey, null);
	const { isLoading, error, run, resetError } = useAsyncToolRunner<T>(setResult);

	const reset = useCallback(() => {
		setResult(null);
		resetError();
	}, [setResult, resetError]);

	return { result, isLoading, error, run, reset };
}

/* ------------------------------------------------------------------ */
/*  Medicine Analysis                                                  */
/* ------------------------------------------------------------------ */

export function useMedicineAnalysis() {
	const { result, isLoading, error, run, reset } =
		useAsyncToolResult<MedicineAnalysisResponse>("ng:medicine:result");

	const analyze = useCallback(
		async (name?: string, image?: File) => {
			if (!name?.trim() && !image) return null;

			return run(
				async () => {
					const formData = new FormData();
					if (name?.trim()) formData.append("name", name.trim());
					if (image) formData.append("image", image);

					return apiClient<MedicineAnalysisResponse>(API_ROUTES.MEDICINE, {
						method: "POST",
						body: formData,
						isFile: true,
					});
				},
				"Failed to analyze medicine",
				{ clearResultBeforeRun: true },
			);
		},
		[run],
	);

	return { result, isLoading, error, analyze, reset };
}

/* ------------------------------------------------------------------ */
/*  Prescription Analysis                                              */
/* ------------------------------------------------------------------ */

export function usePrescriptionAnalysis() {
	const { result, isLoading, error, run, reset } =
		useAsyncToolResult<PrescriptionAnalysisResponse>("ng:prescription:result");

	const analyze = useCallback(
		async (files: File[]) => {
			if (files.length === 0) return null;

			return run(async () => {
				const formData = new FormData();
				files.forEach((file) => formData.append("files", file));

				return apiClient<PrescriptionAnalysisResponse>(API_ROUTES.PRESCRIPTION, {
					method: "POST",
					body: formData,
					isFile: true,
				});
			}, "Failed to analyze prescription");
		},
		[run],
	);

	return { result, isLoading, error, analyze, reset };
}

/* ------------------------------------------------------------------ */
/*  Drug Interaction Check                                             */
/* ------------------------------------------------------------------ */

export function useDrugInteraction() {
	const { result, isLoading, error, run, reset } = useAsyncToolResult<DrugInteractionResponse>(
		"ng:drug-interaction:result",
	);

	const checkInteraction = useCallback(
		async (medicines: string[]) => {
			if (medicines.length < 1) return null;

			return run(
				() =>
					apiClient<DrugInteractionResponse>(API_ROUTES.DRUG_INTERACTION, {
						method: "POST",
						body: { medicines },
					}),
				"Failed to check drug interaction",
				{ clearResultBeforeRun: true },
			);
		},
		[run],
	);

	return { result, isLoading, error, checkInteraction, reset };
}

/* ------------------------------------------------------------------ */
/*  Disease Info                                                        */
/* ------------------------------------------------------------------ */

export function useDiseaseInfo() {
	const { result, isLoading, error, run, reset } =
		useAsyncToolResult<DiseaseInfo>("ng:disease:result");

	const fetchInfo = useCallback(
		async (topic: string, language: string = "en") => {
			if (!topic.trim()) return null;

			return run(async () => {
				const params = new URLSearchParams({ topic: topic.trim(), language });
				return apiClient<DiseaseInfo>(`${API_ROUTES.DISEASE_INFO}?${params.toString()}`);
			}, "Failed to fetch disease information");
		},
		[run],
	);

	return { result, isLoading, error, fetchInfo, reset };
}

"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import { useSessionState } from "@/hooks/useSessionState";
import type {
	MedicineAnalysisResponse,
	PrescriptionAnalysisResponse,
	DrugInteractionResponse,
	DiseaseInfo,
} from "@/types/health";

/* ------------------------------------------------------------------ */
/*  Medicine Analysis                                                  */
/* ------------------------------------------------------------------ */

export function useMedicineAnalysis() {
	const [result, setResult] = useSessionState<MedicineAnalysisResponse | null>(
		"ng:medicine:result",
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyze = useCallback(
		async (name?: string, image?: File) => {
			if (!name?.trim() && !image) return null;

			// Clear stale result before running a new medicine analysis.
			setResult(null);
			setIsLoading(true);
			setError(null);

			try {
				const formData = new FormData();
				if (name?.trim()) formData.append("name", name.trim());
				if (image) formData.append("image", image);

				const response = await apiClient<MedicineAnalysisResponse>(API_ROUTES.MEDICINE, {
					method: "POST",
					body: formData,
					isFile: true,
				});

				setResult(response);
				return response;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to analyze medicine";
				setError(message);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[setResult],
	);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, [setResult]);

	return { result, isLoading, error, analyze, reset };
}

/* ------------------------------------------------------------------ */
/*  Prescription Analysis                                              */
/* ------------------------------------------------------------------ */

export function usePrescriptionAnalysis() {
	const [result, setResult] = useSessionState<PrescriptionAnalysisResponse | null>(
		"ng:prescription:result",
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyze = useCallback(
		async (files: File[]) => {
			if (files.length === 0) return null;

			setIsLoading(true);
			setError(null);

			try {
				const formData = new FormData();
				files.forEach((file) => formData.append("files", file));

				const response = await apiClient<PrescriptionAnalysisResponse>(API_ROUTES.PRESCRIPTION, {
					method: "POST",
					body: formData,
					isFile: true,
				});

				setResult(response);
				return response;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to analyze prescription";
				setError(message);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[setResult],
	);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, [setResult]);

	return { result, isLoading, error, analyze, reset };
}

/* ------------------------------------------------------------------ */
/*  Drug Interaction Check                                             */
/* ------------------------------------------------------------------ */

export function useDrugInteraction() {
	const [result, setResult] = useSessionState<DrugInteractionResponse | null>(
		"ng:drug-interaction:result",
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const checkInteraction = useCallback(
		async (medicines: string[]) => {
			if (medicines.length < 1) return null;

			// Always clear stale result before running a new interaction check.
			setResult(null);
			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient<DrugInteractionResponse>(API_ROUTES.DRUG_INTERACTION, {
					method: "POST",
					body: { medicines },
				});

				setResult(response);
				return response;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to check drug interaction";
				setError(message);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[setResult],
	);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, [setResult]);

	return { result, isLoading, error, checkInteraction, reset };
}

/* ------------------------------------------------------------------ */
/*  Disease Info                                                        */
/* ------------------------------------------------------------------ */

export function useDiseaseInfo() {
	const [result, setResult] = useSessionState<DiseaseInfo | null>("ng:disease:result", null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchInfo = useCallback(
		async (topic: string, language: string = "en") => {
			if (!topic.trim()) return null;

			setIsLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({ topic: topic.trim(), language });
				const response = await apiClient<DiseaseInfo>(
					`${API_ROUTES.DISEASE_INFO}?${params.toString()}`,
				);

				setResult(response);
				return response;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to fetch disease information";
				setError(message);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[setResult],
	);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, [setResult]);

	return { result, isLoading, error, fetchInfo, reset };
}

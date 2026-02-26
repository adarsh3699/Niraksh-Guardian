"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type {
	MedicineAnalysisResponse,
	PrescriptionAnalysisResponse,
	DrugInteractionResponse,
} from "@/types/health";

/* ------------------------------------------------------------------ */
/*  Medicine Analysis                                                  */
/* ------------------------------------------------------------------ */

export function useMedicineAnalysis() {
	const [result, setResult] = useState<MedicineAnalysisResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyze = useCallback(async (name?: string, image?: File) => {
		if (!name?.trim() && !image) return null;

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
	}, []);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, []);

	return { result, isLoading, error, analyze, reset };
}

/* ------------------------------------------------------------------ */
/*  Prescription Analysis                                              */
/* ------------------------------------------------------------------ */

export function usePrescriptionAnalysis() {
	const [result, setResult] = useState<PrescriptionAnalysisResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyze = useCallback(async (files: File[]) => {
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
	}, []);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, []);

	return { result, isLoading, error, analyze, reset };
}

/* ------------------------------------------------------------------ */
/*  Drug Interaction Check                                             */
/* ------------------------------------------------------------------ */

export function useDrugInteraction() {
	const [result, setResult] = useState<DrugInteractionResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const checkInteraction = useCallback(async (medicines: string[]) => {
		if (medicines.length < 2) return null;

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
	}, []);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, []);

	return { result, isLoading, error, checkInteraction, reset };
}

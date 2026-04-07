"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import type {
	ProfileResponse,
	MedicineHistory,
	PrescriptionHistory,
	DrugInteractionHistory,
	SymptomAnalysisHistory,
} from "@/types/health";
import type { HealthReport } from "@/types/report";

const DASHBOARD_SWR_CONFIG = {
	revalidateOnFocus: false,
	dedupingInterval: 30_000,
} as const;

export function useDashboardData() {
	const { data: profile, isLoading: profileLoading } = useSWR<ProfileResponse>(
		API_ROUTES.PROFILE,
		swrFetcher,
		DASHBOARD_SWR_CONFIG,
	);
	const { data: medHistory } = useSWR<MedicineHistory[]>(
		API_ROUTES.HISTORY_MEDICINE,
		swrFetcher,
		DASHBOARD_SWR_CONFIG,
	);
	const { data: rxHistory } = useSWR<PrescriptionHistory[]>(
		API_ROUTES.HISTORY_PRESCRIPTION,
		swrFetcher,
		DASHBOARD_SWR_CONFIG,
	);
	const { data: intHistory } = useSWR<DrugInteractionHistory[]>(
		API_ROUTES.HISTORY_INTERACTION,
		swrFetcher,
		DASHBOARD_SWR_CONFIG,
	);
	const { data: symHistory } = useSWR<SymptomAnalysisHistory[]>(
		API_ROUTES.HISTORY_SYMPTOM,
		swrFetcher,
		DASHBOARD_SWR_CONFIG,
	);
	const { data: reports } = useSWR<HealthReport[]>(
		API_ROUTES.REPORTS,
		swrFetcher,
		DASHBOARD_SWR_CONFIG,
	);

	return {
		profile,
		profileLoading,
		medHistory,
		rxHistory,
		intHistory,
		symHistory,
		reports,
	};
}

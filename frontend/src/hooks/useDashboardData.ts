"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import type { DashboardInsightsResponse } from "@/types/health";

const DASHBOARD_SWR_CONFIG = {
	revalidateOnFocus: false,
	dedupingInterval: 30_000,
} as const;

export function useDashboardData(reportWindow: 3 | 6 | 12 = 6) {
	const {
		data: insights,
		error,
		isLoading,
		mutate,
	} = useSWR<DashboardInsightsResponse>(
		API_ROUTES.DASHBOARD_INSIGHTS_QUERY(reportWindow),
		swrFetcher,
		DASHBOARD_SWR_CONFIG,
	);

	return {
		insights,
		isLoading,
		error,
		retry: () => void mutate(),
	};
}

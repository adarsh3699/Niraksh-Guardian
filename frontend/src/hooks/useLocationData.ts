import { useMemo } from "react";
import useSWR from "swr";
import type { SelectOption } from "@/components/ui/SearchableSelect";

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const CSC_BASE = "https://api.countrystatecity.in/v1";
const CSC_KEY = process.env.NEXT_PUBLIC_CSC_API_KEY ?? "";
const COUNTRY = "IN"; // India

const cscHeaders: HeadersInit = {
	"X-CSCAPI-KEY": CSC_KEY,
};

const cscFetcher = async (url: string) => {
	const res = await fetch(url, { headers: cscHeaders });
	if (!res.ok) {
		throw new Error(`CSC fetch failed: ${res.status}`);
	}
	return res.json();
};

/* ------------------------------------------------------------------ */
/*  Raw API types                                                     */
/* ------------------------------------------------------------------ */

interface CscState {
	id: number;
	name: string;
	iso2: string;
}

interface CscCity {
	id: number;
	name: string;
}

/* ------------------------------------------------------------------ */
/*  useIndiaStates                                                    */
/* ------------------------------------------------------------------ */

/** Returns all Indian states as SelectOptions (value = name, for DB storage) */
export function useIndiaStates() {
	const { data, error, isLoading } = useSWR<CscState[]>(
		`${CSC_BASE}/countries/${COUNTRY}/states`,
		cscFetcher,
		{
			revalidateIfStale: false,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
		},
	);

	const states = useMemo(() => {
		if (!data) return [];
		const opts: SelectOption[] = data.map((s) => ({ value: s.name, label: s.name }));
		opts.sort((a, b) => a.label.localeCompare(b.label));
		return opts;
	}, [data]);

	const nameToIso2 = useMemo(() => {
		if (!data) return {};
		const map: Record<string, string> = {};
		data.forEach((s) => {
			map[s.name] = s.iso2;
		});
		return map;
	}, [data]);

	return {
		states,
		nameToIso2,
		loading: isLoading,
		error: error instanceof Error ? error.message : error ? String(error) : null,
	};
}

/* ------------------------------------------------------------------ */
/*  useStateCities                                                    */
/* ------------------------------------------------------------------ */

/** Returns cities for a given state ISO2 code. Pass undefined to skip. */
export function useStateCities(stateIso2: string | undefined) {
	const { data, error, isLoading } = useSWR<CscCity[]>(
		stateIso2 ? `${CSC_BASE}/countries/${COUNTRY}/states/${stateIso2}/cities` : null,
		cscFetcher,
		{
			revalidateIfStale: false,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
		},
	);

	const cities = useMemo(() => {
		if (!data) return [];
		const opts: SelectOption[] = data.map((c) => ({ value: c.name, label: c.name }));
		opts.sort((a, b) => a.label.localeCompare(b.label));
		return opts;
	}, [data]);

	return {
		cities,
		loading: isLoading,
		error: error instanceof Error ? error.message : error ? String(error) : null,
	};
}

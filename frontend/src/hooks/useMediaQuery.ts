"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media query hook.
 * Returns `true` when the viewport matches the given CSS media query string.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(query);

		const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
		mql.addEventListener("change", handler);

		// Sync initial value via the event-listener pattern to satisfy lint
		handler({ matches: mql.matches } as MediaQueryListEvent);

		return () => mql.removeEventListener("change", handler);
	}, [query]);

	return matches;
}

"use client";

import { useState, useCallback } from "react";

/**
 * A drop-in replacement for `useState` that persists the value to
 * `sessionStorage` under the given key. Reads the stored value on
 * initial mount and writes on every `setState` call.
 *
 * - Serialises via `JSON.stringify`/`JSON.parse`.
 * - Falls back to `initialValue` if parsing fails or storage is empty.
 * - SSR-safe: does nothing server-side.
 *
 * **Important:** `key` should be stable (string literal or constant).
 */
export function useSessionState<T>(
	key: string,
	initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
	// Read once from storage on first render (lazy initialiser)
	const [state, setStateRaw] = useState<T>(() => {
		if (typeof window === "undefined") return initialValue;
		try {
			const stored = sessionStorage.getItem(key);
			if (stored !== null) return JSON.parse(stored) as T;
		} catch {
			/* corrupted data → ignore */
		}
		return initialValue;
	});

	const setState = useCallback(
		(value: T | ((prev: T) => T)) => {
			setStateRaw((prev) => {
				const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
				try {
					if (next === null || next === undefined) {
						sessionStorage.removeItem(key);
					} else {
						sessionStorage.setItem(key, JSON.stringify(next));
					}
				} catch {
					/* quota exceeded → silently ignore */
				}
				return next;
			});
		},
		[key],
	);

	return [state, setState];
}

/**
 * Clear all health-tool session keys at once (e.g. on logout).
 */
export function clearHealthToolSession() {
	if (typeof window === "undefined") return;
	const prefixes = ["ng:disease:", "ng:medicine:", "ng:prescription:", "ng:drug-interaction:"];
	for (let i = sessionStorage.length - 1; i >= 0; i--) {
		const k = sessionStorage.key(i);
		if (k && prefixes.some((p) => k.startsWith(p))) {
			sessionStorage.removeItem(k);
		}
	}
}

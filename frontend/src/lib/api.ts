/* ------------------------------------------------------------------ */
/*  Centralized API client                                            */
/* ------------------------------------------------------------------ */

import type { ApiError as ApiErrorType } from "@/types/api";
import type { RefreshTokenResponse } from "@/types/auth";
import { getAccessToken, setAccessToken, clearTokens, isTokenExpired } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ------------------------------------------------------------------ */
/*  Custom error class                                                */
/* ------------------------------------------------------------------ */

export class ApiError extends Error implements ApiErrorType {
	status: number;
	issues?: ApiErrorType["issues"];

	constructor(status: number, message: string, issues?: ApiErrorType["issues"]) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.issues = issues;
	}
}

/* ------------------------------------------------------------------ */
/*  Refresh-lock (prevents concurrent refreshes)                      */
/* ------------------------------------------------------------------ */

let refreshPromise: Promise<boolean> | null = null;
let isSessionTerminating = false;
const REFRESH_RETRY_DELAY_MS = 150;

function terminateSession(): void {
	if (isSessionTerminating) return;
	isSessionTerminating = true;
	clearTokens();
	if (typeof window !== "undefined") {
		window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
	}
}

async function refreshAccessToken(): Promise<boolean> {
	try {
		const doRefresh = async () =>
			fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

		let res = await doRefresh();

		if (!res.ok && (res.status === 401 || res.status === 409)) {
			try {
				const body = (await res.json()) as { code?: string };
				if (body.code === "rotation_conflict") {
					await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
					res = await doRefresh();
				}
			} catch {
				// Ignore malformed error payloads and continue with failure handling.
			}
		}

		if (!res.ok) return false;

		const data = (await res.json()) as RefreshTokenResponse;
		setAccessToken(data.accessToken);
		return true;
	} catch {
		return false;
	}
}

function requestRefresh(): Promise<boolean> {
	if (!refreshPromise) {
		refreshPromise = refreshAccessToken().finally(() => {
			refreshPromise = null;
		});
	}

	return refreshPromise;
}

/** Acquire or wait for an in-flight refresh. */
export async function ensureFreshToken(): Promise<boolean> {
	const token = getAccessToken();
	if (token && !isTokenExpired(token)) return true;
	return requestRefresh();
}

/** Force refresh even if access token is still valid. */
export async function forceRefreshToken(): Promise<boolean> {
	return requestRefresh();
}

/* ------------------------------------------------------------------ */
/*  Main fetch helper                                                 */
/* ------------------------------------------------------------------ */

interface RequestOptions {
	method?: string;
	body?: unknown;
	/** When `true`, `body` is treated as `FormData` (no Content-Type). */
	isFile?: boolean;
	/** Skip the automatic auth header (e.g. for login/signup). */
	noAuth?: boolean;
}

/**
 * Typed API client.
 *
 * - Auto-injects `Authorization` header
 * - Pre-flight token expiry check → auto-refresh
 * - 401 handling → clear tokens, redirect to `/login`
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
	const { method = "GET", body, isFile = false, noAuth = false } = options;

	/* ---- Auth pre-flight ---- */
	if (!noAuth) {
		const ok = await ensureFreshToken();
		if (!ok) {
			terminateSession();
			throw new ApiError(401, "Session expired. Please log in again.");
		}
	}

	/* ---- Build headers ---- */
	const headers: Record<string, string> = {};

	if (!noAuth) {
		const token = getAccessToken();
		if (token) headers["Authorization"] = `Bearer ${token}`;
	}

	if (!isFile && body) {
		headers["Content-Type"] = "application/json";
	}

	/* ---- Execute fetch ---- */
	const res = await fetch(`${API_BASE_URL}${endpoint}`, {
		method,
		headers,
		credentials: "include",
		body: isFile ? (body as FormData) : body ? JSON.stringify(body) : undefined,
	});

	/* ---- Handle non-2xx ---- */
	if (!res.ok) {
		/* 401 → try one refresh, then bail */
		if (res.status === 401 && !noAuth) {
			const refreshed = await forceRefreshToken();
			if (refreshed) {
				// Retry the original request once
				return apiClient<T>(endpoint, { ...options, noAuth: false });
			}
			terminateSession();
			throw new ApiError(401, "Session expired. Please log in again.");
		}

		let errorMessage = "Something went wrong";
		let issues: ApiErrorType["issues"];

		try {
			const errorBody = await res.json();
			if (typeof errorBody.error === "string") {
				errorMessage = errorBody.error;
			} else if (Array.isArray(errorBody.error)) {
				// Zod validation issues
				issues = errorBody.error;
				errorMessage = errorBody.error.map((i: { message: string }) => i.message).join(", ");
			}
			if (errorBody.details) {
				errorMessage += `: ${errorBody.details}`;
			}
		} catch {
			/* response wasn't JSON — keep default message */
		}

		throw new ApiError(res.status, errorMessage, issues);
	}

	/* ---- Parse success ---- */
	// Some endpoints may return 204 No Content
	if (res.status === 204) return undefined as T;

	return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/*  SWR fetcher                                                       */
/* ------------------------------------------------------------------ */

/**
 * SWR-compatible fetcher that uses apiClient.
 *
 * Usage: `useSWR("/api/chats", swrFetcher)`
 */
export async function swrFetcher<T>(endpoint: string): Promise<T> {
	return apiClient<T>(endpoint);
}

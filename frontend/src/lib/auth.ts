/* ------------------------------------------------------------------ */
/*  Auth token helpers (localStorage)                                 */
/* ------------------------------------------------------------------ */

import type { User } from "@/types/auth";

const ACCESS_TOKEN_KEY = "JWT_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DETAILS_KEY = "user_details";

/* — Access token — */

export function getAccessToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/* — Refresh token — */

export function getRefreshToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
	localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/* — User details — */

export function getUserDetails(): User | null {
	if (typeof window === "undefined") return null;
	const raw = localStorage.getItem(USER_DETAILS_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as User;
	} catch {
		return null;
	}
}

export function setUserDetails(user: User): void {
	localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(user));
}

/* — Clear all — */

export function clearTokens(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	localStorage.removeItem(USER_DETAILS_KEY);
}

/* ------------------------------------------------------------------ */
/*  JWT decode helpers                                                */
/* ------------------------------------------------------------------ */

interface JwtPayload {
	exp?: number;
	iat?: number;
	[key: string]: unknown;
}

/** Decode a JWT payload (no signature verification — client-side only). */
function decodeJwt(token: string): JwtPayload | null {
	try {
		const base64 = token.split(".")[1];
		if (!base64) return null;
		const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
		return JSON.parse(json) as JwtPayload;
	} catch {
		return null;
	}
}

/** Returns `true` if the token is missing, malformed, or past its `exp`. */
export function isTokenExpired(token: string | null): boolean {
	if (!token) return true;
	const payload = decodeJwt(token);
	if (!payload?.exp) return true;
	// Add 30-second buffer so we refresh slightly before real expiry
	return Date.now() >= payload.exp * 1000 - 30_000;
}

/** Milliseconds until the token expires (0 if already expired). */
export function getTokenExpiryTime(token: string): number {
	const payload = decodeJwt(token);
	if (!payload?.exp) return 0;
	return Math.max(0, payload.exp * 1000 - Date.now());
}

"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import type { User, Tokens } from "@/types/auth";
import {
	getAccessToken,
	getRefreshToken,
	getUserDetails,
	setAccessToken,
	setUserDetails,
	clearTokens,
	isTokenExpired,
} from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { RefreshTokenResponse } from "@/types/auth";

/* ------------------------------------------------------------------ */
/*  Context shape                                                     */
/* ------------------------------------------------------------------ */

interface AuthContextType {
	isAuthenticated: boolean;
	user: User | null;
	isLoading: boolean;
	login: (tokens: Tokens, user: User) => void;
	logout: () => Promise<void>;
	refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	/* Hydrate from localStorage on first mount */
	useEffect(() => {
		let cancelled = false;

		const hydrate = async () => {
			const token = getAccessToken();
			const stored = getUserDetails();

			if (token && !isTokenExpired(token) && stored) {
				if (!cancelled) setUser(stored);
			} else if (token && isTokenExpired(token)) {
				const rt = getRefreshToken();
				const refreshBody = rt ? JSON.stringify({ refreshToken: rt }) : undefined;
				try {
					const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ROUTES.REFRESH_TOKEN}`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: refreshBody,
					});
					if (res.ok) {
						const data: RefreshTokenResponse = await res.json();
						setAccessToken(data.accessToken);
						if (!cancelled) setUser(stored);
					} else {
						clearTokens();
					}
				} catch {
					clearTokens();
				}
			}

			if (!cancelled) setIsLoading(false);
		};

		void hydrate();
		return () => {
			cancelled = true;
		};
	}, []);

	/* ---- Actions ---- */

	const login = useCallback((tokens: Tokens, userData: User) => {
		setAccessToken(tokens.accessToken);
		setUserDetails(userData);
		setUser(userData);
	}, []);

	const logout = useCallback(async () => {
		try {
			const refreshToken = getRefreshToken();
			await apiClient(API_ROUTES.LOGOUT, {
				method: "POST",
				body: { refreshToken },
			});
		} catch {
			/* Best-effort — clear local state regardless */
		}
		clearTokens();
		setUser(null);
	}, []);

	const refreshAuth = useCallback(async (): Promise<boolean> => {
		const refreshToken = getRefreshToken();
		const refreshPayload = refreshToken ? { refreshToken } : undefined;
		try {
			const data = await apiClient<RefreshTokenResponse>(API_ROUTES.REFRESH_TOKEN, {
				method: "POST",
				body: refreshPayload,
				noAuth: true,
			});
			setAccessToken(data.accessToken);
			return true;
		} catch {
			clearTokens();
			setUser(null);
			return false;
		}
	}, []);

	const value = useMemo<AuthContextType>(
		() => ({
			isAuthenticated: !!user,
			user,
			isLoading,
			login,
			logout,
			refreshAuth,
		}),
		[user, isLoading, login, logout, refreshAuth],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextType {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
	return ctx;
}

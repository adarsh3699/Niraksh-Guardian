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
import { apiClient, ensureFreshToken, forceRefreshToken } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";

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
				try {
					const refreshed = await ensureFreshToken();
					if (refreshed && stored) {
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

	/* Keep auth state in sync across tabs */
	useEffect(() => {
		const syncFromStorage = (event: StorageEvent) => {
			if (
				event.key &&
				event.key !== "JWT_token" &&
				event.key !== "user_details" &&
				event.key !== "refresh_token"
			) {
				return;
			}

			const token = getAccessToken();
			const stored = getUserDetails();

			if (token && !isTokenExpired(token) && stored) {
				setUser(stored);
				return;
			}

			setUser(null);
		};

		window.addEventListener("storage", syncFromStorage);
		return () => {
			window.removeEventListener("storage", syncFromStorage);
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
				noAuth: true,
			});
		} catch {
			/* Best-effort — clear local state regardless */
		}
		clearTokens();
		setUser(null);
	}, []);

	const refreshAuth = useCallback(async (): Promise<boolean> => {
		try {
			return await forceRefreshToken();
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

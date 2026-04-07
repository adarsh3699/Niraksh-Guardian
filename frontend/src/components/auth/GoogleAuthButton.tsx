"use client";

import { useCallback, useRef, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import type { AuthResponse } from "@/types/auth";
import { Spinner } from "@/components/ui/Spinner";

interface GoogleAuthButtonProps {
	loadingText?: string;
	onSuccess?: () => void;
}

/** Google "G" SVG logo */
function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	);
}

export function GoogleAuthButton({
	loadingText = "Connecting to Google...",
	onSuccess,
}: GoogleAuthButtonProps) {
	const { login } = useAuth();
	const { addToast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const isFetchingRef = useRef(false);

	const handleGoogleLogin = useGoogleLogin({
		onSuccess: useCallback(
			async (tokenResponse: { access_token: string }) => {
				if (isFetchingRef.current) return;
				isFetchingRef.current = true;
				setIsLoading(true);
				try {
					const data = await apiClient<AuthResponse>(API_ROUTES.GOOGLE_AUTH, {
						method: "POST",
						body: { accessToken: tokenResponse.access_token },
						noAuth: true,
					});
					login(data.tokens, data.user);
					addToast("success", data.message || "Signed in with Google");
					onSuccess?.();
				} catch (err) {
					addToast("error", err instanceof Error ? err.message : "Google sign-in failed");
				} finally {
					setIsLoading(false);
					isFetchingRef.current = false;
				}
			},
			[login, addToast, onSuccess],
		),
		onError: () => addToast("error", "Google sign-in failed"),
	});

	return (
		<button
			type="button"
			onClick={() => handleGoogleLogin()}
			disabled={isLoading}
			className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-white text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
		>
			{isLoading ? (
				<>
					<Spinner size="sm" />
					<span className="text-muted">{loadingText}</span>
				</>
			) : (
				<>
					<GoogleIcon />
					<span>Continue with Google</span>
				</>
			)}
		</button>
	);
}

"use client";

import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Auth route group layout.
 * Split-screen: left=teal illustration panel (desktop only), right=form.
 * Redirects authenticated users away from auth pages.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.replace("/dashboard");
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	}

	if (isAuthenticated) {
		return null;
	}

	return <div className="flex min-h-screen w-full overflow-hidden">{children}</div>;
}

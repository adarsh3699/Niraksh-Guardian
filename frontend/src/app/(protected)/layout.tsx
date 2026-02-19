"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Auth-guard layout for all protected routes.
 * Redirects unauthenticated users to /login with a returnUrl.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
		}
	}, [isAuthenticated, isLoading, router, pathname]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return <>{children}</>;
}

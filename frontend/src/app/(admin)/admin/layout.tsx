"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading, user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (isLoading) return;
		if (!isAuthenticated) router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
		else if (user?.role !== "ADMIN") router.replace("/dashboard");
	}, [isAuthenticated, isLoading, pathname, router, user?.role]);

	if (isLoading || !isAuthenticated || user?.role !== "ADMIN") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	}

	return <main className="min-h-screen bg-background">{children}</main>;
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { AppSidebar, MobileSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

/**
 * Auth-guard layout for all protected routes.
 * Includes a persistent sidebar (desktop) and header with mobile hamburger.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading, user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		if (isLoading) return;
		if (!isAuthenticated) {
			router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
			return;
		}
		if (user?.role === "DOCTOR") {
			router.replace("/doctor/dashboard");
		} else if (user?.role === "ADMIN") {
			router.replace("/admin/doctor-applications");
		}
	}, [isAuthenticated, isLoading, pathname, router, user?.role]);

	const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
	const closeMenu = useCallback(() => setMenuOpen(false), []);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	}

	if (!isAuthenticated || user?.role === "DOCTOR" || user?.role === "ADMIN") {
		return null;
	}

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			{/* Desktop sidebar */}
			<AppSidebar />

			{/* Mobile sidebar */}
			<MobileSidebar open={menuOpen} onClose={closeMenu} />

			{/* Main content area */}
			<div className="flex min-w-0 flex-1 flex-col">
				<DashboardHeader onMenuClick={toggleMenu} />
				<main className="flex-1 overflow-y-auto">{children}</main>
			</div>
		</div>
	);
}

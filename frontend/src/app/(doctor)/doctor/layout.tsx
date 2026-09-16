"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { DoctorHeader } from "@/components/doctor-portal/DoctorHeader";
import { DoctorSidebar } from "@/components/doctor-portal/DoctorSidebar";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading, user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		if (isLoading) return;
		if (!isAuthenticated) {
			router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
		} else if (user?.role !== "DOCTOR") {
			router.replace("/dashboard");
		}
	}, [isAuthenticated, isLoading, pathname, router, user?.role]);

	if (isLoading || !isAuthenticated || user?.role !== "DOCTOR") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	}

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<DoctorSidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<DoctorHeader onMenuClick={() => setMenuOpen((open) => !open)} />
				{menuOpen && (
					<div className="absolute inset-x-0 top-14 z-50 border-b border-border bg-surface p-4 shadow-lg lg:hidden">
						<DoctorSidebar mobile />
					</div>
				)}
				<main className="flex-1 overflow-y-auto">{children}</main>
			</div>
		</div>
	);
}

"use client";

import { Bell, Home, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
	"/doctor/dashboard": "Dashboard",
	"/doctor/application": "My Application",
	"/doctor/appointments": "Appointments",
	"/doctor/patients": "My Patients",
	"/doctor/availability": "Availability",
};

export function DoctorHeader({ onMenuClick }: { onMenuClick: () => void }) {
	const pathname = usePathname();
	const label =
		Object.entries(labels).find(([path]) => pathname.startsWith(path))?.[1] ?? "Doctor Portal";

	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onMenuClick}
					className="rounded-lg p-2 text-muted hover:bg-border hover:text-foreground lg:hidden"
					aria-label="Open doctor menu"
				>
					<Menu className="size-5" />
				</button>
				<nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
					<Link href="/doctor/dashboard" className="text-muted hover:text-foreground">
						<Home className="size-4" />
					</Link>
					<span className="text-muted/50">/</span>
					<span className="font-medium text-foreground">{label}</span>
				</nav>
			</div>
			<button
				type="button"
				className="relative rounded-lg p-2 text-muted hover:bg-border hover:text-foreground"
				aria-label="Notifications"
			>
				<Bell className="size-5" />
				<span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
			</button>
		</header>
	);
}

"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, Home } from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Path → label mapping                                               */
/* ------------------------------------------------------------------ */

const ROUTE_LABELS: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/assistance": "AI Assistant",
	"/symptom-analysis": "Symptom Analysis",
	"/prescription": "Prescription",
	"/medicine": "Medicine Search",
	"/drug-interaction": "Drug Interaction",
	"/disease": "Disease Info",
	"/profile": "Profile",
	"/history": "Health History",
	"/reports": "Reports",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface DashboardHeaderProps {
	onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
	const pathname = usePathname();

	const pageLabel =
		Object.entries(ROUTE_LABELS).find(([path]) =>
			path === "/dashboard" ? pathname === path : pathname.startsWith(path),
		)?.[1] ?? "Dashboard";

	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
			{/* Left: hamburger + breadcrumb */}
			<div className="flex items-center gap-3">
				<button
					onClick={onMenuClick}
					className="rounded-lg p-2 text-muted transition-colors hover:bg-border hover:text-foreground lg:hidden"
					aria-label="Open menu"
				>
					<Menu className="size-5" />
				</button>

				{/* Breadcrumb */}
				<nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
					<Link href="/dashboard" className="text-muted transition-colors hover:text-foreground">
						<Home className="size-4" />
					</Link>
					<span className="text-muted/50">/</span>
					<span className="font-medium text-foreground">{pageLabel}</span>
				</nav>
			</div>

			{/* Right: notifications placeholder */}
			<div className="flex items-center gap-2">
				<button
					className="relative rounded-lg p-2 text-muted transition-colors hover:bg-border hover:text-foreground"
					aria-label="Notifications"
				>
					<Bell className="size-5" />
					{/* Dot indicator */}
					<span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
				</button>
			</div>
		</header>
	);
}

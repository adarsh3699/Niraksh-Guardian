"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	CalendarDays,
	Clock3,
	FileCheck2,
	LayoutDashboard,
	LogOut,
	Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthProvider";
import { useLogout } from "@/hooks/useLogout";

const navItems = [
	{ href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/doctor/appointments", label: "Appointments", icon: CalendarDays },
	{ href: "/doctor/patients", label: "My Patients", icon: Users },
	{ href: "/doctor/availability", label: "Availability", icon: Clock3 },
	{ href: "/doctor/application", label: "My application", icon: FileCheck2 },
];

export function DoctorSidebar({ mobile = false }: { mobile?: boolean }) {
	const pathname = usePathname();
	const { user } = useAuth();
	const handleLogout = useLogout();

	return (
		<aside
			className={
				mobile
					? "flex w-full flex-col bg-surface"
					: "hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex"
			}
		>
			<div className="flex items-center gap-3 p-6">
				<Image src="/brandLogo.png" alt="Niraksh Guardian Logo" width={40} height={40} priority />
				<div>
					<p className="font-heading text-xl font-bold tracking-tight text-foreground">Niraksh</p>
					<p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
						Doctor Portal
					</p>
				</div>
			</div>

			<nav className="flex flex-1 flex-col gap-2 px-3 pt-2" aria-label="Doctor portal navigation">
				<p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-muted">
					Workspace
				</p>
				{navItems.map((item) => {
					const active =
						pathname === item.href ||
						(item.href !== "/doctor/dashboard" && pathname.startsWith(item.href));
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 rounded-lg border-l-[3px] px-4 py-2.5 text-sm font-medium transition-all",
								active
									? "border-l-primary bg-primary/10 text-primary"
									: "border-l-transparent text-muted hover:bg-primary/5 hover:text-foreground",
							)}
						>
							<item.icon className="size-[18px]" />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto border-t border-border p-4">
				<div className="flex items-center gap-3 rounded-xl p-2">
					<div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
						{user?.name?.charAt(0).toUpperCase() ?? "D"}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-foreground">
							{user?.name ?? "Doctor"}
						</p>
						<p className="truncate text-xs text-muted">{user?.email}</p>
					</div>
					<button
						type="button"
						onClick={handleLogout}
						className="rounded-lg p-2 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
						aria-label="Logout"
					>
						<LogOut className="size-4" />
					</button>
				</div>
			</div>
		</aside>
	);
}

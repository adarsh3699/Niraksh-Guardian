"use client";

import Image from "next/image";
import { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	MessageSquare,
	Stethoscope,
	FileText,
	Pill,
	AlertTriangle,
	BookOpen,
	User,
	History,
	FileBarChart,
	LogOut,
	X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthProvider";

/* ------------------------------------------------------------------ */
/*  Sidebar nav config                                                 */
/* ------------------------------------------------------------------ */

const mainNavItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/assistance", label: "AI Assistant", icon: MessageSquare },
	{ href: "/symptom-analysis", label: "Symptom Analysis", icon: Stethoscope },
	{ href: "/drug-interaction", label: "Drug Interaction", icon: AlertTriangle },
	{ href: "/prescription", label: "Prescription", icon: FileText },
	{ href: "/medicine", label: "Medicine Search", icon: Pill },
	{ href: "/disease", label: "Disease Info", icon: BookOpen },
];

const accountNavItems = [
	{ href: "/profile", label: "Profile", icon: User },
	{ href: "/history", label: "Health History", icon: History },
	{ href: "/reports", label: "Reports", icon: FileBarChart },
];

/* ------------------------------------------------------------------ */
/*  Desktop Sidebar                                                    */
/* ------------------------------------------------------------------ */

export function AppSidebar() {
	const pathname = usePathname();
	const { user, logout } = useAuth();

	const handleLogout = useCallback(async () => {
		await logout();
	}, [logout]);

	return (
		<aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
			{/* Logo */}
			<div className="flex items-center gap-3 p-6">
				<Image
					src="/brandLogo.png"
					alt="Niraksh Guardian Logo"
					width={40}
					height={40}
					priority
					className="size-10"
				/>
				<Link
					href="/dashboard"
					className="font-heading text-xl font-bold tracking-tight text-foreground"
				>
					Niraksh
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pt-2">
				{/* Main section */}
				<div>
					<p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted">
						Health Tools
					</p>
					<div className="flex flex-col gap-0.5">
						{mainNavItems.map((item) => {
							const isActive =
								item.href === "/dashboard"
									? pathname === item.href
									: pathname.startsWith(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-3 rounded-lg border-l-[3px] px-4 py-2.5 text-sm font-medium transition-all duration-200",
										isActive
											? "border-l-primary bg-primary/10 text-primary"
											: "border-l-transparent text-muted hover:bg-primary/5 hover:text-foreground",
									)}
								>
									<item.icon className="size-[18px]" />
									{item.label}
								</Link>
							);
						})}
					</div>
				</div>

				{/* Account section */}
				<div>
					<p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted">
						Account
					</p>
					<div className="flex flex-col gap-0.5">
						{accountNavItems.map((item) => {
							const isActive = pathname.startsWith(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-3 rounded-lg border-l-[3px] px-4 py-2.5 text-sm font-medium transition-all duration-200",
										isActive
											? "border-l-primary bg-primary/10 text-primary"
											: "border-l-transparent text-muted hover:bg-primary/5 hover:text-foreground",
									)}
								>
									<item.icon className="size-[18px]" />
									{item.label}
								</Link>
							);
						})}
					</div>
				</div>
			</nav>

			{/* User profile footer */}
			<div className="mt-auto border-t border-border p-4">
				<div className="flex items-center gap-3 rounded-xl p-2">
					{/* Avatar */}
					<div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
						{user?.name?.charAt(0).toUpperCase() ?? "U"}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-foreground">{user?.name ?? "User"}</p>
						<p className="truncate text-xs text-muted">{user?.email}</p>
					</div>
					<button
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

/* ------------------------------------------------------------------ */
/*  Mobile Sidebar (overlay)                                           */
/* ------------------------------------------------------------------ */

interface MobileSidebarProps {
	open: boolean;
	onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
	const pathname = usePathname();
	const { user, logout } = useAuth();

	const handleLogout = useCallback(async () => {
		await logout();
		onClose();
	}, [logout, onClose]);

	return (
		<>
			{/* Overlay */}
			{open && (
				<div
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
					onClick={onClose}
				/>
			)}

			{/* Drawer */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform duration-300 lg:hidden",
					open ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-5">
					<div className="flex items-center gap-3">
						<Image
							src="/brandLogo.png"
							alt="Niraksh Guardian Logo"
							width={32}
							height={32}
							className="size-10"
						/>
						<span className="font-heading text-lg font-bold text-foreground">Niraksh</span>
					</div>
					<button
						onClick={onClose}
						className="rounded-lg p-2 text-muted transition-colors hover:bg-border"
						aria-label="Close menu"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pt-2">
					<div>
						<p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted">
							Health Tools
						</p>
						<div className="flex flex-col gap-0.5">
							{mainNavItems.map((item) => {
								const isActive =
									item.href === "/dashboard"
										? pathname === item.href
										: pathname.startsWith(item.href);
								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={onClose}
										className={cn(
											"flex items-center gap-3 rounded-lg border-l-[3px] px-4 py-2.5 text-sm font-medium transition-all duration-200",
											isActive
												? "border-l-primary bg-primary/10 text-primary"
												: "border-l-transparent text-muted hover:bg-primary/5 hover:text-foreground",
										)}
									>
										<item.icon className="size-[18px]" />
										{item.label}
									</Link>
								);
							})}
						</div>
					</div>

					<div>
						<p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted">
							Account
						</p>
						<div className="flex flex-col gap-0.5">
							{accountNavItems.map((item) => {
								const isActive = pathname.startsWith(item.href);
								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={onClose}
										className={cn(
											"flex items-center gap-3 rounded-lg border-l-[3px] px-4 py-2.5 text-sm font-medium transition-all duration-200",
											isActive
												? "border-l-primary bg-primary/10 text-primary"
												: "border-l-transparent text-muted hover:bg-primary/5 hover:text-foreground",
										)}
									>
										<item.icon className="size-[18px]" />
										{item.label}
									</Link>
								);
							})}
						</div>
					</div>
				</nav>

				{/* User footer */}
				<div className="mt-auto border-t border-border p-4">
					<div className="flex items-center gap-3 rounded-xl p-2">
						<div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
							{user?.name?.charAt(0).toUpperCase() ?? "U"}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-foreground">
								{user?.name ?? "User"}
							</p>
							<p className="truncate text-xs text-muted">{user?.email}</p>
						</div>
						<button
							onClick={handleLogout}
							className="rounded-lg p-2 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
							aria-label="Logout"
						>
							<LogOut className="size-4" />
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}

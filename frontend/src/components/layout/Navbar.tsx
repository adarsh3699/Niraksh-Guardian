"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthProvider";
import { NAV_ITEMS } from "@/lib/constants";
import { MobileMenu } from "./MobileMenu";

/* ------------------------------------------------------------------ */
/*  Navbar — white bg, sticky top, teal accent, pill links            */
/*  Matches old frontend design                                       */
/* ------------------------------------------------------------------ */

export function Navbar() {
	const pathname = usePathname();
	const { isAuthenticated, user, logout } = useAuth();
	const [menuOpen, setMenuOpen] = useState(false);

	const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
	const closeMenu = useCallback(() => setMenuOpen(false), []);

	const filteredItems = NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated);

	const handleLogout = useCallback(async () => {
		await logout();
	}, [logout]);

	return (
		<>
			<header
				className="sticky top-0 z-[1000] w-full bg-surface"
				style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
			>
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					{/* ---- Left: Hamburger (mobile) + Brand ---- */}
					<div className="flex items-center gap-3">
						<button
							onClick={toggleMenu}
							className="rounded-full p-2 text-foreground transition-colors hover:bg-border lg:hidden"
							aria-label="Toggle menu"
							aria-expanded={menuOpen}
						>
							<Menu className="size-5" />
						</button>

						<Link
							href="/"
							className="font-heading text-xl font-bold tracking-tight text-primary transition-transform hover:-translate-y-0.5"
						>
							Niraksh Guardian
						</Link>
					</div>

					{/* ---- Center: Desktop nav links ---- */}
					<nav className="hidden lg:block" aria-label="Main navigation">
						<ul className="flex items-center gap-1">
							{filteredItems.map((item) => {
								const active = pathname === item.path;
								return (
									<li key={item.path}>
										<Link
											href={item.path}
											className={cn(
												"relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5",
												active
													? "bg-primary/10 text-primary"
													: "text-foreground hover:bg-primary/[0.06]",
											)}
										>
											{item.label}
											{/* Active underline indicator */}
											<span
												className={cn(
													"absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-primary transition-all duration-300",
													active ? "w-3/5" : "w-0",
												)}
											/>
										</Link>
									</li>
								);
							})}
						</ul>
					</nav>

					{/* ---- Right: Auth area ---- */}
					<div className="hidden items-center gap-3 lg:flex">
						{isAuthenticated ? (
							<>
								{user && (
									<Link
										href="/profile"
										className="text-sm font-medium text-foreground transition-colors hover:text-primary"
									>
										{user.name}
									</Link>
								)}
								<button
									onClick={handleLogout}
									className="inline-flex items-center gap-1.5 rounded-full border-2 border-destructive px-4 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
								>
									<LogOut className="size-4" />
									Logout
								</button>
							</>
						) : (
							<Link
								href="/login"
								className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
							>
								<LogIn className="size-4" />
								Login
							</Link>
						)}
					</div>

					{/* ---- Mobile: Profile + Login shortcut ---- */}
					<div className="flex items-center gap-2 lg:hidden">
						{isAuthenticated ? (
							user && (
								<Link
									href="/profile"
									className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
									aria-label="Profile"
								>
									{user.name?.charAt(0).toUpperCase()}
								</Link>
							)
						) : (
							<Link
								href="/login"
								className="rounded-full border-2 border-primary px-3 py-1 text-xs font-semibold text-primary"
							>
								Login
							</Link>
						)}
					</div>
				</div>
			</header>

			{/* Mobile side-drawer */}
			<MobileMenu open={menuOpen} onClose={closeMenu} />
		</>
	);
}

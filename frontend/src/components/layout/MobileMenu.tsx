"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthProvider";
import { NAV_ITEMS } from "@/lib/constants";
import { useLogout } from "@/hooks/useLogout";

/* ------------------------------------------------------------------ */
/*  Mobile Menu — slides in from left (matching old frontend)         */
/* ------------------------------------------------------------------ */

interface MobileMenuProps {
	open: boolean;
	onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
	const pathname = usePathname();
	const { isAuthenticated, user } = useAuth();
	const menuRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);

	/* Lock body scroll when open */
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			closeRef.current?.focus();
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	/* Close on Escape */
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, onClose]);

	/* Focus trap */
	useEffect(() => {
		if (!open || !menuRef.current) return;
		const focusable = menuRef.current.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
		);
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		const trap = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;
			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		};
		window.addEventListener("keydown", trap);
		return () => window.removeEventListener("keydown", trap);
	}, [open]);

	const filteredItems = NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated);

	const handleLogout = useLogout(onClose);

	return (
		<>
			{/* Backdrop */}
			<div
				className={cn(
					"fixed inset-0 z-[1001] bg-black/50 backdrop-blur-[3px] transition-opacity duration-300",
					open ? "opacity-100" : "pointer-events-none opacity-0",
				)}
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Drawer */}
			<div
				ref={menuRef}
				role="dialog"
				aria-modal="true"
				aria-label="Navigation menu"
				className={cn(
					"fixed top-0 left-0 z-[1002] flex h-full min-w-[300px] flex-col bg-surface shadow-xl",
					"transition-transform duration-400 ease-[cubic-bezier(0.19,1,0.22,1)]",
					open ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-5 py-4">
					<Link href="/" onClick={onClose} className="flex items-center gap-2">
						<Image
							src="/brandLogo.png"
							alt="Niraksh Guardian Logo"
							width={32}
							height={32}
							className="size-8"
						/>
						<span className="font-heading text-lg font-bold text-primary">Niraksh</span>
					</Link>
					<button
						ref={closeRef}
						onClick={onClose}
						className="rounded-full p-2 text-muted transition-all hover:bg-border hover:rotate-[-90deg]"
						aria-label="Close menu"
					>
						<X className="size-5" />
					</button>
				</div>
				{/* User banner (when logged in) */}
				{isAuthenticated && user && (
					<div className="border-b border-border px-5 py-3">
						<p className="text-sm font-semibold text-foreground">{user.name}</p>
						<p className="text-xs text-muted">{user.email}</p>
					</div>
				)}
				{/* Nav links */}
				<nav className="flex-1 overflow-y-auto px-3 py-4">
					<ul className="flex flex-col gap-1">
						{filteredItems.map((item) => {
							const Icon = item.icon;
							const active = pathname === item.path;
							return (
								<li key={item.path}>
									<Link
										href={item.path}
										onClick={onClose}
										className={cn(
											"flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
											active
												? "bg-primary/10 text-primary"
												: "text-foreground hover:bg-primary/[0.08]",
										)}
									>
										<Icon className="size-5" />
										{item.label}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
				{/* Bottom action */}
				<div className="border-t border-border px-5 py-4">
					{isAuthenticated ? (
						<button
							onClick={handleLogout}
							className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
						>
							<LogOut className="size-5" />
							Logout
						</button>
					) : (
						<Link
							href="/login"
							onClick={onClose}
							className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
						>
							<LogIn className="size-5" />
							Login
						</Link>
					)}
				</div>
			</div>
		</>
	);
}

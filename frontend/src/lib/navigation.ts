import { FileText, LayoutDashboard, User, Info, type LucideIcon } from "lucide-react";

export interface NavItem {
	label: string;
	path: string;
	icon: LucideIcon;
	requiresAuth: boolean;
}

export const NAV_ITEMS: NavItem[] = [
	{ label: "Home", path: "/", icon: Info, requiresAuth: false },
	{ label: "Works", path: "/#how-it-works", icon: FileText, requiresAuth: false },
	{ label: "Tools", path: "/#tools", icon: LayoutDashboard, requiresAuth: false },
	{ label: "About", path: "/about", icon: Info, requiresAuth: false },
	{ label: "Dashboard", path: "/dashboard", icon: User, requiresAuth: true },
];

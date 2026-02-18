import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Layout for pages that include Navbar & Footer
 * (landing page, dashboard, profile, etc.)
 */
export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<Navbar />
			<main className="min-h-[calc(100vh-4rem)]">{children}</main>
			<Footer />
		</>
	);
}

import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const DashboardClient = dynamic(() => import("./DashboardClient").then((m) => m.DashboardClient), {
	loading: () => (
		<div className="flex min-h-[60vh] items-center justify-center">
			<Spinner size="lg" className="text-primary" />
		</div>
	),
});

export const metadata: Metadata = generatePageMetadata({
	title: "Dashboard",
	description:
		"Insight-focused dashboard with recent prescribed medicines, lab trend charts, and health change highlights.",
	path: "/dashboard",
	keywords: [
		"health dashboard",
		"prescription insights",
		"lab trends",
		"health stats",
		"Niraksh Guardian",
	],
});

export default function DashboardPage() {
	return <DashboardClient />;
}

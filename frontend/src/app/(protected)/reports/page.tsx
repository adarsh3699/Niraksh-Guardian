import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { ReportsClient } from "./ReportsClient";

export const metadata: Metadata = generatePageMetadata({
	title: "Health Reports",
	description:
		"Generate and download AI-powered health summary reports based on your profile and history.",
	noIndex: true,
});

export default function ReportsPage() {
	return <ReportsClient />;
}

import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { HistoryClient } from "./HistoryClient";

export const metadata: Metadata = generatePageMetadata({
	title: "Health History",
	description:
		"View and manage your health tool usage history — medicines, prescriptions, drug interactions, and symptom analyses.",
	noIndex: true,
});

export default function HistoryPage() {
	return <HistoryClient />;
}

import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { DoctorDashboardClient } from "./DoctorDashboardClient";

export const metadata: Metadata = generatePageMetadata({
	title: "Doctor Dashboard",
	description:
		"Review consultations, patient access, and health context in the Niraksh Guardian doctor portal.",
	path: "/doctor/dashboard",
	noIndex: true,
});

export default function DoctorDashboardPage() {
	return <DoctorDashboardClient />;
}

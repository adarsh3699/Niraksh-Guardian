import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";
import { generatePageMetadata } from "@/lib/seo";

const ClinicalIntakeClient = dynamic(() => import("./ClinicalIntakeClient").then((m) => m.ClinicalIntakeClient), {
	loading: () => (
		<div className="flex min-h-[60vh] items-center justify-center">
			<Spinner size="lg" className="text-primary" />
		</div>
	),
});

export const metadata: Metadata = generatePageMetadata({
	title: "Prepare for your visit",
	description: "Complete a structured clinical history before your doctor consultation.",
	path: "/clinical-intake",
});

export default function ClinicalIntakePage() {
	return <ClinicalIntakeClient />;
}

import { Suspense } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const DoctorSuggestClient = dynamic(() =>
	import("./DoctorSuggestClient").then((m) => m.DoctorSuggestClient),
);

export const metadata: Metadata = generatePageMetadata({
	title: "Symptom Analysis",
	description:
		"Analyze your symptoms with AI and find the right doctor. Search by specialization, location, fees, and more.",
	path: "/symptom-analysis",
	keywords: [
		"symptom analysis",
		"find doctor",
		"specialist recommendation",
		"symptom checker",
		"doctor search",
		"nearby doctors",
	],
});

export default function SymptomAnalysisPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[60vh] items-center justify-center">
					<Spinner size="lg" className="text-primary" />
				</div>
			}
		>
			<DoctorSuggestClient />
		</Suspense>
	);
}

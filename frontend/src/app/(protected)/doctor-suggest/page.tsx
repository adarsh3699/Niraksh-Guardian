import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const DoctorSuggestClient = dynamic(
	() => import("./DoctorSuggestClient").then((m) => m.DoctorSuggestClient),
	{
		loading: () => (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		),
	},
);

export const metadata: Metadata = generatePageMetadata({
	title: "Doctor Suggestion",
	description:
		"Analyze your symptoms with AI and find the right doctor. Search by specialization, location, fees, and more.",
	path: "/doctor-suggest",
	keywords: [
		"find doctor",
		"doctor suggestion",
		"specialist recommendation",
		"symptom analysis",
		"doctor search",
		"nearby doctors",
	],
});

export default function DoctorSuggestPage() {
	return <DoctorSuggestClient />;
}

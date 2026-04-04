import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const PrescriptionClient = dynamic(
	() => import("./PrescriptionClient").then((m) => m.PrescriptionClient),
	{
		loading: () => (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		),
	},
);

export const metadata: Metadata = generatePageMetadata({
	title: "Prescription & Lab Analysis",
	description:
		"Analyze prescriptions and lab reports in one place with AI-powered medicine explanations, marker classification, and risk insights.",
	path: "/prescription",
	keywords: [
		"prescription and lab analysis",
		"medicine analysis",
		"prescription reader",
		"lab report analysis",
		"blood test interpretation",
		"medication details",
		"AI prescription",
	],
});

export default function PrescriptionPage() {
	return <PrescriptionClient />;
}

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
	title: "Prescription Explainer",
	description:
		"Upload your prescription images and get a clear, detailed explanation of your medicines, dosages, and instructions powered by AI.",
	path: "/prescription",
	keywords: [
		"prescription explainer",
		"medicine analysis",
		"prescription reader",
		"medication details",
		"AI prescription",
	],
});

export default function PrescriptionPage() {
	return <PrescriptionClient />;
}

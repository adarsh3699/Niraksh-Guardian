import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const DiseaseClient = dynamic(() => import("./DiseaseClient").then((m) => m.DiseaseClient), {
	loading: () => (
		<div className="flex min-h-[60vh] items-center justify-center">
			<Spinner size="lg" className="text-primary" />
		</div>
	),
});

export const metadata: Metadata = generatePageMetadata({
	title: "Disease Information",
	description:
		"Learn about diseases and health conditions — symptoms, causes, prevention, treatment, and when to see a doctor.",
	path: "/disease",
	keywords: [
		"disease information",
		"health conditions",
		"symptoms",
		"treatment",
		"prevention",
		"Niraksh Guardian",
	],
});

export default function DiseasePage() {
	return <DiseaseClient />;
}

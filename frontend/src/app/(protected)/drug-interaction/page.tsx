import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const DrugInteractionClient = dynamic(
	() => import("./DrugInteractionClient").then((m) => m.DrugInteractionClient),
	{
		loading: () => (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		),
	},
);

export const metadata: Metadata = generatePageMetadata({
	title: "Drug Interaction Checker",
	description:
		"Check potential interactions between multiple drugs. Enter medicine names to get AI-powered analysis of possible drug-drug interactions.",
	path: "/drug-interaction",
	keywords: [
		"drug interaction",
		"medicine interaction",
		"drug safety",
		"medication checker",
		"drug-drug interaction",
	],
});

export default function DrugInteractionPage() {
	return <DrugInteractionClient />;
}

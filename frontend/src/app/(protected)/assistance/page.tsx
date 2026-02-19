import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const AssistanceClient = dynamic(
	() => import("./AssistanceClient").then((m) => m.AssistanceClient),
	{
		loading: () => (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		),
	},
);

export const metadata: Metadata = generatePageMetadata({
	title: "AI Health Assistant",
	description:
		"Chat with our AI health assistant. Describe your symptoms, upload images, and get health guidance in 11 languages.",
	path: "/assistance",
	keywords: ["AI health chat", "symptom checker chat", "health assistant", "medical AI chatbot"],
});

export default function AssistancePage() {
	return <AssistanceClient />;
}

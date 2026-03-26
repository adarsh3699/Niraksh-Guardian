import { Suspense } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const AssistanceClient = dynamic(() =>
	import("./AssistanceClient").then((m) => m.AssistanceClient),
);

export const metadata: Metadata = generatePageMetadata({
	title: "Niraksh AI",
	description:
		"Chat with Niraksh AI. Describe your symptoms, upload images, and get health guidance in 11 languages.",
	path: "/niraksh-ai",
	keywords: ["Niraksh AI", "AI health chat", "symptom checker chat", "health assistant", "medical AI chatbot"],
});

export default function NirakshAIPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[60vh] items-center justify-center">
					<Spinner size="lg" className="text-primary" />
				</div>
			}
		>
			<AssistanceClient />
		</Suspense>
	);
}

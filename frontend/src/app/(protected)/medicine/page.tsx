import { Suspense } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";

const MedicineClient = dynamic(() => import("./MedicineClient").then((m) => m.MedicineClient));

export const metadata: Metadata = generatePageMetadata({
	title: "Medicine Search",
	description:
		"Search for any medicine by name or image and get detailed AI-powered information about composition, uses, side effects, and dosage.",
	path: "/medicine",
	keywords: [
		"medicine search",
		"drug information",
		"medicine details",
		"side effects",
		"AI medicine lookup",
	],
});

export default function MedicinePage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[60vh] items-center justify-center">
					<Spinner size="lg" className="text-primary" />
				</div>
			}
		>
			<MedicineClient />
		</Suspense>
	);
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { Spinner } from "@/components/ui/Spinner";
import { BookAppointmentClient } from "./BookAppointmentClient";

export const metadata: Metadata = generatePageMetadata({
	title: "Book Appointment",
	description: "Choose a verified doctor, available slot, and consultation mode.",
	path: "/appointments/book",
	noIndex: true,
});

export default function BookAppointmentPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[60vh] items-center justify-center">
					<Spinner size="lg" className="text-primary" />
				</div>
			}
		>
			<BookAppointmentClient />
		</Suspense>
	);
}

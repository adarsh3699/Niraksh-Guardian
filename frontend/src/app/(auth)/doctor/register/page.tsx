import type { Metadata } from "next";
import { DoctorSignupForm } from "@/components/auth/DoctorSignupForm";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
	title: "Doctor Application",
	description: "Apply to join the Niraksh Guardian doctor network.",
	path: "/doctor/register",
	noIndex: true,
});

export default function DoctorRegisterPage() {
	return <DoctorSignupForm />;
}

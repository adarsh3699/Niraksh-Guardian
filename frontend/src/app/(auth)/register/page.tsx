import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { Spinner } from "@/components/ui/Spinner";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
	title: "Sign Up",
	description:
		"Create your free Niraksh Guardian account for AI-powered symptom analysis, doctor suggestions, and health tools.",
	path: "/register",
	noIndex: true,
});

export default function RegisterPage() {
	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-10">
					<Spinner size="md" className="text-primary" />
				</div>
			}
		>
			<SignupForm />
		</Suspense>
	);
}

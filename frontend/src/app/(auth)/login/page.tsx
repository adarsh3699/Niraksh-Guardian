import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Spinner } from "@/components/ui/Spinner";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
	title: "Login",
	description:
		"Log in to your Niraksh Guardian account to access AI health tools and doctor suggestions.",
	path: "/login",
	noIndex: true,
});

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-10">
					<Spinner size="md" className="text-primary" />
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	);
}

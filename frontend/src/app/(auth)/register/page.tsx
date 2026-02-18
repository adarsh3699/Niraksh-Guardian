import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { Spinner } from "@/components/ui/Spinner";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sign Up — Niraksh Guardian",
	description: "Create your Niraksh Guardian account.",
};

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

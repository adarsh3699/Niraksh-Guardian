import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Spinner } from "@/components/ui/Spinner";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Login — Niraksh Guardian",
	description: "Log in to your Niraksh Guardian account.",
};

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

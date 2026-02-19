import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Spinner } from "@/components/ui/Spinner";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
	title: "Reset Password",
	description: "Set a new password for your Niraksh Guardian account.",
	path: "/reset-password",
	noIndex: true,
});

export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-10">
					<Spinner size="md" className="text-primary" />
				</div>
			}
		>
			<ResetPasswordForm />
		</Suspense>
	);
}

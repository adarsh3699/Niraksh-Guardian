import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
	title: "Forgot Password",
	description:
		"Reset your Niraksh Guardian account password. Enter your email to receive a password reset link.",
	path: "/forgot-password",
	noIndex: true,
});

export default function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}

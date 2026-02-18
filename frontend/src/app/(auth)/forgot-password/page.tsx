import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Forgot Password — Niraksh Guardian",
	description: "Reset your Niraksh Guardian account password.",
};

export default function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}

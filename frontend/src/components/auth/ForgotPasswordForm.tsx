"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useToast } from "@/contexts/ToastProvider";
import { AuthIllustrationPanel } from "@/components/auth/AuthIllustrationPanel";
import { Spinner } from "@/components/ui/Spinner";
import type { MessageResponse } from "@/types/api";

export function ForgotPasswordForm() {
	const { addToast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
	});

	const onSubmit = async (formData: ForgotPasswordFormData) => {
		setIsLoading(true);
		try {
			await apiClient<MessageResponse>(API_ROUTES.FORGOT_PASSWORD, {
				method: "POST",
				body: formData,
				noAuth: true,
			});
			setSubmitted(true);
		} catch {
			// Backend returns 200 for all emails, but handle edge case
			setSubmitted(true);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<AuthIllustrationPanel
				heading="Secure AI Health Assistance"
				subtitle="Your medical data is encrypted and protected with industry-leading security protocols."
			/>

			<div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white via-[#f8fbfb] to-[#f0f5f5] p-6 sm:p-12">
				{/* Decorative background mesh */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(68,142,148,0.08),transparent_50%),radial-gradient(ellipse_at_20%_100%,rgba(92,179,167,0.06),transparent_50%)]" />
					<div className="absolute -right-20 top-1/4 size-72 rounded-full bg-primary/[0.03] blur-[80px]" />
					<div className="absolute -left-16 bottom-1/3 size-56 rounded-full bg-primary-light/[0.04] blur-[60px]" />
				</div>

				<div className="relative z-10 w-full max-w-md">
					{/* Mobile branding */}
					<div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
						<Image
							src="/brandLogo.png"
							alt="Niraksh Guardian Logo"
							width={40}
							height={40}
							className="size-10"
						/>
						<span className="font-heading text-2xl font-bold text-foreground">Niraksh</span>
					</div>

					{/* Card */}
					<div className="auth-card rounded-2xl p-8 sm:p-10">
						{!submitted ? (
							<div className="space-y-8">
								{/* Header */}
								<div>
									<h2 className="font-heading text-3xl font-bold text-foreground">
										Forgot password?
									</h2>
									<p className="mt-2 text-muted">
										No worries! Enter your email and we&apos;ll send you a reset link.
									</p>
								</div>

								{/* Form */}
								<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
									<div className="space-y-2">
										<label className="block text-sm font-medium text-foreground">
											Email address
										</label>
										<div className="relative">
											<input
												type="email"
												placeholder="name@company.com"
												autoComplete="email"
												disabled={isLoading}
												className="auth-input"
												{...register("email")}
											/>
											<Mail className="pointer-events-none absolute right-3 top-3.5 size-5 text-muted/40" />
										</div>
										{errors.email && (
											<p className="text-xs text-destructive">{errors.email.message}</p>
										)}
									</div>

									{/* Submit */}
									<button
										type="submit"
										disabled={isLoading}
										className="btn-gradient group flex h-12 w-full items-center justify-center gap-2 rounded-lg font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
									>
										{isLoading ? (
											<>
												<Spinner size="sm" />
												<span>Sending...</span>
											</>
										) : (
											<>
												Send Reset Link
												<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
											</>
										)}
									</button>
								</form>

								{/* Back link */}
								<div className="text-center">
									<Link
										href="/login"
										className="group inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary"
									>
										<ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
										Back to login
									</Link>
								</div>
							</div>
						) : (
							/* ---- Success state ---- */
							<div className="space-y-6 text-center">
								{/* Success icon */}
								<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary-light/10">
									<CheckCircle className="size-8 text-primary" />
								</div>

								<div>
									<h2 className="font-heading text-2xl font-bold text-foreground">
										Check your email
									</h2>
									<p className="mt-3 text-sm leading-relaxed text-muted">
										We&apos;ve sent a password reset link to your email address. Please check your
										inbox and follow the instructions.
									</p>
								</div>

								{/* Retry */}
								<div className="rounded-lg border border-border/60 bg-background/40 p-4">
									<p className="text-sm text-muted">
										Didn&apos;t receive the email?{" "}
										<button
											onClick={() => {
												setSubmitted(false);
												addToast("info", "You can try again with a different email");
											}}
											className="font-semibold text-primary transition-colors hover:underline"
										>
											Try again
										</button>
									</p>
								</div>

								{/* Back link */}
								<Link
									href="/login"
									className="group inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary"
								>
									<ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
									Back to login
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}

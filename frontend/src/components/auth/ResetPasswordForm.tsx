"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShieldAlert, ArrowRight, ArrowLeft } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useToast } from "@/contexts/ToastProvider";
import { AuthIllustrationPanel } from "@/components/auth/AuthIllustrationPanel";
import { Spinner } from "@/components/ui/Spinner";
import type { MessageResponse } from "@/types/api";

/** Simple password strength calculator (0-4) */
function getPasswordStrength(password: string): { score: number; label: string } {
	if (!password) return { score: 0, label: "" };
	let score = 0;
	if (password.length >= 8) score++;
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
	if (/\d/.test(password)) score++;
	if (/[^a-zA-Z0-9]/.test(password)) score++;

	const labels = ["Weak", "Fair", "Good", "Strong"];
	return { score, label: labels[Math.max(0, score - 1)] || "Weak" };
}

const strengthColors = ["bg-destructive", "bg-warning", "bg-success/60", "bg-success"];

export function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") || "";

	const { addToast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { token },
	});

	const passwordValue = watch("password", "");
	const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

	const onSubmit = async (formData: ResetPasswordFormData) => {
		setIsLoading(true);
		try {
			const data = await apiClient<MessageResponse>(API_ROUTES.RESET_PASSWORD, {
				method: "POST",
				body: { token: formData.token, password: formData.password },
				noAuth: true,
			});
			addToast("success", data.message || "Password reset successful");
			router.push("/login");
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Reset failed. Token may be expired.");
		} finally {
			setIsLoading(false);
		}
	};

	/* ---- Invalid / missing token state ---- */
	if (!token) {
		return (
			<>
				<AuthIllustrationPanel
					heading="Your AI Health Sentinel"
					subtitle="Securely managing your health data with advanced artificial intelligence and encryption protocols."
				/>

				<div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white via-[#f8fbfb] to-[#f0f5f5] p-6 sm:p-12">
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

						<div className="auth-card rounded-2xl p-8 sm:p-10 text-center">
							{/* Error icon */}
							<div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
								<ShieldAlert className="size-8 text-destructive" />
							</div>

							<h2 className="mb-3 font-heading text-2xl font-bold text-foreground">
								Invalid Reset Link
							</h2>
							<p className="mb-8 text-sm leading-relaxed text-muted">
								This password reset link has expired or has already been used. Please request a new
								one.
							</p>

							<div className="flex flex-col gap-4">
								<Link
									href="/forgot-password"
									className="btn-gradient flex h-12 items-center justify-center rounded-lg font-bold text-white transition-all active:scale-[0.98]"
								>
									Request New Link
								</Link>
								<Link
									href="/login"
									className="group inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary"
								>
									<ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
									Back to login
								</Link>
							</div>
						</div>
					</div>
				</div>
			</>
		);
	}

	/* ---- Normal reset form ---- */
	return (
		<>
			<AuthIllustrationPanel
				heading="Secure Your Health Data"
				subtitle="Your AI-powered health assistant ensures your medical records are encrypted and accessible only by you."
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
						<div className="space-y-8">
							{/* Header */}
							<div>
								<h2 className="font-heading text-3xl font-bold text-foreground">Reset Password</h2>
								<p className="mt-2 text-muted">
									Enter a strong password to secure your health records.
								</p>
							</div>

							<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
								{/* Hidden token */}
								<input type="hidden" {...register("token")} />

								{/* New Password */}
								<div className="space-y-2">
									<label className="block text-sm font-medium text-foreground">New Password</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											placeholder="••••••••"
											autoComplete="new-password"
											disabled={isLoading}
											className="auth-input pr-12"
											{...register("password")}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
										>
											{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
										</button>
									</div>
									{errors.password && (
										<p className="text-xs text-destructive">{errors.password.message}</p>
									)}
								</div>

								{/* Password Strength Meter */}
								{passwordValue && (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-xs font-medium text-muted">Strength</span>
											<span className="text-xs font-bold text-primary">{strength.label}</span>
										</div>
										<div className="flex gap-1.5">
											{[0, 1, 2, 3].map((i) => (
												<div
													key={i}
													className={`h-1.5 flex-1 rounded-full transition-colors ${
														i < strength.score ? strengthColors[strength.score - 1] : "bg-border"
													}`}
												/>
											))}
										</div>
										<p className="text-[11px] text-muted">
											Use 8+ characters with a mix of letters, numbers &amp; symbols.
										</p>
									</div>
								)}

								{/* Confirm Password */}
								<div className="space-y-2">
									<label className="block text-sm font-medium text-foreground">
										Confirm Password
									</label>
									<div className="relative">
										<input
											type={showConfirmPassword ? "text" : "password"}
											placeholder="••••••••"
											autoComplete="new-password"
											disabled={isLoading}
											className="auth-input pr-12"
											{...register("confirmPassword")}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
										>
											{showConfirmPassword ? (
												<EyeOff className="size-5" />
											) : (
												<Eye className="size-5" />
											)}
										</button>
									</div>
									{errors.confirmPassword && (
										<p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
											<span>Resetting...</span>
										</>
									) : (
										<>
											Reset Password
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
					</div>
				</div>
			</div>
		</>
	);
}

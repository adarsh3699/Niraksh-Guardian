"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import { signupSchema, type SignupFormData } from "@/lib/validations";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import { AuthIllustrationPanel } from "@/components/auth/AuthIllustrationPanel";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Spinner } from "@/components/ui/Spinner";
import type { AuthResponse } from "@/types/auth";

export function SignupForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const returnUrl = searchParams.get("returnUrl") || "/dashboard";

	const { login } = useAuth();
	const { addToast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
	});

	const onSubmit = async (formData: SignupFormData) => {
		setIsLoading(true);
		try {
			const data = await apiClient<AuthResponse>(API_ROUTES.SIGNUP, {
				method: "POST",
				body: {
					name: formData.name,
					email: formData.email,
					password: formData.password,
					gender: formData.gender,
				},
				noAuth: true,
			});
			login(data.tokens, data.user);
			addToast("success", "Account created successfully");
			router.push(returnUrl);
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Signup failed");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSuccess = () => {
		router.push(returnUrl);
	};

	return (
		<>
			<AuthIllustrationPanel
				heading={
					<>
						Smarter health starts <br /> here
					</>
				}
				subtitle="Join thousands of users managing their health with AI-powered diagnostics and personalized insights."
				socialProof
			/>

			<div className="relative flex flex-1 flex-col items-center overflow-y-auto bg-gradient-to-br from-white via-[#f8fbfb] to-[#f0f5f5]">
				{/* Decorative background mesh */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(68,142,148,0.08),transparent_50%),radial-gradient(ellipse_at_20%_100%,rgba(92,179,167,0.06),transparent_50%)]" />
					<div className="absolute -right-20 top-1/4 size-72 rounded-full bg-primary/[0.03] blur-[80px]" />
					<div className="absolute -left-16 bottom-1/3 size-56 rounded-full bg-primary-light/[0.04] blur-[60px]" />
				</div>

				{/* Scroll-safe centering wrapper */}
				<div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6 py-10 lg:px-12">
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

					{/* No card — content sits directly on background like SkillSage */}
					<div className="flex w-full max-w-md flex-col gap-7">
						{/* Header */}
						<div>
							<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
								Create your account
							</h2>
							<p className="mt-2 text-muted">Start your health journey with Niraksh Guardian.</p>
						</div>

						{/* Google first */}
						<GoogleAuthButton onSuccess={handleGoogleSuccess} />

						{/* Divider */}
						<div className="relative flex items-center">
							<div className="flex-grow border-t border-border/60" />
							<span className="mx-4 flex-shrink-0 text-xs font-medium uppercase tracking-widest text-muted/70">
								or continue with
							</span>
							<div className="flex-grow border-t border-border/60" />
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
							{/* Full Name */}
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-foreground">Full Name</label>
								<div className="relative">
									<input
										type="text"
										placeholder="e.g. Alex Sterling"
										autoComplete="name"
										disabled={isLoading}
										className="auth-input"
										{...register("name")}
									/>
									<User className="pointer-events-none absolute right-3 top-3.5 size-5 text-muted/40" />
								</div>
								{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
							</div>

							{/* Email */}
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-foreground">Email</label>
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
								{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
							</div>

							{/* Gender */}
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-foreground">Gender</label>
								<div className="flex gap-3">
									{(["Male", "Female", "Other"] as const).map((g) => (
										<label key={g} className="flex-1 cursor-pointer">
											<input
												type="radio"
												value={g}
												disabled={isLoading}
												className="peer hidden"
												{...register("gender")}
											/>
											<div className="flex items-center justify-center rounded-lg border border-border py-2.5 text-sm font-medium text-muted transition-all hover:border-primary/40 peer-checked:border-primary peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-primary-light peer-checked:text-white peer-checked:shadow-md peer-checked:shadow-primary/20">
												{g}
											</div>
										</label>
									))}
								</div>
							</div>

							{/* Password */}
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-foreground">Password</label>
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

							{/* Confirm Password */}
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-foreground">Confirm Password</label>
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
								className="btn-gradient group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
							>
								{isLoading ? (
									<>
										<Spinner size="sm" />
										<span>Creating account...</span>
									</>
								) : (
									<>
										Create Account
										<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
									</>
								)}
							</button>

							{/* Terms */}
							<p className="mt-1 text-center text-xs text-muted">
								By creating an account, you agree to our{" "}
								<span className="cursor-pointer text-primary hover:underline">
									Terms of Service
								</span>{" "}
								and{" "}
								<span className="cursor-pointer text-primary hover:underline">Privacy Policy</span>.
							</p>
						</form>

						{/* Sign In link */}
						<p className="text-center text-sm text-muted">
							Already have an account?{" "}
							<Link
								href="/login"
								className="font-bold text-primary transition-colors hover:underline"
							>
								Log in
							</Link>
						</p>
						<p className="text-center text-sm text-muted">
							Are you a doctor?{" "}
							<Link href="/doctor/register" className="font-bold text-primary hover:underline">
								Apply as a doctor
							</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	);
}

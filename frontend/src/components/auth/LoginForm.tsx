"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import { AuthIllustrationPanel } from "@/components/auth/AuthIllustrationPanel";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Spinner } from "@/components/ui/Spinner";
import type { AuthResponse } from "@/types/auth";

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const requestedReturnUrl = searchParams.get("returnUrl");
	const returnUrl =
		requestedReturnUrl?.startsWith("/") && !requestedReturnUrl.startsWith("//")
			? requestedReturnUrl
			: "/dashboard";
	const redirectMessage = searchParams.get("message");

	const { login } = useAuth();
	const { addToast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (formData: LoginFormData) => {
		setIsLoading(true);
		try {
			const data = await apiClient<AuthResponse>(API_ROUTES.LOGIN, {
				method: "POST",
				body: formData,
				noAuth: true,
			});
			login(data.tokens, data.user);
			addToast("success", "Logged in successfully");
			const defaultDestination =
				data.user.role === "DOCTOR"
					? "/doctor/dashboard"
					: data.user.role === "ADMIN"
						? "/admin/doctor-applications"
						: "/dashboard";
			router.push(returnUrl === "/dashboard" ? defaultDestination : returnUrl);
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Login failed");
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
				heading="Your AI Health Guardian"
				subtitle="Experience the future of personal healthcare with professional tools at your fingertips."
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

					{/* Form card */}
					<div className="auth-card rounded-2xl p-8 sm:p-10">
						<div className="space-y-8">
							{/* Header */}
							<div>
								<h2 className="font-heading text-3xl font-bold text-foreground">Welcome back</h2>
								<p className="mt-2 text-muted">
									Enter your credentials to access your health dashboard.
								</p>
							</div>

							{/* Redirect info */}
							{redirectMessage && (
								<div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3 text-sm text-info">
									{redirectMessage}
								</div>
							)}

							{/* Form */}
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
								{/* Email */}
								<div className="space-y-2">
									<label className="block text-sm font-medium text-foreground">Email address</label>
									<input
										type="email"
										placeholder="name@company.com"
										autoComplete="email"
										disabled={isLoading}
										className="auth-input"
										{...register("email")}
									/>
									{errors.email && (
										<p className="text-xs text-destructive">{errors.email.message}</p>
									)}
								</div>

								{/* Password */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<label className="block text-sm font-medium text-foreground">Password</label>
										<Link
											href="/forgot-password"
											className="text-xs font-semibold text-primary transition-colors hover:text-primary-light"
										>
											Forgot password?
										</Link>
									</div>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											placeholder="••••••••"
											autoComplete="current-password"
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

								{/* Submit */}
								<button
									type="submit"
									disabled={isLoading}
									className="btn-gradient flex h-12 w-full items-center justify-center gap-2 rounded-lg font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
								>
									{isLoading ? (
										<>
											<Spinner size="sm" />
											<span>Signing in...</span>
										</>
									) : (
										"Login"
									)}
								</button>
							</form>

							{/* Divider */}
							<div className="relative flex items-center">
								<div className="flex-grow border-t border-border/60" />
								<span className="mx-4 flex-shrink-0 text-xs font-medium uppercase tracking-widest text-muted/70">
									or continue with
								</span>
								<div className="flex-grow border-t border-border/60" />
							</div>

							{/* Google */}
							<GoogleAuthButton onSuccess={handleGoogleSuccess} />

							{/* Sign up link */}
							<p className="text-center text-sm text-muted">
								Don&apos;t have an account?{" "}
								<Link
									href="/register"
									className="font-bold text-primary transition-colors hover:underline"
								>
									Create one
								</Link>
							</p>
							<p className="text-center text-sm text-muted">
								Are you a doctor?{" "}
								<Link
									href="/doctor/register"
									className="font-bold text-primary transition-colors hover:underline"
								>
									Apply to join Niraksh
								</Link>
							</p>
						</div>
					</div>

					{/* Footer links */}
					<div className="mt-10 flex justify-center gap-6 text-xs text-muted">
						<span className="cursor-pointer transition-colors hover:text-primary">
							Privacy Policy
						</span>
						<span className="cursor-pointer transition-colors hover:text-primary">
							Terms of Service
						</span>
						<span className="cursor-pointer transition-colors hover:text-primary">Help Center</span>
					</div>
				</div>
			</div>
		</>
	);
}

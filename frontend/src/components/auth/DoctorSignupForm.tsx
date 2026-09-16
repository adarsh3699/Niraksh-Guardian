"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Stethoscope } from "lucide-react";
import { doctorSignupSchema, type DoctorSignupFormData } from "@/lib/validations";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import { AuthIllustrationPanel } from "@/components/auth/AuthIllustrationPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AuthResponse } from "@/types/auth";
import type { ConsultationMode } from "@/types/appointments";

const consultationOptions: Array<{ value: ConsultationMode; label: string }> = [
	{ value: "IN_PERSON", label: "In-person visits" },
	{ value: "VIDEO", label: "Video consultations" },
	{ value: "PHONE", label: "Phone consultations" },
];

export function DoctorSignupForm() {
	const { login } = useAuth();
	const { addToast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<DoctorSignupFormData>({
		resolver: zodResolver(doctorSignupSchema),
		defaultValues: { consultationModes: ["IN_PERSON"] },
	});
	const selectedModes = watch("consultationModes") ?? [];

	const onSubmit = async (formData: DoctorSignupFormData) => {
		setIsLoading(true);
		try {
			const data = await apiClient<AuthResponse & { applicationStatus: string }>(
				API_ROUTES.DOCTOR_SIGNUP,
				{
					method: "POST",
					noAuth: true,
					body: formData,
				},
			);
			login(data.tokens, data.user);
			addToast("success", "Application submitted. You can be listed after admin verification.");
			window.location.assign("/doctor/dashboard");
		} catch (error) {
			addToast(
				"error",
				error instanceof Error ? error.message : "Could not submit doctor application",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<AuthIllustrationPanel
				heading={
					<>
						Make every visit <br />
						smarter and safer
					</>
				}
				subtitle="Bring your clinical expertise together with a patient's complete health context."
			/>
			<div className="flex h-screen flex-1 flex-col overflow-y-auto bg-gradient-to-br from-white via-[#f8fbfb] to-[#f0f5f5] px-6 py-8 sm:px-12 lg:px-16">
				<div className="mx-auto w-full max-w-3xl">
					<div className="mb-8 flex items-center gap-3 lg:hidden">
						<Image src="/brandLogo.png" alt="Niraksh Guardian Logo" width={40} height={40} />
						<span className="font-heading text-2xl font-bold text-foreground">Niraksh</span>
					</div>
					<div className="mb-8">
						<div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Stethoscope className="size-6" />
						</div>
						<h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
							Doctor application
						</h1>
						<p className="mt-2 max-w-2xl text-muted">
							Create your account and submit your professional profile for admin verification.
						</p>
						<div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
							<ShieldCheck className="mt-0.5 size-5 shrink-0" />
							<span>
								Patients can discover and book your profile after an admin verifies your professional
								details. Patient health records are shown only after a confirmed appointment grants
								temporary access.
							</span>
						</div>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<FormSection
							title="Account details"
							description="Use the email you will use for doctor login."
						>
							<div className="grid gap-4 sm:grid-cols-2">
								<Input
									{...register("name")}
									label="Full name"
									error={errors.name?.message}
									placeholder="Dr. Anjali Sharma"
									autoComplete="name"
								/>
								<Input
									{...register("email")}
									type="email"
									label="Email address"
									error={errors.email?.message}
									placeholder="doctor@clinic.com"
									autoComplete="email"
								/>
								<PasswordField
									label="Password"
									registration={register("password")}
									visible={showPassword}
									onToggle={() => setShowPassword((value) => !value)}
									error={errors.password?.message}
								/>
								<PasswordField
									label="Confirm password"
									registration={register("confirmPassword")}
									visible={showConfirmPassword}
									onToggle={() => setShowConfirmPassword((value) => !value)}
									error={errors.confirmPassword?.message}
								/>
							</div>
						</FormSection>

						<FormSection
							title="Professional profile"
							description="These details are reviewed and become your patient-facing profile after approval."
						>
							<div className="grid gap-4 sm:grid-cols-2">
								<Input
									{...register("licenseNumber")}
									label="Medical license number"
									error={errors.licenseNumber?.message}
									placeholder="State medical council number"
								/>
								<Input
									{...register("specialization")}
									label="Specialization"
									error={errors.specialization?.message}
									placeholder="e.g. Endocrinologist"
								/>
								<Input
									{...register("qualification")}
									label="Qualification"
									error={errors.qualification?.message}
									placeholder="MBBS, MD"
								/>
								<Input
									{...register("experienceYears", { valueAsNumber: true })}
									type="number"
									min={0}
									max={70}
									label="Years of experience"
									error={errors.experienceYears?.message}
									placeholder="8"
								/>
								<Input
									{...register("consultationFee", { valueAsNumber: true })}
									type="number"
									min={0}
									label="Consultation fee (₹)"
									error={errors.consultationFee?.message}
									placeholder="800"
								/>
								<Input
									{...register("phone")}
									type="tel"
									label="Phone number"
									error={errors.phone?.message}
									placeholder="+91 98765 43210"
									autoComplete="tel"
								/>
							</div>
							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								<Input
									{...register("city")}
									label="City"
									error={errors.city?.message}
									placeholder="Vadodara"
								/>
								<Input
									{...register("state")}
									label="State"
									error={errors.state?.message}
									placeholder="Gujarat"
								/>
							</div>
							<Field label="Professional bio" error={errors.bio?.message} className="mt-4">
								<textarea
									{...register("bio")}
									rows={4}
									className="min-h-28 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
									placeholder="Tell patients about your clinical focus and experience."
								/>
							</Field>
							<Input
								{...register("contactInfo")}
								label="Contact information"
								error={errors.contactInfo?.message}
								placeholder="Clinic reception or appointment desk details"
								className="mt-4"
							/>
						</FormSection>

						<FormSection
							title="Consultation setup"
							description="You can configure exact weekly slots after approval."
						>
							<div className="grid gap-4 sm:grid-cols-2">
								<Input
									{...register("clinicName")}
									label="Clinic name"
									error={errors.clinicName?.message}
									placeholder="Optional clinic or hospital"
								/>
								<Input
									{...register("clinicAddress")}
									label="Clinic address"
									error={errors.clinicAddress?.message}
									placeholder="Optional full address"
								/>
							</div>
							<div className="mt-4">
								<p className="text-sm font-semibold text-foreground">Consultation modes</p>
								<div className="mt-2 grid gap-2 sm:grid-cols-3">
									{consultationOptions.map((option) => {
										const selected = selectedModes.includes(option.value);
										return (
											<label
												key={option.value}
												className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${selected ? "border-primary bg-primary/5 text-primary" : "border-border text-muted hover:border-primary/40"}`}
											>
												<input
													type="checkbox"
													checked={selected}
													onChange={() =>
														setValue(
															"consultationModes",
															selected
																? selectedModes.filter((mode) => mode !== option.value)
																: [...selectedModes, option.value],
															{ shouldValidate: true },
														)
													}
													className="size-4 accent-primary"
												/>
												{option.label}
											</label>
										);
									})}
								</div>
								{errors.consultationModes && (
									<p className="mt-1 text-xs text-destructive">
										{errors.consultationModes.message}
									</p>
								)}
							</div>
						</FormSection>

						<Button
							type="submit"
							disabled={isLoading}
							loading={isLoading}
							size="lg"
							className="w-full rounded-lg"
						>
							{isLoading ? (
								<span>Submitting application...</span>
							) : (
								<>
									<span>Submit application</span>
									<ArrowRight className="size-4" />
								</>
							)}
						</Button>
						<p className="text-center text-sm text-muted">
							Already have a doctor account?{" "}
							<Link href="/login" className="font-semibold text-primary hover:underline">
								Log in
							</Link>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}

function FormSection({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
			<h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
			<p className="mt-1 text-sm text-muted">{description}</p>
			<div className="mt-5">{children}</div>
		</section>
	);
}

function Field({
	label,
	error,
	className = "",
	children,
}: {
	label: string;
	error?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<label className={`block ${className}`}>
			<span className="text-sm font-semibold text-foreground">{label}</span>
			<div className="mt-1.5">{children}</div>
			{error && <p className="mt-1 text-xs text-destructive">{error}</p>}
		</label>
	);
}

function PasswordField({
	label,
	registration,
	visible,
	onToggle,
	error,
}: {
	label: string;
	registration: UseFormRegisterReturn;
	visible: boolean;
	onToggle: () => void;
	error?: string;
}) {
	return (
		<Field label={label} error={error}>
			<div className="relative">
				<input
					{...registration}
					type={visible ? "text" : "password"}
					className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 pr-11"
					autoComplete="new-password"
				/>
				<button
					type="button"
					onClick={onToggle}
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted hover:text-foreground"
					aria-label={visible ? `Hide ${label}` : `Show ${label}`}
				>
					{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			</div>
		</Field>
	);
}

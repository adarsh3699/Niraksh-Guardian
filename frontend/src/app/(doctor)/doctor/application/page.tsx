"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, ShieldAlert, ShieldCheck } from "lucide-react";
import { useDoctorMe } from "@/hooks/useDoctorPortal";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
	doctorApplicationUpdateSchema,
	type DoctorApplicationUpdateFormData,
} from "@/lib/validations";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastProvider";
import type { ConsultationMode } from "@/types/appointments";

const modes: Array<{ value: ConsultationMode; label: string }> = [
	{ value: "IN_PERSON", label: "In-person" },
	{ value: "VIDEO", label: "Video" },
	{ value: "PHONE", label: "Phone" },
];

export default function DoctorApplicationPage() {
	const { data, isLoading, mutate } = useDoctorMe();
	const { addToast } = useToast();
	const [saving, setSaving] = useState(false);
	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<DoctorApplicationUpdateFormData>({
		resolver: zodResolver(doctorApplicationUpdateSchema),
	});
	const selectedModes = watch("consultationModes") ?? [];

	useEffect(() => {
		const profile = data?.profile;
		if (!profile) return;
		reset({
			name: profile.displayName ?? "",
			licenseNumber: profile.licenseNumber ?? "",
			specialization: profile.specialization ?? "",
			qualification: profile.qualification ?? "",
			experienceYears: profile.experienceYears ?? 0,
			consultationFee: profile.consultationFee ?? 0,
			city: profile.city ?? "",
			state: profile.state ?? "",
			bio: profile.bio ?? "",
			contactInfo: profile.contactInfo ?? "",
			phone: profile.phone ?? "",
			clinicName: profile.clinicName ?? "",
			clinicAddress: profile.clinicAddress ?? "",
			consultationModes: profile.consultationModes,
		});
	}, [data, reset]);

	const save = async (formData: DoctorApplicationUpdateFormData) => {
		setSaving(true);
		try {
			await apiClient(API_ROUTES.DOCTOR_APPLICATION, { method: "PATCH", body: formData });
			await mutate();
			addToast("success", "Application resubmitted for verification");
		} catch (error) {
			addToast("error", error instanceof Error ? error.message : "Could not update application");
		} finally {
			setSaving(false);
		}
	};

	if (isLoading)
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	const profile = data?.profile;
	if (!profile)
		return <div className="p-8 text-center text-sm text-muted">Doctor profile not found.</div>;
	const approved = profile.verificationStatus === "APPROVED";

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<div>
				<p className="text-sm font-semibold text-primary">Doctor onboarding</p>
				<h1 className="font-heading text-2xl font-bold text-foreground">
					Professional application
				</h1>
				<p className="mt-1 text-sm text-muted">
					Keep your professional details accurate so patients know who they are booking.
				</p>
			</div>
			<div
				className={`flex items-start gap-3 rounded-xl p-4 text-sm ${approved ? "bg-green-50 text-green-800" : profile.verificationStatus === "REJECTED" ? "bg-amber-50 text-amber-900" : "bg-primary/5 text-primary"}`}
			>
				{approved ? (
					<ShieldCheck className="mt-0.5 size-5 shrink-0" />
				) : (
					<ShieldAlert className="mt-0.5 size-5 shrink-0" />
				)}
				<div>
					<p className="font-semibold">Status: {profile.verificationStatus}</p>
					<p className="mt-1">
						{profile.verificationNote ??
							(approved
								? "Your approved profile is visible to patients."
								: "Our team will verify your license and professional details before listing you.")}
					</p>
				</div>
			</div>
			<form onSubmit={handleSubmit(save)} className="space-y-6">
				<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
					<h2 className="font-heading text-lg font-bold text-foreground">Professional details</h2>
					<div className="mt-5 grid gap-4 sm:grid-cols-2">
						<Field label="Full name" error={errors.name?.message}>
							<input {...register("name")} disabled={approved} className="auth-input" />
						</Field>
						<Field label="License number" error={errors.licenseNumber?.message}>
							<input {...register("licenseNumber")} disabled={approved} className="auth-input" />
						</Field>
						<Field label="Specialization" error={errors.specialization?.message}>
							<input {...register("specialization")} disabled={approved} className="auth-input" />
						</Field>
						<Field label="Qualification" error={errors.qualification?.message}>
							<input {...register("qualification")} disabled={approved} className="auth-input" />
						</Field>
						<Field label="Years of experience" error={errors.experienceYears?.message}>
							<input
								{...register("experienceYears", { valueAsNumber: true })}
								type="number"
								disabled={approved}
								className="auth-input"
							/>
						</Field>
						<Field label="Consultation fee (₹)" error={errors.consultationFee?.message}>
							<input
								{...register("consultationFee", { valueAsNumber: true })}
								type="number"
								disabled={approved}
								className="auth-input"
							/>
						</Field>
						<Field label="City" error={errors.city?.message}>
							<input {...register("city")} disabled={approved} className="auth-input" />
						</Field>
						<Field label="State" error={errors.state?.message}>
							<input {...register("state")} disabled={approved} className="auth-input" />
						</Field>
					</div>
					<Field label="Phone" error={errors.phone?.message} className="mt-4">
						<input {...register("phone")} disabled={approved} className="auth-input" />
					</Field>
					<Field label="Contact information" error={errors.contactInfo?.message} className="mt-4">
						<input {...register("contactInfo")} disabled={approved} className="auth-input" />
					</Field>
					<Field label="Professional bio" error={errors.bio?.message} className="mt-4">
						<textarea
							{...register("bio")}
							disabled={approved}
							rows={4}
							className="auth-input resize-y"
						/>
					</Field>
				</section>
				<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
					<h2 className="font-heading text-lg font-bold text-foreground">Consultation setup</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<Field label="Clinic name" error={errors.clinicName?.message}>
							<input {...register("clinicName")} disabled={approved} className="auth-input" />
						</Field>
						<Field label="Clinic address" error={errors.clinicAddress?.message}>
							<input {...register("clinicAddress")} disabled={approved} className="auth-input" />
						</Field>
					</div>
					<p className="mt-4 text-sm font-semibold text-foreground">Consultation modes</p>
					<div className="mt-2 grid gap-2 sm:grid-cols-3">
						{modes.map((mode) => {
							const selected = selectedModes.includes(mode.value);
							return (
								<label
									key={mode.value}
									className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${selected ? "border-primary bg-primary/5 text-primary" : "border-border text-muted"}`}
								>
									<input
										type="checkbox"
										checked={selected}
										disabled={approved}
										onChange={() =>
											setValue(
												"consultationModes",
												selected
													? selectedModes.filter((value) => value !== mode.value)
													: [...selectedModes, mode.value],
												{ shouldValidate: true },
											)
										}
										className="size-4 accent-primary"
									/>
									{mode.label}
								</label>
							);
						})}
					</div>
					{errors.consultationModes && (
						<p className="mt-1 text-xs text-destructive">{errors.consultationModes.message}</p>
					)}
				</section>
				{!approved && (
					<button
						type="submit"
						disabled={saving}
						className="btn-gradient flex h-12 w-full items-center justify-center gap-2 rounded-lg font-bold text-white disabled:opacity-60"
					>
						{saving ? <Spinner size="sm" /> : <Save className="size-4" />} Save and resubmit
					</button>
				)}
			</form>
		</div>
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

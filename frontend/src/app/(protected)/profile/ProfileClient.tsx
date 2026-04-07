"use client";

import { useState, useCallback, useEffect, KeyboardEvent } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Heart, MapPin, AlertCircle, X } from "lucide-react";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useToast } from "@/contexts/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useIndiaStates, useStateCities } from "@/hooks/useLocationData";
import { cn } from "@/lib/utils";
import type { ProfileResponse } from "@/types/health";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"] as const;
const LANGUAGES = [
	{ value: "en", label: "English" },
	{ value: "hi", label: "Hindi" },
	{ value: "bn", label: "Bengali" },
	{ value: "te", label: "Telugu" },
	{ value: "mr", label: "Marathi" },
	{ value: "ta", label: "Tamil" },
	{ value: "ur", label: "Urdu" },
	{ value: "gu", label: "Gujarati" },
	{ value: "kn", label: "Kannada" },
	{ value: "ml", label: "Malayalam" },
	{ value: "pa", label: "Punjabi" },
];

/* ------------------------------------------------------------------ */
/*  TagInput — reusable chip-based multi-value input                  */
/* ------------------------------------------------------------------ */

interface TagInputProps {
	value: string[];
	onChange: (v: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
}

function TagInput({
	value,
	onChange,
	placeholder = "Type and press Enter",
	disabled,
}: TagInputProps) {
	const [draft, setDraft] = useState("");

	const add = useCallback(() => {
		const trimmed = draft.trim();
		if (trimmed && !value.includes(trimmed)) {
			onChange([...value, trimmed]);
		}
		setDraft("");
	}, [draft, value, onChange]);

	const remove = useCallback(
		(tag: string) => onChange(value.filter((t) => t !== tag)),
		[value, onChange],
	);

	const handleKey = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				add();
			} else if (e.key === "Backspace" && draft === "" && value.length > 0) {
				onChange(value.slice(0, -1));
			}
		},
		[add, draft, value, onChange],
	);

	return (
		<div
			className={cn(
				"flex min-h-10 flex-wrap gap-1.5 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
				disabled && "pointer-events-none opacity-60",
			)}
		>
			{value.map((tag) => (
				<span
					key={tag}
					className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
				>
					{tag}
					<button type="button" onClick={() => remove(tag)} className="hover:text-primary/60">
						<X className="size-3" />
					</button>
				</span>
			))}
			<input
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={handleKey}
				onBlur={add}
				placeholder={value.length === 0 ? placeholder : ""}
				className="min-w-24 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
				disabled={disabled}
			/>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                   */
/* ------------------------------------------------------------------ */

function Section({
	icon: Icon,
	title,
	children,
}: {
	icon: React.ElementType;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
			<div className="mb-4 flex items-center gap-2.5">
				<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
					<Icon className="size-4 text-primary" />
				</div>
				<h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
			</div>
			{children}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Health Risk Score gauge                                           */
/* ------------------------------------------------------------------ */

function RiskScoreGauge({ score }: { score: number }) {
	const color =
		score <= 20
			? "bg-green-500"
			: score <= 50
				? "bg-yellow-500"
				: score <= 80
					? "bg-orange-500"
					: "bg-red-500";
	const label = score <= 20 ? "Low" : score <= 50 ? "Moderate" : score <= 80 ? "High" : "Critical";

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium text-foreground">Health Risk Score</span>
				<span className="font-bold text-foreground">
					{score}/100 — <span className="text-primary">{label}</span>
				</span>
			</div>
			<div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
				<div
					className={cn("h-full rounded-full transition-all duration-700", color)}
					style={{ width: `${score}%` }}
				/>
			</div>
			<p className="text-xs text-muted">
				Auto-calculated from chronic conditions (10 pts each, max 100).
			</p>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  ProfileClient                                                     */
/* ------------------------------------------------------------------ */

export function ProfileClient() {
	const { addToast } = useToast();
	const [isSaving, setIsSaving] = useState(false);

	// Location data from Country State City API
	const { states, nameToIso2, loading: statesLoading } = useIndiaStates();
	const [stateIso2, setStateIso2] = useState<string | undefined>();
	const { cities, loading: citiesLoading } = useStateCities(stateIso2);

	const { data: profileData, isLoading } = useSWR<ProfileResponse>(API_ROUTES.PROFILE, swrFetcher, {
		revalidateOnFocus: false,
	});

	const {
		register,
		handleSubmit,
		reset,
		control,
		setValue,
		formState: { errors, isDirty },
	} = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			allergies: [],
			chronicConditions: [],
		},
	});

	// Populate form when profile data arrives
	useEffect(() => {
		if (!profileData) return;
		const { user, healthProfile } = profileData;
		const savedState = healthProfile?.state ?? "";
		reset({
			name: user.name ?? "",
			gender: (user.gender as "Male" | "Female" | "Other") ?? undefined,
			languagePreference: user.languagePreference ?? "en",
			bloodGroup: healthProfile?.bloodGroup ?? "",
			allergies: healthProfile?.allergies ?? [],
			chronicConditions: healthProfile?.chronicConditions ?? [],
			emergencyContactName: healthProfile?.emergencyContactName ?? "",
			emergencyContactPhone: healthProfile?.emergencyContactPhone ?? "",
			emergencyContactEmail: healthProfile?.emergencyContactEmail ?? "",
			city: healthProfile?.city ?? "",
			state: savedState,
		});
		// Restore state ISO2 for city dropdown
		if (savedState && nameToIso2[savedState]) {
			setStateIso2(nameToIso2[savedState]);
		}
	}, [profileData, reset, nameToIso2]);

	const onSubmit = async (formData: ProfileFormData) => {
		setIsSaving(true);
		try {
			await apiClient(API_ROUTES.PROFILE, {
				method: "PUT",
				body: formData,
			});
			await globalMutate(API_ROUTES.PROFILE);
			addToast("success", "Profile updated successfully");
		} catch (err) {
			addToast("error", err instanceof Error ? err.message : "Failed to update profile");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	}

	const healthRiskScore = profileData?.healthProfile?.healthRiskScore ?? 0;

	return (
		<div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			{/* Page header */}
			<div className="flex items-center gap-3">
				<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
					<User className="size-5 text-primary" />
				</div>
				<div>
					<h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">My Profile</h1>
					<p className="text-sm text-muted">
						{profileData?.user.email ?? "Manage your health information"}
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				{/* Personal Info */}
				<Section icon={User} title="Personal Information">
					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							label="Full Name"
							placeholder="Your name"
							{...register("name")}
							error={errors.name?.message}
						/>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">Gender</label>
							<select
								{...register("gender")}
								className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							>
								<option value="">Select gender</option>
								{GENDERS.map((g) => (
									<option key={g} value={g}>
										{g}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								Language Preference
							</label>
							<select
								{...register("languagePreference")}
								className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							>
								{LANGUAGES.map((l) => (
									<option key={l.value} value={l.value}>
										{l.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</Section>

				{/* Location — IMPORTANT for doctor recommendation */}
				<Section icon={MapPin} title="Your Location">
					<p className="mb-3 text-sm text-muted">
						Used to prioritise doctors near you in recommendations. City match boosts ranking by 50
						points and state match by 20 points.
					</p>
					<div className="grid gap-4 sm:grid-cols-2">
						{/* State — drives city dropdown */}
						<Controller
							name="state"
							control={control}
							render={({ field }) => (
								<SearchableSelect
									label="State"
									placeholder="Select state…"
									options={states}
									loading={statesLoading}
									value={field.value ?? ""}
									onChange={(stateName) => {
										field.onChange(stateName);
										// Look up ISO2 to load cities
										setStateIso2(nameToIso2[stateName]);
										// Reset city when state changes
										setValue("city", "", { shouldDirty: true });
									}}
									onBlur={field.onBlur}
									error={errors.state?.message}
								/>
							)}
						/>

						{/* City — depends on selected state */}
						<Controller
							name="city"
							control={control}
							render={({ field }) => (
								<SearchableSelect
									label="City"
									placeholder={stateIso2 ? "Select city…" : "Select state first"}
									options={cities}
									loading={citiesLoading}
									value={field.value ?? ""}
									onChange={field.onChange}
									onBlur={field.onBlur}
									disabled={!stateIso2 || citiesLoading}
									error={errors.city?.message}
									emptyMessage="No cities found for this state"
								/>
							)}
						/>
					</div>
				</Section>

				{/* Health Profile */}
				<Section icon={Heart} title="Health Profile">
					<div className="space-y-4">
						{/* Risk score */}
						<RiskScoreGauge score={healthRiskScore} />

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-foreground">
									Blood Group
								</label>
								<select
									{...register("bloodGroup")}
									className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								>
									<option value="">Select blood group</option>
									{BLOOD_GROUPS.map((bg) => (
										<option key={bg} value={bg}>
											{bg}
										</option>
									))}
								</select>
							</div>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">Allergies</label>
							<Controller
								name="allergies"
								control={control}
								render={({ field }) => (
									<TagInput
										value={field.value ?? []}
										onChange={field.onChange}
										placeholder="e.g. Penicillin — type and press Enter"
									/>
								)}
							/>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								Chronic Conditions
							</label>
							<p className="mb-1 text-xs text-muted">
								Each condition adds 10 pts to your risk score.
							</p>
							<Controller
								name="chronicConditions"
								control={control}
								render={({ field }) => (
									<TagInput
										value={field.value ?? []}
										onChange={field.onChange}
										placeholder="e.g. Diabetes — type and press Enter"
									/>
								)}
							/>
						</div>
					</div>
				</Section>

				{/* Emergency Contact */}
				<Section icon={AlertCircle} title="Emergency Contact">
					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							label="Contact Name"
							placeholder="Full name"
							{...register("emergencyContactName")}
							error={errors.emergencyContactName?.message}
						/>
						<Input
							label="Phone Number"
							placeholder="+91 XXXXX XXXXX"
							type="tel"
							{...register("emergencyContactPhone")}
							error={errors.emergencyContactPhone?.message}
						/>
						<div className="sm:col-span-2">
							<Input
								label="Email Address"
								placeholder="contact@example.com"
								type="email"
								{...register("emergencyContactEmail")}
								error={errors.emergencyContactEmail?.message}
							/>
						</div>
					</div>
				</Section>

				{/* Save button */}
				<div className="flex justify-end">
					<Button
						type="submit"
						variant="primary"
						size="lg"
						disabled={!isDirty || isSaving}
						loading={isSaving}
					>
						Save Changes
					</Button>
				</div>
			</form>
		</div>
	);
}

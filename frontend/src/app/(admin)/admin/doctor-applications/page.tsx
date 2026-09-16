"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, Clock3, FileCheck2, MapPin, ShieldAlert, X } from "lucide-react";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastProvider";
import type { DoctorApplication, DoctorApplicationsResponse } from "@/types/admin";

const dateTime = (value: string) =>
	new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));

export default function DoctorApplicationsPage() {
	const { data, error, isLoading, mutate } = useSWR<DoctorApplicationsResponse>(
		API_ROUTES.ADMIN_DOCTOR_APPLICATIONS,
		swrFetcher,
		{ revalidateOnFocus: false },
	);
	const { addToast } = useToast();
	const [reviewing, setReviewing] = useState<string | null>(null);

	const review = async (application: DoctorApplication, status: "APPROVED" | "REJECTED") => {
		setReviewing(application.id);
		try {
			await apiClient(API_ROUTES.ADMIN_DOCTOR_APPLICATION(application.id), {
				method: "PATCH",
				body: {
					status,
					note:
						status === "APPROVED"
							? "Verified by Niraksh admin"
							: "Please provide updated professional details",
				},
			});
			await mutate();
			addToast(
				"success",
				status === "APPROVED"
					? "Doctor approved and listed for patients"
					: "Application marked for revision",
			);
		} catch (reviewError) {
			addToast(
				"error",
				reviewError instanceof Error ? reviewError.message : "Could not update application",
			);
		} finally {
			setReviewing(null);
		}
	};

	return (
		<div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<header>
				<p className="text-sm font-semibold text-primary">Niraksh administration</p>
				<h1 className="font-heading text-3xl font-bold text-foreground">Doctor applications</h1>
				<p className="mt-1 text-sm text-muted">
					Review professional details before doctors become visible and bookable to patients.
				</p>
			</header>
			{isLoading ? (
				<div className="flex min-h-60 items-center justify-center">
					<Spinner size="lg" className="text-primary" />
				</div>
			) : error ? (
				<div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
					Could not load doctor applications.
				</div>
			) : (
				<div className="space-y-4">
					{(data?.applications ?? []).map((application) => (
						<ApplicationCard
							key={application.id}
							application={application}
							reviewing={reviewing === application.id}
							onReview={review}
						/>
					))}
					{(data?.applications ?? []).length === 0 && (
						<div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
							No doctor applications yet.
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function ApplicationCard({
	application,
	reviewing,
	onReview,
}: {
	application: DoctorApplication;
	reviewing: boolean;
	onReview: (application: DoctorApplication, status: "APPROVED" | "REJECTED") => void;
}) {
	const pending = application.verificationStatus === "PENDING";
	return (
		<article className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex items-start gap-3">
					<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<FileCheck2 className="size-5" />
					</div>
					<div>
						<h2 className="font-heading text-lg font-bold text-foreground">
							{application.displayName ?? application.user.name ?? "Doctor"}
						</h2>
						<p className="text-sm text-muted">
							{application.user.email} · Applied {dateTime(application.createdAt)}
						</p>
						<div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
							<span
								className={`rounded-full px-2.5 py-1 font-semibold ${application.verificationStatus === "APPROVED" ? "bg-green-100 text-green-700" : application.verificationStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
							>
								{application.verificationStatus}
							</span>
							<span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
								License: {application.licenseNumber}
							</span>
						</div>
					</div>
				</div>
				{pending && (
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							disabled={reviewing}
							onClick={() => onReview(application, "REJECTED")}
							className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
						>
							<X className="size-4" /> Request changes
						</button>
						<button
							type="button"
							disabled={reviewing}
							onClick={() => onReview(application, "APPROVED")}
							className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
						>
							{reviewing ? <Spinner size="sm" /> : <Check className="size-4" />} Approve & list
						</button>
					</div>
				)}
			</div>
			<div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
				<Detail
					label="Specialization"
					value={`${application.specialization ?? "—"} · ${application.qualification ?? "—"}`}
				/>
				<Detail
					label="Experience / fee"
					value={`${application.experienceYears ?? "—"} years · ₹${application.consultationFee ?? "—"}`}
				/>
				<Detail
					label="Location"
					value={
						application.city && application.state
							? `${application.city}, ${application.state}`
							: "—"
					}
					icon={MapPin}
				/>
				<Detail
					label="Modes"
					value={application.consultationModes.join(", ").replaceAll("_", " ") || "—"}
					icon={Clock3}
				/>
			</div>
			{application.bio && (
				<p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted">{application.bio}</p>
			)}
			{application.verificationNote && (
				<div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
					<ShieldAlert className="mt-0.5 size-4 shrink-0" />
					{application.verificationNote}
				</div>
			)}
		</article>
	);
}

function Detail({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: string;
	icon?: typeof MapPin;
}) {
	return (
		<div>
			<p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
			<p className="mt-1 flex items-center gap-1 text-sm font-semibold capitalize text-foreground">
				{Icon && <Icon className="size-3.5 text-primary" />}
				{value}
			</p>
		</div>
	);
}

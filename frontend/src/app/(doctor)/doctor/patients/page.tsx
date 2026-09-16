"use client";

import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { useDoctorMe, useDoctorPatients } from "@/hooks/useDoctorPortal";
import { Spinner } from "@/components/ui/Spinner";

export default function DoctorPatientsPage() {
	const { data: me, isLoading: profileLoading } = useDoctorMe();
	const approved = me?.profile.verificationStatus === "APPROVED";
	const { data, isLoading, error } = useDoctorPatients(approved);
	if (profileLoading || (approved && isLoading))
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	if (!approved)
		return (
			<div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
				<h1 className="font-heading text-2xl font-bold text-foreground">Approval required</h1>
				<p className="mt-2 text-sm text-muted">
					Patient records become available after your professional profile is approved.
				</p>
				<Link href="/doctor/application" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">
					Open application
				</Link>
			</div>
		);
	if (error)
		return <div className="p-10 text-center text-sm text-muted">Could not load patient records. Please refresh.</div>;
	return (
		<div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<div>
				<p className="text-sm font-semibold text-primary">Doctor workspace</p>
				<h1 className="font-heading text-2xl font-bold text-foreground">My Patients</h1>
				<p className="mt-1 text-sm text-muted">
					Only patients with active appointment access appear here.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{(data?.patients ?? []).map((entry) => (
					<Link
						key={entry.patient.id}
						href={`/doctor/patients/${entry.patient.id}`}
						className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-md"
					>
						<div className="flex items-center gap-3">
							<div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
								<UserRound className="size-5" />
							</div>
							<div className="min-w-0">
								<p className="truncate font-semibold text-foreground">
									{entry.patient.name ?? "Patient"}
								</p>
								<p className="truncate text-xs text-muted">{entry.patient.email}</p>
							</div>
						</div>
						<div className="mt-4 space-y-2 text-sm text-muted">
							<p>
								Blood group:{" "}
								<span className="font-medium text-foreground">
									{entry.patient.patientHealthProfile?.bloodGroup ?? "Not added"}
								</span>
							</p>
							<p className="line-clamp-1">
								Conditions:{" "}
								<span className="font-medium text-foreground">
									{entry.patient.patientHealthProfile?.chronicConditions.join(", ") ||
										"None recorded"}
								</span>
							</p>
						</div>
						<div className="mt-5 flex items-center justify-between text-sm font-semibold text-primary">
							<span>Open health record</span>
							<ArrowRight className="size-4" />
						</div>
					</Link>
				))}
			</div>
			{(data?.patients ?? []).length === 0 && (
				<div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
					No active patients yet. Patient access starts after a confirmed booking.
				</div>
			)}
		</div>
	);
}

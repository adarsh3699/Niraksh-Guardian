"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, FileHeart, Users } from "lucide-react";
import { useDoctorAppointments, useDoctorMe, useDoctorPatients } from "@/hooks/useDoctorPortal";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

const formatDateTime = (value: string) =>
	new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Kolkata",
	}).format(new Date(value));

export function DoctorDashboardClient() {
	const { data: me, isLoading: profileLoading } = useDoctorMe();
	const approved = me?.profile.verificationStatus === "APPROVED";
	const { data: appointmentsData, isLoading: appointmentsLoading } = useDoctorAppointments(approved);
	const { data: patientsData, isLoading: patientsLoading } = useDoctorPatients(approved);
	const appointments = appointmentsData?.appointments ?? [];
	const upcoming = appointments
		.filter((appointment) => new Date(appointment.scheduledAt) >= new Date())
		.filter((appointment) => !appointment.status.startsWith("CANCELLED"))
		.slice(0, 5);

	if (profileLoading || appointmentsLoading || patientsLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
				<div>
					<p className="text-sm font-semibold text-primary">Doctor workspace</p>
					<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
						Good to see you
						{me?.profile.directoryDoctor?.name ? `, ${me.profile.directoryDoctor.name}` : ""}
					</h1>
					<p className="mt-1 text-sm text-muted">
						Your patients&apos; context, before the consultation starts.
					</p>
				</div>
				<Link
					href="/doctor/appointments"
					className="btn-gradient inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
				>
					<CalendarDays className="size-4" /> View appointments
				</Link>
			</div>

			{me?.profile.verificationStatus !== "APPROVED" && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
					<p className="font-semibold">
						Doctor profile verification: {me?.profile.verificationStatus ?? "Not configured"}
					</p>
					<p className="mt-1">
						Patient bookings will become available after your doctor profile is approved and
						availability is configured.
					</p>
					<Link
						href="/doctor/application"
						className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
					>
						Review or update application →
					</Link>
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					icon={CalendarDays}
					label="Upcoming visits"
					value={upcoming.length}
					tone="primary"
				/>
				<StatCard
					icon={Users}
					label="Authorized patients"
					value={patientsData?.patients.length ?? 0}
					tone="accent"
				/>
				<StatCard
					icon={Clock3}
					label="Pending requests"
					value={appointments.filter((a) => a.status === "REQUESTED").length}
					tone="warning"
				/>
				<StatCard
					icon={FileHeart}
					label="Completed visits"
					value={appointments.filter((a) => a.status === "COMPLETED").length}
					tone="success"
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
				<section className="rounded-2xl border border-border bg-surface shadow-card">
					<div className="flex items-center justify-between border-b border-border px-5 py-4">
						<div>
							<h2 className="font-heading text-lg font-bold text-foreground">
								Upcoming consultations
							</h2>
							<p className="text-sm text-muted">Open a visit to review its patient context.</p>
						</div>
						<Link
							href="/doctor/appointments"
							className="text-sm font-semibold text-primary hover:underline"
						>
							View all
						</Link>
					</div>
					<div className="divide-y divide-border">
						{upcoming.length === 0 ? (
							<p className="p-6 text-sm text-muted">No upcoming consultations yet.</p>
						) : (
							upcoming.map((appointment) => (
								<div
									key={appointment.id}
									className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
								>
									<div>
										<p className="font-semibold text-foreground">
											{appointment.patient?.name ?? "Patient"}
										</p>
										<p className="mt-1 text-sm text-muted">
											{formatDateTime(appointment.scheduledAt)} ·{" "}
											{appointment.mode.replace("_", " ")}
										</p>
										{appointment.reason && (
											<p className="mt-1 line-clamp-1 text-xs text-muted">{appointment.reason}</p>
										)}
									</div>
									<div className="flex items-center gap-3">
										<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
											{appointment.status}
										</span>
										{appointment.patient && (
											<Link
												href={`/doctor/patients/${appointment.patient.id}`}
												className="text-sm font-semibold text-primary hover:underline"
											>
												Open record
											</Link>
										)}
									</div>
								</div>
							))
						)}
					</div>
				</section>

				<section className="rounded-2xl border border-border bg-surface shadow-card">
					<div className="flex items-center justify-between border-b border-border px-5 py-4">
						<div>
							<h2 className="font-heading text-lg font-bold text-foreground">Patient context</h2>
							<p className="text-sm text-muted">Access granted through appointments.</p>
						</div>
						<Link
							href="/doctor/patients"
							className="text-sm font-semibold text-primary hover:underline"
						>
							View all
						</Link>
					</div>
					<div className="divide-y divide-border">
						{(patientsData?.patients ?? []).slice(0, 5).map((entry) => (
							<Link
								key={entry.patient.id}
								href={`/doctor/patients/${entry.patient.id}`}
								className="flex items-center gap-3 p-4 transition-colors hover:bg-primary/5"
							>
								<div className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
									{entry.patient.name?.charAt(0).toUpperCase() ?? "P"}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-foreground">
										{entry.patient.name ?? "Patient"}
									</p>
									<p className="truncate text-xs text-muted">
										{entry.patient.patientHealthProfile?.chronicConditions.join(", ") ||
											"Health context available"}
									</p>
								</div>
								<CheckCircle2 className="size-4 text-green-600" />
							</Link>
						))}
						{(patientsData?.patients ?? []).length === 0 && (
							<p className="p-6 text-sm text-muted">No active patient access yet.</p>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
	tone,
}: {
	icon: typeof CalendarDays;
	label: string;
	value: number;
	tone: "primary" | "accent" | "warning" | "success";
}) {
	return (
		<div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
			<div className="flex items-center justify-between">
				<div
					className={cn(
						"flex size-10 items-center justify-center rounded-xl",
						tone === "warning"
							? "bg-amber-100 text-amber-700"
							: tone === "success"
								? "bg-green-100 text-green-700"
								: tone === "accent"
									? "bg-accent/10 text-accent"
									: "bg-primary/10 text-primary",
					)}
				>
					<Icon className="size-5" />
				</div>
				<span className="text-2xl font-bold text-foreground">{value}</span>
			</div>
			<p className="mt-4 text-sm text-muted">{label}</p>
		</div>
	);
}

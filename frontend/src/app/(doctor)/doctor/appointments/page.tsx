"use client";

import { CalendarDays, Check, X } from "lucide-react";
import {
	useDoctorAppointments,
	useDoctorMe,
	updateDoctorAppointmentStatus,
} from "@/hooks/useDoctorPortal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastProvider";
import Link from "next/link";

const dateTime = (value: string) =>
	new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Kolkata",
	}).format(new Date(value));

export default function DoctorAppointmentsPage() {
	const { data: me, isLoading: profileLoading } = useDoctorMe();
	const approved = me?.profile.verificationStatus === "APPROVED";
	const { data, isLoading, error, mutate } = useDoctorAppointments(approved);
	const { addToast } = useToast();

	const updateStatus = async (
		id: string,
		status: "CONFIRMED" | "CANCELLED_BY_DOCTOR" | "COMPLETED",
	) => {
		try {
			await updateDoctorAppointmentStatus(id, { status });
			await mutate();
			addToast("success", "Appointment updated");
		} catch (error) {
			addToast("error", error instanceof Error ? error.message : "Could not update appointment");
		}
	};

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
					Appointments will appear here after your professional profile is approved.
				</p>
				<Link href="/doctor/application" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">
					Open application
				</Link>
			</div>
		);
	if (error)
		return (
			<div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
				<p className="font-semibold text-foreground">Could not load appointments</p>
				<p className="mt-2 text-sm text-muted">Please refresh and try again.</p>
			</div>
		);

	return (
		<div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<div>
				<p className="text-sm font-semibold text-primary">Doctor workspace</p>
				<h1 className="font-heading text-2xl font-bold text-foreground">Appointments</h1>
				<p className="mt-1 text-sm text-muted">
					Manage your consultation schedule and patient access.
				</p>
			</div>
			<div className="space-y-3">
				{(data?.appointments ?? []).map((appointment) => (
					<div
						key={appointment.id}
						className="rounded-2xl border border-border bg-surface p-5 shadow-card"
					>
						<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div className="flex items-start gap-3">
								<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<CalendarDays className="size-5" />
								</div>
								<div>
									<p className="font-semibold text-foreground">
										{appointment.patient?.name ?? "Patient"}
									</p>
									<p className="text-sm text-muted">
										{dateTime(appointment.scheduledAt)} · {appointment.mode.replace("_", " ")}
									</p>
									{appointment.reason && (
										<p className="mt-2 text-sm text-muted">Reason: {appointment.reason}</p>
									)}
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
									{appointment.status}
								</span>
								{appointment.status === "REQUESTED" && (
									<>
										<button
											type="button"
											onClick={() => void updateStatus(appointment.id, "CONFIRMED")}
											className="inline-flex h-9 items-center gap-1 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white"
										>
											<Check className="size-3.5" /> Confirm
										</button>
										<button
											type="button"
											onClick={() => void updateStatus(appointment.id, "CANCELLED_BY_DOCTOR")}
											className="inline-flex h-9 items-center gap-1 rounded-lg border border-destructive/30 px-3 text-xs font-semibold text-destructive"
										>
											<X className="size-3.5" /> Decline
										</button>
									</>
								)}
								{appointment.status === "CONFIRMED" && (
									<button
										type="button"
										onClick={() => void updateStatus(appointment.id, "COMPLETED")}
										className="inline-flex h-9 items-center gap-1 rounded-lg border border-primary/30 px-3 text-xs font-semibold text-primary"
									>
										Mark completed
									</button>
								)}
							</div>
						</div>
					</div>
				))}
				{(data?.appointments ?? []).length === 0 && (
					<div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
						No appointments yet.
					</div>
				)}
			</div>
		</div>
	);
}

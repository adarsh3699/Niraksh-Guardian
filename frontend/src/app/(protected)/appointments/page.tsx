"use client";

import Link from "next/link";
import { CalendarDays, X } from "lucide-react";
import useSWR from "swr";
import { swrFetcher, apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastProvider";
import type { Appointment, DoctorAppointmentResponse } from "@/types/appointments";

const dateTime = (value: string) =>
	new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Kolkata",
	}).format(new Date(value));

export default function AppointmentsPage() {
	const { data, isLoading, mutate } = useSWR<DoctorAppointmentResponse>(
		API_ROUTES.MY_APPOINTMENTS,
		swrFetcher,
		{ revalidateOnFocus: false },
	);
	const { addToast } = useToast();
	const cancel = async (appointment: Appointment) => {
		try {
			await apiClient(API_ROUTES.APPOINTMENT(appointment.id) + "/cancel", { method: "PATCH" });
			await mutate();
			addToast("success", "Appointment cancelled");
		} catch (error) {
			addToast("error", error instanceof Error ? error.message : "Could not cancel appointment");
		}
	};
	if (isLoading)
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	return (
		<div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<div>
				<p className="text-sm font-semibold text-primary">Patient workspace</p>
				<h1 className="font-heading text-2xl font-bold text-foreground">My appointments</h1>
				<p className="mt-1 text-sm text-muted">
					Track appointment requests, confirmations, and doctor consultations in one place.
				</p>
			</div>
			<div className="space-y-3">
				{(data?.appointments ?? []).map((appointment) => (
					<div
						key={appointment.id}
						className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="flex items-start gap-3">
							<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<CalendarDays className="size-5" />
							</div>
							<div>
								<p className="font-semibold text-foreground">
									{appointment.doctor?.name ?? "Doctor"}
								</p>
								<p className="text-sm text-muted">
									{appointment.doctor?.specialization} · {dateTime(appointment.scheduledAt)}
								</p>
								<p className="mt-1 text-xs text-muted">
									{appointment.mode.replace("_", " ")} consultation
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
								{appointment.status}
							</span>
							{["REQUESTED", "CONFIRMED", "RESCHEDULED"].includes(appointment.status) && (
								<button
									type="button"
									onClick={() => void cancel(appointment)}
									className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
								>
									<X className="size-3.5" /> Cancel
								</button>
							)}
						</div>
					</div>
				))}
				{(data?.appointments ?? []).length === 0 && (
					<div className="rounded-2xl border border-dashed border-border p-10 text-center">
						<p className="text-sm text-muted">No appointments booked yet.</p>
						<Link
							href="/symptom-analysis"
							className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
						>
							Find a doctor
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Video } from "lucide-react";
import { useDoctorSlots } from "@/hooks/useDoctorPortal";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useToast } from "@/contexts/ToastProvider";
import { Spinner } from "@/components/ui/Spinner";
import type { ConsultationMode } from "@/types/appointments";

const getTomorrow = () => {
	const date = new Date();
	date.setDate(date.getDate() + 1);
	return date.toISOString().slice(0, 10);
};

const formatSlot = (value: string) =>
	new Intl.DateTimeFormat("en-IN", { timeStyle: "short", timeZone: "Asia/Kolkata" }).format(
		new Date(value),
	);

export function BookAppointmentClient() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { addToast } = useToast();
	const doctorId = searchParams.get("doctorId") ?? "";
	const [date, setDate] = useState(getTomorrow);
	const [selectedSlot, setSelectedSlot] = useState("");
	const [mode, setMode] = useState<ConsultationMode>("IN_PERSON");
	const [reason, setReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { data, error, isLoading } = useDoctorSlots(doctorId, date);
	const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

	useEffect(() => {
		const availableModes = data?.doctor.consultationModes ?? [];
		if (availableModes.length > 0 && !availableModes.includes(mode)) setMode(availableModes[0]);
	}, [data, mode]);

	if (!doctorId)
		return (
			<div className="mx-auto max-w-xl px-4 py-10 text-center">
				<p className="font-semibold text-foreground">Choose a doctor first</p>
				<p className="mt-2 text-sm text-muted">
					Return to symptom analysis and select a verified doctor.
				</p>
			</div>
		);

	const submit = async () => {
		if (!selectedSlot) return addToast("error", "Select an available time slot first");
		setIsSubmitting(true);
		try {
			await apiClient(API_ROUTES.APPOINTMENTS, {
				method: "POST",
				body: { doctorId, scheduledAt: selectedSlot, mode, reason: reason || undefined },
			});
			addToast("success", "Appointment request sent to the doctor");
			router.push("/appointments");
		} catch (submitError) {
			addToast(
				"error",
				submitError instanceof Error ? submitError.message : "Could not book appointment",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<div>
				<p className="text-sm font-semibold text-primary">Doctor booking</p>
				<h1 className="font-heading text-2xl font-bold text-foreground">Book your consultation</h1>
				<p className="mt-1 text-sm text-muted">
					After the doctor confirms, they will receive temporary access to your health context for
					this visit.
				</p>
			</div>
			<div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
				<section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
					<div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
						<CalendarDays className="size-6" />
					</div>
					<h2 className="mt-4 font-heading text-lg font-bold text-foreground">Choose date</h2>
					<label htmlFor="appointment-date" className="mt-3 block text-sm font-semibold text-foreground">
						Date
					</label>
					<input
						id="appointment-date"
						type="date"
						min={minDate}
						value={date}
						onChange={(event) => {
							setDate(event.target.value);
							setSelectedSlot("");
						}}
						className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
					/>
					<label className="mt-5 block text-sm font-semibold text-foreground">
						Consultation mode
						<select
							value={mode}
							onChange={(event) => setMode(event.target.value as ConsultationMode)}
							className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
						>
							{(data?.doctor.consultationModes ?? ["IN_PERSON"]).map((availableMode) => (
								<option key={availableMode} value={availableMode}>
									{availableMode === "IN_PERSON"
										? "In person"
										: availableMode === "VIDEO"
											? "Video consultation"
											: "Phone consultation"}
								</option>
							))}
						</select>
					</label>
					<label className="mt-5 block text-sm font-semibold text-foreground">
						What would you like help with?
						<textarea
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							rows={4}
							maxLength={1000}
							placeholder="Example: Fatigue and recent sugar fluctuations"
							className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
						/>
					</label>
				</section>
				<section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
							<Clock3 className="size-5" />
						</div>
						<div>
							<h2 className="font-heading text-lg font-bold text-foreground">Available slots</h2>
							<p className="text-sm text-muted">{data?.doctor.name ?? "Verified doctor"}</p>
						</div>
					</div>
					{isLoading ? (
						<div className="flex min-h-40 items-center justify-center">
							<Spinner className="text-primary" />
						</div>
					) : error ? (
						<div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
							This doctor has not opened booking slots yet.
						</div>
					) : data?.slots.length === 0 ? (
						<div className="mt-6 rounded-xl bg-background p-6 text-center text-sm text-muted">
							No available slots for this date. Try another date.
						</div>
					) : (
						<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
							{data?.slots.map((slot) => (
								<button
									key={slot}
									type="button"
									onClick={() => setSelectedSlot(slot)}
									className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${selectedSlot === slot ? "border-primary bg-primary text-white" : "border-border text-foreground hover:border-primary hover:bg-primary/5"}`}
								>
									<span className="flex items-center justify-center gap-2">
										<Clock3 className="size-4" />
										{formatSlot(slot)}
									</span>
								</button>
							))}
						</div>
					)}
					{selectedSlot && (
						<div className="mt-6 flex items-start gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-800">
							<CheckCircle2 className="mt-0.5 size-5 shrink-0" />
							<p>
								Selected: <strong>{formatSlot(selectedSlot)}</strong>. The doctor receives temporary
								access only after confirming this request.
							</p>
						</div>
					)}
					<button
						type="button"
						onClick={() => void submit()}
						disabled={isSubmitting || !selectedSlot}
						className="btn-gradient mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? <Spinner size="sm" /> : <Video className="size-4" />} Request
						appointment
					</button>
				</section>
			</div>
		</div>
	);
}

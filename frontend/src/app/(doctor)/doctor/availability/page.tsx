"use client";

import { useEffect, useState } from "react";
import { Clock3, Plus, Save, Trash2 } from "lucide-react";
import useSWR from "swr";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastProvider";
import { useDoctorMe } from "@/hooks/useDoctorPortal";
import Link from "next/link";

interface AvailabilitySlot {
	weekday: number;
	startTime: string;
	endTime: string;
	slotDurationMinutes: number;
	isActive: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const emptySlot = (): AvailabilitySlot => ({
	weekday: 1,
	startTime: "09:00",
	endTime: "17:00",
	slotDurationMinutes: 30,
	isActive: true,
});

export default function DoctorAvailabilityPage() {
	const { data: me, isLoading: profileLoading } = useDoctorMe();
	const approved = me?.profile.verificationStatus === "APPROVED";
	const { data, isLoading, mutate } = useSWR<{ availability: AvailabilitySlot[] }>(
		approved ? API_ROUTES.DOCTOR_AVAILABILITY : null,
		swrFetcher,
		{ revalidateOnFocus: false },
	);
	const { addToast } = useToast();
	const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (data?.availability)
			setSlots(
				data.availability.map(({ weekday, startTime, endTime, slotDurationMinutes, isActive }) => ({
					weekday,
					startTime,
					endTime,
					slotDurationMinutes,
					isActive,
				})),
			);
	}, [data]);

	const updateSlot = (index: number, patch: Partial<AvailabilitySlot>) =>
		setSlots((current) =>
			current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)),
		);
	const save = async () => {
		setIsSaving(true);
		try {
			await apiClient(API_ROUTES.DOCTOR_AVAILABILITY, { method: "PUT", body: { slots } });
			await mutate();
			addToast("success", "Availability saved");
		} catch (error) {
			addToast("error", error instanceof Error ? error.message : "Could not save availability");
		} finally {
			setIsSaving(false);
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
					You can configure booking windows after your professional profile is approved.
				</p>
				<Link href="/doctor/application" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">
					Open application
				</Link>
			</div>
		);
	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<div>
				<p className="text-sm font-semibold text-primary">Doctor workspace</p>
				<h1 className="font-heading text-2xl font-bold text-foreground">Availability</h1>
				<p className="mt-1 text-sm text-muted">Set consultation slots that patients can book.</p>
			</div>
			<div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div className="flex items-start gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Clock3 className="size-5" />
						</div>
						<div>
							<h2 className="font-heading text-lg font-bold text-foreground">
								Weekly booking windows
							</h2>
							<p className="mt-1 text-sm text-muted">
								Patients will see slots generated from these windows.
							</p>
						</div>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setSlots((current) => [...current, emptySlot()])}
							className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/30 px-3 text-sm font-semibold text-primary hover:bg-primary/5"
						>
							<Plus className="size-4" /> Add window
						</button>
						<button
							type="button"
							onClick={() => void save()}
							disabled={isSaving}
							className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
						>
							{isSaving ? <Spinner size="sm" /> : <Save className="size-4" />} Save
						</button>
					</div>
				</div>
				<div className="mt-6 space-y-3">
					{slots.map((slot, index) => (
						<div
							key={`${slot.weekday}-${slot.startTime}-${index}`}
							className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1.1fr_1fr_1fr_0.8fr_auto] sm:items-end"
						>
							<label className="text-xs font-semibold uppercase tracking-wide text-muted">
								Day
								<select
									value={slot.weekday}
									onChange={(event) => updateSlot(index, { weekday: Number(event.target.value) })}
									className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm font-normal normal-case text-foreground"
								>
									{DAYS.map((day, dayIndex) => (
										<option key={day} value={dayIndex}>
											{day}
										</option>
									))}
								</select>
							</label>
							<label className="text-xs font-semibold uppercase tracking-wide text-muted">
								Start
								<input
									type="time"
									value={slot.startTime}
									onChange={(event) => updateSlot(index, { startTime: event.target.value })}
									className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm font-normal text-foreground"
								/>
							</label>
							<label className="text-xs font-semibold uppercase tracking-wide text-muted">
								End
								<input
									type="time"
									value={slot.endTime}
									onChange={(event) => updateSlot(index, { endTime: event.target.value })}
									className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm font-normal text-foreground"
								/>
							</label>
							<label className="text-xs font-semibold uppercase tracking-wide text-muted">
								Slot
								<select
									value={slot.slotDurationMinutes}
									onChange={(event) =>
										updateSlot(index, { slotDurationMinutes: Number(event.target.value) })
									}
									className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm font-normal normal-case text-foreground"
								>
									<option value={15}>15 min</option>
									<option value={30}>30 min</option>
									<option value={45}>45 min</option>
									<option value={60}>60 min</option>
								</select>
							</label>
							<button
								type="button"
								onClick={() =>
									setSlots((current) => current.filter((_, slotIndex) => slotIndex !== index))
								}
								className="inline-flex h-10 items-center justify-center rounded-lg p-2 text-muted hover:bg-destructive/10 hover:text-destructive"
								aria-label="Remove availability window"
							>
								<Trash2 className="size-4" />
							</button>
						</div>
					))}
					{slots.length === 0 && (
						<div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
							No booking windows configured. Add your first window above.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

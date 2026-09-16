"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	Clock3,
	FileClock,
	Info,
	LockKeyhole,
	Save,
	ShieldCheck,
	Siren,
	Sparkles,
} from "lucide-react";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useToast } from "@/contexts/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import type { DoctorAppointmentResponse } from "@/types/appointments";
import type { ClinicalIntakeResponse, ClinicalTimelineEntry, ClinicalTimelineResponse, HpiForm, RosForm } from "@/types/clinicalIntake";

const emptyHpi: HpiForm = {
	onset: "",
	duration: "",
	severity: "",
	location: "",
	character: "",
	aggravatingFactors: "",
	relievingFactors: "",
	associatedSymptoms: "",
	previousTreatment: "",
};

const emptyRos: RosForm = {
	general: "",
	respiratory: "",
	cardiac: "",
	gastrointestinal: "",
	neurological: "",
	endocrine: "",
	other: "",
};

const formatDateTime = (value: string) =>
	new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(
		new Date(value),
	);

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(value));

const intakeStatusLabel: Record<string, string> = {
	DRAFT: "Draft saved",
	SUBMITTED: "Shared with doctor",
	REVIEWED: "Reviewed by doctor",
	EXPIRED: "Draft expired",
};

function Field({
	id,
	label,
	value,
	onChange,
	placeholder,
	rows,
	required,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	rows?: number;
	required?: boolean;
}) {
	return (
		<label htmlFor={id} className="block text-sm font-semibold text-foreground">
			{label} {required && <span className="text-destructive">*</span>}
			{rows ? (
				<textarea
					id={id}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					rows={rows}
					className="mt-2 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
			) : (
				<input
					id={id}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
			)}
		</label>
	);
}

function TriageBanner({ level, reasons, message }: { level: string; reasons: string[]; message: string | null }) {
	if (level === "ROUTINE") return null;
	const emergency = level === "EMERGENCY";
	return (
		<div
			role="alert"
			className={cn(
				"rounded-2xl border p-5",
				emergency ? "border-red-300 bg-red-50 text-red-950" : "border-amber-300 bg-amber-50 text-amber-950",
			)}
		>
			<div className="flex items-start gap-3">
				{emergency ? <Siren className="mt-0.5 size-6 shrink-0" /> : <AlertTriangle className="mt-0.5 size-6 shrink-0" />}
				<div>
					<p className="font-heading font-bold">{emergency ? "Emergency symptoms may need immediate care" : "Prompt clinical review recommended"}</p>
					<p className="mt-1 text-sm">{message}</p>
					{reasons.length > 0 && <p className="mt-3 text-sm font-semibold">Detected concern: {reasons.join("; ")}</p>}
					{emergency && <p className="mt-3 text-sm font-bold">Call local emergency services or go to the nearest emergency department now.</p>}
				</div>
			</div>
		</div>
	);
}

function Timeline({ entries }: { entries: ClinicalTimelineEntry[] }) {
	return (
		<section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
			<div className="flex items-start gap-3">
				<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<FileClock className="size-5" />
				</div>
				<div>
					<h2 className="font-heading text-lg font-bold text-foreground">Your health timeline</h2>
					<p className="mt-1 text-sm text-muted">Reports, symptoms, medicines and prescriptions in chronological order.</p>
				</div>
			</div>
			{entries.length === 0 ? (
				<p className="mt-5 rounded-xl bg-background p-4 text-sm text-muted">Your timeline will appear as you add health records.</p>
			) : (
				<div className="mt-5 space-y-4">
					{entries.slice(0, 12).map((entry) => (
						<div key={`${entry.sourceType}-${entry.sourceId ?? entry.eventDate}`} className="relative border-l-2 border-primary/20 pl-5">
							<span className="absolute -left-[7px] top-1 size-3 rounded-full border-2 border-surface bg-primary" />
							<div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
								<p className="text-sm font-semibold text-foreground">{entry.title}</p>
								<time className="text-xs text-muted" dateTime={entry.eventDate}>{formatDate(entry.eventDate)}</time>
							</div>
							{entry.summary && <p className="mt-1 text-sm leading-6 text-muted">{entry.summary}</p>}
						</div>
					))}
				</div>
			)}
		</section>
	);
}

export function ClinicalIntakeClient() {
	const { addToast } = useToast();
	const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
	const [chiefComplaint, setChiefComplaint] = useState("");
	const [hpi, setHpi] = useState<HpiForm>(emptyHpi);
	const [ros, setRos] = useState<RosForm>(emptyRos);
	const [medicationNotes, setMedicationNotes] = useState("");
	const [allergyNotes, setAllergyNotes] = useState("");
	const [consentGiven, setConsentGiven] = useState(false);
	const [saving, setSaving] = useState(false);
	const [sessionExpired, setSessionExpired] = useState(false);

	const { data: appointmentData, isLoading: appointmentsLoading } = useSWR<DoctorAppointmentResponse>(
		API_ROUTES.MY_APPOINTMENTS,
		swrFetcher,
		{ revalidateOnFocus: false },
	);
	const { data: intakeData, isLoading: intakeLoading, mutate: mutateIntake } = useSWR<ClinicalIntakeResponse>(
		selectedAppointmentId
			? `${API_ROUTES.CLINICAL_INTAKE}?appointmentId=${encodeURIComponent(selectedAppointmentId)}`
			: API_ROUTES.CLINICAL_INTAKE,
		swrFetcher,
		{ revalidateOnFocus: false },
	);
	const { data: timelineData, isLoading: timelineLoading } = useSWR<ClinicalTimelineResponse>(
		API_ROUTES.CLINICAL_INTAKE_TIMELINE,
		swrFetcher,
		{ revalidateOnFocus: false },
	);

	const appointments = useMemo(
		() => (appointmentData?.appointments ?? []).filter((appointment) => ["REQUESTED", "CONFIRMED", "RESCHEDULED"].includes(appointment.status)),
		[appointmentData?.appointments],
	);
	const activeIntake = intakeData?.intake ?? null;

	useEffect(() => {
		if (!activeIntake) return;
		setSelectedAppointmentId((current) => activeIntake.appointmentId ?? current);
		const expired = activeIntake.status === "EXPIRED" || new Date(activeIntake.expiresAt).getTime() <= Date.now();
		if (expired && activeIntake.status === "EXPIRED") {
			setChiefComplaint("");
			setHpi(emptyHpi);
			setRos(emptyRos);
			setMedicationNotes("");
			setAllergyNotes("");
			setConsentGiven(false);
			setSessionExpired(true);
			return;
		}
		setChiefComplaint(activeIntake.chiefComplaint ?? "");
		setHpi({ ...emptyHpi, ...(activeIntake.hpi ?? {}) });
		setRos({ ...emptyRos, ...(activeIntake.ros ?? {}) });
		setMedicationNotes(activeIntake.medicationNotes ?? "");
		setAllergyNotes(activeIntake.allergyNotes ?? "");
		setConsentGiven(Boolean(activeIntake.consentGrantedAt && !activeIntake.consentRevokedAt));
		setSessionExpired(expired);
	}, [activeIntake]);

	useEffect(() => {
		if (!activeIntake?.expiresAt || activeIntake.status !== "DRAFT") return;
		const timer = window.setInterval(() => {
			if (new Date(activeIntake.expiresAt).getTime() <= Date.now()) {
				setSessionExpired(true);
				setChiefComplaint("");
				setHpi(emptyHpi);
				setRos(emptyRos);
				setMedicationNotes("");
				setAllergyNotes("");
				setConsentGiven(false);
			}
		}, 15_000);
		return () => window.clearInterval(timer);
	}, [activeIntake]);

	const submit = async (shouldSubmit: boolean) => {
		if (!chiefComplaint.trim()) return addToast("error", "Tell us your main health concern first");
		if (shouldSubmit && !consentGiven) return addToast("error", "Please provide consent before sharing this intake");
		setSaving(true);
		try {
			await apiClient(API_ROUTES.CLINICAL_INTAKE, {
				method: "POST",
				body: {
					appointmentId: selectedAppointmentId || null,
					chiefComplaint,
					hpi,
					ros,
					medicationNotes,
					allergyNotes,
					consentGiven,
					submit: shouldSubmit,
				},
			});
			await mutateIntake();
			addToast("success", shouldSubmit ? "Clinical intake shared with your doctor" : "Draft saved securely");
			setSessionExpired(false);
		} catch (error) {
			addToast("error", error instanceof Error ? error.message : "Could not save your clinical intake");
		} finally {
			setSaving(false);
		}
	};

	const revokeConsent = async () => {
		if (!activeIntake) return;
		try {
			await apiClient(API_ROUTES.CLINICAL_INTAKE_REVOKE(activeIntake.id), { method: "POST" });
			setConsentGiven(false);
			await mutateIntake();
			addToast("success", "Doctor sharing consent revoked");
		} catch (error) {
			addToast("error", error instanceof Error ? error.message : "Could not revoke consent");
		}
	};

	const updateHpi = (key: keyof HpiForm, value: string) => setHpi((current) => ({ ...current, [key]: value }));
	const updateRos = (key: keyof RosForm, value: string) => setRos((current) => ({ ...current, [key]: value }));

	return (
		<div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-sm font-semibold text-primary">Before your consultation</p>
					<h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Prepare for your visit</h1>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Answer a few guided questions once. Your doctor can review your history before the consultation starts.</p>
				</div>
				{activeIntake && (
					<span className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
						<CheckCircle2 className="size-4" /> {intakeStatusLabel[activeIntake.status]}
					</span>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">1. Tell us</p><p className="mt-2 text-sm text-foreground">Describe your main concern in your own words.</p></div>
				<div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">2. Add context</p><p className="mt-2 text-sm text-foreground">Share timing, symptoms, medicines and allergies.</p></div>
				<div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">3. Review</p><p className="mt-2 text-sm text-foreground">Your doctor gets an editable clinical draft.</p></div>
			</div>

			{activeIntake?.triageLevel !== "ROUTINE" && <TriageBanner level={activeIntake?.triageLevel ?? "ROUTINE"} reasons={activeIntake?.triageReasons ?? []} message={activeIntake?.triageMessage ?? null} />}

			<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
				<div className="flex items-start gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></div>
					<div className="flex-1"><h2 className="font-heading text-lg font-bold text-foreground">Link this to an appointment</h2><p className="mt-1 text-sm text-muted">Optional for now. Linking helps your doctor see the right visit context.</p></div>
				</div>
				<label htmlFor="intake-appointment" className="mt-4 block text-sm font-semibold text-foreground">Appointment</label>
				<select id="intake-appointment" value={selectedAppointmentId} onChange={(event) => setSelectedAppointmentId(event.target.value)} disabled={appointmentsLoading || Boolean(activeIntake?.appointmentId)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-70">
					<option value="">No appointment selected</option>
					{appointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.doctor?.name ?? "Doctor"} · {formatDateTime(appointment.scheduledAt)} · {appointment.status}</option>)}
				</select>
			</section>

			<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
				<div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><Info className="size-5" /></div><div><h2 className="font-heading text-lg font-bold text-foreground">Your main concern</h2><p className="mt-1 text-sm text-muted">This becomes the first line of your clinical history.</p></div></div>
				<div className="mt-5"><Field id="chief-complaint" label="What brings you here?" value={chiefComplaint} onChange={setChiefComplaint} placeholder="Example: Fatigue and sugar fluctuations for the last 3 months" rows={3} required /></div>
			</section>

			<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
				<div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Sparkles className="size-5" /></div><div><h2 className="font-heading text-lg font-bold text-foreground">History of present illness</h2><p className="mt-1 text-sm text-muted">These questions help your doctor understand how the problem started and changed.</p></div></div>
				<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field id="hpi-onset" label="When did it start?" value={hpi.onset} onChange={(value) => updateHpi("onset", value)} placeholder="Sudden or gradual, and approximate date" /><Field id="hpi-duration" label="How long has it been happening?" value={hpi.duration} onChange={(value) => updateHpi("duration", value)} placeholder="Example: 3 weeks" /><Field id="hpi-severity" label="How severe is it?" value={hpi.severity} onChange={(value) => updateHpi("severity", value)} placeholder="Mild, moderate, severe, or 0–10" /><Field id="hpi-location" label="Where do you feel it?" value={hpi.location} onChange={(value) => updateHpi("location", value)} placeholder="Body location, if relevant" /><Field id="hpi-character" label="What does it feel like?" value={hpi.character} onChange={(value) => updateHpi("character", value)} placeholder="Pressure, burning, dull, sharp, etc." /><Field id="hpi-aggravating" label="What makes it worse?" value={hpi.aggravatingFactors} onChange={(value) => updateHpi("aggravatingFactors", value)} placeholder="Food, movement, time of day, stress" /><Field id="hpi-relieving" label="What makes it better?" value={hpi.relievingFactors} onChange={(value) => updateHpi("relievingFactors", value)} placeholder="Rest, medicine, food, position" /><Field id="hpi-associated" label="Other symptoms" value={hpi.associatedSymptoms} onChange={(value) => updateHpi("associatedSymptoms", value)} placeholder="Anything else happening with it" /><div className="sm:col-span-2"><Field id="hpi-treatment" label="What have you tried already?" value={hpi.previousTreatment} onChange={(value) => updateHpi("previousTreatment", value)} placeholder="Medicines, tests, home remedies, or previous doctor advice" rows={3} /></div></div>
			</section>

			<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
				<div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><ShieldCheck className="size-5" /></div><div><h2 className="font-heading text-lg font-bold text-foreground">Review of systems</h2><p className="mt-1 text-sm text-muted">Mention relevant symptoms or write “none” for a system that does not apply.</p></div></div>
				<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field id="ros-general" label="General" value={ros.general} onChange={(value) => updateRos("general", value)} placeholder="Fever, fatigue, weight change" /><Field id="ros-respiratory" label="Respiratory" value={ros.respiratory} onChange={(value) => updateRos("respiratory", value)} placeholder="Cough, wheezing, breathlessness" /><Field id="ros-cardiac" label="Heart and circulation" value={ros.cardiac} onChange={(value) => updateRos("cardiac", value)} placeholder="Chest pain, palpitations, swelling" /><Field id="ros-gastrointestinal" label="Digestive system" value={ros.gastrointestinal} onChange={(value) => updateRos("gastrointestinal", value)} placeholder="Nausea, acidity, bowel changes" /><Field id="ros-neurological" label="Neurological" value={ros.neurological} onChange={(value) => updateRos("neurological", value)} placeholder="Headache, weakness, numbness" /><Field id="ros-endocrine" label="Endocrine / sugar" value={ros.endocrine} onChange={(value) => updateRos("endocrine", value)} placeholder="Thirst, urination, sugar changes" /><div className="sm:col-span-2"><Field id="ros-other" label="Anything else" value={ros.other} onChange={(value) => updateRos("other", value)} placeholder="Any other symptom or concern" rows={3} /></div></div>
			</section>

			<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
				<h2 className="font-heading text-lg font-bold text-foreground">Medicines and allergies</h2>
				<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field id="intake-medicines" label="Current medicines" value={medicationNotes} onChange={setMedicationNotes} placeholder="Name, dose and frequency if known" rows={3} /><Field id="intake-allergies" label="Allergies or reactions" value={allergyNotes} onChange={setAllergyNotes} placeholder="Medicine, food or other allergies" rows={3} /></div>
			</section>

			<section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
				<div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" /><div><h2 className="font-heading font-bold text-foreground">Consent and privacy</h2><p className="mt-1 text-sm leading-6 text-muted">Your intake is stored securely. It is shared with the doctor linked to this appointment only after you submit and consent. Sharing access expires automatically after 7 days, and you can revoke it anytime.</p></div></div>
				<label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4"><input type="checkbox" checked={consentGiven} onChange={(event) => setConsentGiven(event.target.checked)} className="mt-1 size-4 accent-primary" /><span className="text-sm text-foreground">I consent to share this clinical intake, including my symptoms, medicines and uploaded health context, with my selected doctor for care.</span></label>
				<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs text-muted"><Clock3 className="size-4" /> Unsubmitted drafts expire after 30 minutes of server inactivity.</div><div className="flex flex-col gap-3 sm:flex-row"><Button type="button" variant="outline" onClick={() => void submit(false)} loading={saving} disabled={sessionExpired && Boolean(activeIntake?.status === "SUBMITTED")}><Save className="size-4" /> Save draft</Button><Button type="button" variant="primary" onClick={() => void submit(true)} loading={saving} disabled={saving || !consentGiven}><CheckCircle2 className="size-4" /> Submit for doctor</Button></div></div>
				{sessionExpired && <p role="alert" className="mt-3 text-sm font-semibold text-amber-700">This draft session expired. Saving again will start a fresh secure session.</p>}
				{activeIntake?.consentGrantedAt && !activeIntake.consentRevokedAt && <button type="button" onClick={() => void revokeConsent()} className="mt-4 text-sm font-semibold text-destructive underline underline-offset-2">Revoke doctor sharing consent</button>}
			</section>

			{activeIntake?.summaryDraft && <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6"><div className="flex items-center gap-2"><Sparkles className="size-5 text-emerald-600" /><h2 className="font-heading font-bold text-foreground">Your doctor-facing draft</h2></div><p className="mt-1 text-xs text-muted">This is an AI-assisted summary of what you entered. Your doctor will review it before using it clinically.</p><div className="mt-4 whitespace-pre-line rounded-xl border border-emerald-200 bg-surface p-4 text-sm leading-6 text-foreground">{activeIntake.summaryEdited || activeIntake.summaryDraft}</div></section>}

			{timelineLoading ? <div className="flex justify-center py-8"><Spinner className="text-primary" /></div> : <Timeline entries={timelineData?.timeline ?? []} />}
			{intakeLoading && <p className="text-center text-xs text-muted">Loading your saved intake…</p>}
		</div>
	);
}

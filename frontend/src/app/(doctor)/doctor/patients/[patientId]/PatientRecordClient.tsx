"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle, FileText, HeartPulse, Pill, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { issueDoctorPrescription, runPrePrescriptionCheck, updateClinicalSummary, usePatientRecord } from "@/hooks/useDoctorPortal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastProvider";
import { useEffect, useState } from "react";

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));

export function PatientRecordClient({ patientId }: { patientId: string }) {
	const { data, isLoading, error, mutate } = usePatientRecord(patientId);
	const { addToast } = useToast();
	const [proposedMedicines, setProposedMedicines] = useState("");
	const [checkId, setCheckId] = useState<string | null>(null);
	const [diagnosis, setDiagnosis] = useState("");
	const [instructions, setInstructions] = useState("");
	const [medicineDetails, setMedicineDetails] = useState<
		Record<string, { dosage: string; frequency: string; duration: string; instructions: string }>
	>({});
	const [checkResult, setCheckResult] = useState<{
		proposedMedicines: string[];
		severity: string;
		riskScore: number;
		tabs: Array<{ title: string; content: string }>;
	} | null>(null);
	const [checking, setChecking] = useState(false);
	const [issuing, setIssuing] = useState(false);
	const [clinicalSummary, setClinicalSummary] = useState("");
	const [savingClinicalSummary, setSavingClinicalSummary] = useState(false);

	useEffect(() => {
		if (!data?.clinicalIntake) return;
		setClinicalSummary(data.clinicalIntake.summaryEdited || data.clinicalIntake.summaryDraft || "");
	}, [data?.clinicalIntake]);

	if (isLoading)
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner size="lg" className="text-primary" />
			</div>
		);
	if (error || !data)
		return (
			<div className="mx-auto max-w-3xl px-4 py-10 text-center">
				<p className="font-semibold text-foreground">Patient record is unavailable</p>
				<p className="mt-2 text-sm text-muted">Access may have expired or been revoked.</p>
				<Link
					href="/doctor/patients"
					className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
				>
					Back to patients
				</Link>
			</div>
		);

	const { patient, healthProfile } = data;
	const runCheck = async () => {
		const medicines = proposedMedicines
			.split(",")
			.map((medicine) => medicine.trim())
			.filter(Boolean);
		if (medicines.length === 0) return addToast("error", "Enter at least one proposed medicine");
		if (!data.appointmentId) return addToast("error", "This patient record is not linked to an appointment");
		setChecking(true);
		try {
			const result = await runPrePrescriptionCheck(patientId, {
				appointmentId: data.appointmentId,
				proposedMedicines: medicines,
			});
			setCheckId(result.checkId);
			setCheckResult({ ...result.interactionResult, proposedMedicines: result.proposedMedicines });
			setMedicineDetails(
				Object.fromEntries(
					result.proposedMedicines.map((medicine) => [
						medicine,
						{ dosage: "", frequency: "", duration: "", instructions: "" },
					]),
				),
			);
			addToast("success", "Pre-prescription safety check completed");
		} catch (error) {
			addToast("error", error instanceof Error ? error.message : "Could not complete safety check");
		} finally {
			setChecking(false);
		}
	};
	const issuePrescription = async () => {
		if (!data.appointmentId || !checkId || !checkResult) {
			return addToast("error", "Complete the safety check before issuing a prescription");
		}
		setIssuing(true);
		try {
			await issueDoctorPrescription(patientId, {
				appointmentId: data.appointmentId,
				preCheckId: checkId,
				diagnosis: diagnosis || undefined,
				instructions: instructions || undefined,
				medicines: checkResult.proposedMedicines.map((name) => ({ name, ...medicineDetails[name] })),
			});
			await mutate();
			setCheckId(null);
			setCheckResult(null);
			setProposedMedicines("");
			setDiagnosis("");
			setInstructions("");
			addToast("success", "Prescription issued and added to the patient record");
		} catch (error) {
			addToast("error", error instanceof Error ? error.message : "Could not issue prescription");
		} finally {
			setIssuing(false);
		}
	};
	return (
		<div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
			<Link
				href="/doctor/patients"
				className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary"
			>
				<ArrowLeft className="size-4" /> Back to patients
			</Link>
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<div className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
						{patient.name?.charAt(0).toUpperCase() ?? "P"}
					</div>
					<div>
						<p className="text-sm font-semibold text-primary">Authorized patient record</p>
						<h1 className="font-heading text-2xl font-bold text-foreground">
							{patient.name ?? "Patient"}
						</h1>
						<p className="text-sm text-muted">
							{patient.email} · {patient.gender ?? "Gender not provided"}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
					<ShieldCheck className="size-5" /> Access verified
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					icon={HeartPulse}
					label="Health risk score"
					value={String(healthProfile?.healthRiskScore ?? 0)}
				/>
				<SummaryCard
					icon={Pill}
					label="Known conditions"
					value={String(healthProfile?.chronicConditions.length ?? 0)}
				/>
				<SummaryCard
					icon={ShieldCheck}
					label="Allergies recorded"
					value={String(healthProfile?.allergies.length ?? 0)}
				/>
				<SummaryCard icon={FileText} label="Lab reports" value={String(data.labReports.length)} />
			</div>

			{data.clinicalIntake && (
				<section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card sm:p-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex items-start gap-3">
							<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Sparkles className="size-5" />
							</div>
							<div>
								<h2 className="font-heading text-lg font-bold text-foreground">Pre-consultation clinical summary</h2>
								<p className="mt-1 text-sm text-muted">Patient consented to share this intake. Review and edit the AI-assisted draft before consultation.</p>
							</div>
						</div>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800">
							<ShieldCheck className="size-3.5" /> Consent active
						</span>
					</div>
					{data.clinicalIntake.triageLevel !== "ROUTINE" && (
						<div role="alert" className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${data.clinicalIntake.triageLevel === "EMERGENCY" ? "border-red-300 bg-red-50 text-red-950" : "border-amber-300 bg-amber-50 text-amber-950"}`}>
							<AlertTriangle className="mt-0.5 size-5 shrink-0" />
							<div><p className="font-semibold">{data.clinicalIntake.triageLevel} triage flag</p><p className="mt-1 text-sm">{data.clinicalIntake.triageMessage}</p>{data.clinicalIntake.triageReasons.length > 0 && <p className="mt-1 text-xs">Signals: {data.clinicalIntake.triageReasons.join("; ")}</p>}</div>
						</div>
					)}
					<div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
						<div className="rounded-xl border border-border bg-surface p-4">
							<p className="text-xs font-bold uppercase tracking-wider text-muted">Patient input</p>
							<p className="mt-2 text-sm font-semibold text-foreground">{data.clinicalIntake.chiefComplaint}</p>
							<p className="mt-3 text-xs text-muted">Submitted {data.clinicalIntake.submittedAt ? formatDate(data.clinicalIntake.submittedAt) : "before consultation"}</p>
							<p className="mt-2 text-xs text-muted">Shared access expires {formatDate(data.clinicalIntake.expiresAt)}</p>
						</div>
						<div>
							<label htmlFor="clinical-summary" className="text-sm font-semibold text-foreground">Editable clinical summary</label>
							<textarea id="clinical-summary" value={clinicalSummary} onChange={(event) => setClinicalSummary(event.target.value)} rows={8} className="mt-2 w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm leading-6 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
							<div className="mt-3 flex justify-end">
								<button type="button" disabled={savingClinicalSummary || clinicalSummary.trim().length < 20} onClick={async () => { setSavingClinicalSummary(true); try { await updateClinicalSummary(patientId, data.clinicalIntake!.id, clinicalSummary); await mutate(); addToast("success", "Clinical summary saved"); } catch (error) { addToast("error", error instanceof Error ? error.message : "Could not save summary"); } finally { setSavingClinicalSummary(false); } }} className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
									{savingClinicalSummary ? <Spinner size="sm" /> : "Save reviewed summary"}
								</button>
							</div>
						</div>
					</div>
				</section>
			)}

			<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
				<section className="space-y-6">
					<section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card">
						<h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
							<Pill className="size-5 text-primary" />
							Pre-prescription safety check
						</h2>
						<p className="mt-1 text-sm text-muted">
							Check proposed medicines against the patient&apos;s recorded medicines before issuing
							a prescription.
						</p>
						<div className="mt-4 flex flex-col gap-3 sm:flex-row">
							<label htmlFor="proposed-medicines" className="sr-only">
								Proposed medicines
							</label>
							<input
								id="proposed-medicines"
								value={proposedMedicines}
								onChange={(event) => setProposedMedicines(event.target.value)}
								placeholder="Medicine names, comma separated"
								className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
							/>
							<button
								type="button"
								onClick={() => void runCheck()}
								disabled={checking}
								className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
							>
								{checking ? <Spinner size="sm" /> : "Run safety check"}
							</button>
						</div>
						{checkResult && (
							<div className="mt-4 rounded-xl border border-border bg-surface p-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="font-semibold text-foreground">
										Risk: <span className="uppercase text-primary">{checkResult.severity}</span>
									</p>
									<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
										Score {checkResult.riskScore}/100
									</span>
								</div>
								<div className="mt-3 space-y-3">
									{checkResult.tabs.map((tab) => (
										<div key={tab.title}>
											<p className="text-sm font-semibold text-foreground">{tab.title}</p>
											<p className="mt-1 whitespace-pre-line text-sm text-muted">{tab.content}</p>
										</div>
									))}
								</div>
								<div className="mt-5 border-t border-border pt-4">
									<p className="text-sm font-semibold text-foreground">Issue prescription</p>
									<p className="mt-1 text-xs text-muted">
										Medicines below are locked to the completed safety check for this appointment.
									</p>
									<div className="mt-3 space-y-3">
										{checkResult.proposedMedicines.map((medicine) => (
											<div key={medicine} className="rounded-lg border border-border p-3">
												<p className="text-sm font-semibold text-foreground">{medicine}</p>
												<div className="mt-2 grid gap-2 sm:grid-cols-3">
													{(["dosage", "frequency", "duration"] as const).map((field) => (
														<input
															key={field}
															value={medicineDetails[medicine]?.[field] ?? ""}
															onChange={(event) =>
																setMedicineDetails((current) => ({
																	...current,
																	[medicine]: { ...current[medicine], [field]: event.target.value },
																}))
															}
															placeholder={field[0].toUpperCase() + field.slice(1)}
															className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
														/>
														))}
												</div>
												<input
													value={medicineDetails[medicine]?.instructions ?? ""}
												onChange={(event) =>
													setMedicineDetails((current) => ({
														...current,
														[medicine]: { ...current[medicine], instructions: event.target.value },
													}))
												}
												placeholder="Medicine instructions (optional)"
												className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
											/>
											</div>
										))}
									</div>
									<div className="mt-3 grid gap-2 sm:grid-cols-2">
										<input
											value={diagnosis}
											onChange={(event) => setDiagnosis(event.target.value)}
											placeholder="Diagnosis (optional)"
											className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
										/>
										<input
											value={instructions}
											onChange={(event) => setInstructions(event.target.value)}
											placeholder="Follow-up instructions (optional)"
											className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
										/>
									</div>
									<button
										type="button"
										onClick={() => void issuePrescription()}
										disabled={issuing}
										className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white disabled:opacity-50"
									>
										{issuing ? <Spinner size="sm" /> : "Issue prescription"}
									</button>
								</div>
							</div>
						)}
					</section>
					<RecordSection title="Clinical context" icon={Stethoscope}>
						<div className="grid gap-4 sm:grid-cols-2">
							<Info label="Blood group" value={healthProfile?.bloodGroup ?? "Not recorded"} />
							<Info
								label="Chronic conditions"
								value={healthProfile?.chronicConditions.join(", ") || "None recorded"}
							/>
							<Info
								label="Allergies"
								value={healthProfile?.allergies.join(", ") || "None recorded"}
							/>
							<Info label="Patient since" value={formatDate(patient.createdAt)} />
						</div>
					</RecordSection>
					<RecordSection title="Lab report timeline" icon={FileText}>
						<div className="space-y-3">
							{data.labReports.map((report) => (
								<div key={report.id} className="rounded-xl border border-border p-4">
									<div className="flex flex-col justify-between gap-1 sm:flex-row">
										<p className="font-semibold text-foreground">{report.fileName}</p>
										<span className="text-xs text-muted">{formatDate(report.createdAt)}</span>
									</div>
									<p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
										Risk: {report.overallRisk}
									</p>
									<p className="mt-2 text-sm text-muted">
										{report.components
											.slice(0, 5)
											.map(
												(component) =>
													`${component.componentName}: ${component.observedValue ?? "—"} ${component.unit ?? ""} (${component.status})`,
											)
											.join(" · ") || "No extracted markers"}
									</p>
								</div>
							))}
							{data.labReports.length === 0 && (
								<p className="text-sm text-muted">No lab reports available.</p>
							)}
						</div>
					</RecordSection>
					<RecordSection title="Complete health timeline" icon={FileText}>
						<div className="space-y-3">
							{data.clinicalTimeline.slice(0, 12).map((entry) => (
								<div key={`${entry.sourceType}-${entry.sourceId ?? entry.eventDate}`} className="border-l-2 border-primary/20 pl-4">
									<div className="flex flex-col justify-between gap-1 sm:flex-row">
										<p className="text-sm font-semibold text-foreground">{entry.title}</p>
										<span className="text-xs text-muted">{formatDate(entry.eventDate)}</span>
									</div>
									{entry.summary && <p className="mt-1 text-xs leading-5 text-muted">{entry.summary}</p>}
								</div>
							))}
							{data.clinicalTimeline.length === 0 && <p className="text-sm text-muted">No timeline entries available.</p>}
						</div>
					</RecordSection>
				</section>
				<section className="space-y-6">
					<RecordSection title="Current medication context" icon={Pill}>
						<div className="space-y-3">
							{data.doctorPrescriptions
								.flatMap((prescription) => prescription.medications)
								.slice(0, 10)
								.map((medicine, index) => (
									<div
										key={`${medicine.name}-${index}`}
										className="rounded-xl border border-border p-3"
									>
										<p className="font-semibold text-foreground">{medicine.name}</p>
										<p className="mt-1 text-xs text-muted">
											{[medicine.dosage, medicine.frequency, medicine.duration]
												.filter(Boolean)
												.join(" · ") || "Details not recorded"}
										</p>
									</div>
								))}
							{data.doctorPrescriptions.length === 0 && (
								<p className="text-sm text-muted">
									No doctor prescriptions recorded yet. Previous patient-uploaded prescription
									history is available below.
								</p>
							)}
						</div>
					</RecordSection>
					<RecordSection title="Previous symptoms" icon={HeartPulse}>
						<div className="space-y-3">
							{data.symptomHistory.slice(0, 6).map((entry) => (
								<div key={entry.id} className="rounded-xl border border-border p-3">
									<div className="flex justify-between gap-2">
										<p className="text-sm font-medium text-foreground">
											{entry.symptoms.join(", ")}
										</p>
										<span className="text-xs text-muted">{formatDate(entry.createdAt)}</span>
									</div>
									<p className="mt-1 text-xs text-primary">Urgency: {entry.urgencyLevel}</p>
								</div>
							))}
							{data.symptomHistory.length === 0 && (
								<p className="text-sm text-muted">No symptom history available.</p>
							)}
						</div>
					</RecordSection>
				</section>
			</div>
		</div>
	);
}

function SummaryCard({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof HeartPulse;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
			<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<Icon className="size-5" />
			</div>
			<p className="mt-4 text-2xl font-bold text-foreground">{value}</p>
			<p className="mt-1 text-sm text-muted">{label}</p>
		</div>
	);
}
function RecordSection({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: typeof HeartPulse;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
			<h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
				<Icon className="size-5 text-primary" />
				{title}
			</h2>
			{children}
		</section>
	);
}
function Info({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl bg-background p-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
			<p className="mt-1 text-sm font-medium text-foreground">{value}</p>
		</div>
	);
}

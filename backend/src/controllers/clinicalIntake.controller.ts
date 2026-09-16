import { Request, Response } from "express";
import { ClinicalIntakeStatus, ClinicalTriageLevel } from "../generated/prisma/client";
import prisma from "../db/prisma";
import logger from "../config/logger";
import { requireAuthenticatedUserId } from "../types/auth";
import { handleControllerError } from "../utils/controllerError";
import { generateClinicalIntakeSummary } from "../services/ai/gemini";
import {
	buildFallbackClinicalSummary,
	evaluateTriage,
	extractDocumentDate,
	timelinePreview,
	type HpiInput,
	type RosInput,
} from "../services/clinicalIntake";
import { clinicalIntakeSchema, clinicalSummaryUpdateSchema } from "../validators/clinicalIntake.schema";

const CONSENT_VERSION = "clinical-intake-v1";
const DRAFT_TTL_MS = 30 * 60 * 1000;
const SHARED_INTAKE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const getRouteParam = (req: Request, key: string) => {
	const value = req.params[key];
	return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

const isConsentActive = (intake: { consentGrantedAt: Date | null; consentRevokedAt: Date | null; expiresAt: Date }) =>
	Boolean(intake.consentGrantedAt && !intake.consentRevokedAt && intake.expiresAt > new Date());

const expireIfNeeded = async <T extends { id: string; status: ClinicalIntakeStatus; expiresAt: Date }>(
	intake: T | null
): Promise<T | null> => {
	if (intake && intake.status === ClinicalIntakeStatus.DRAFT && intake.expiresAt <= new Date()) {
		return (await prisma.clinicalIntakeSession.update({
			where: { id: intake.id },
			data: { status: ClinicalIntakeStatus.EXPIRED },
		})) as unknown as T;
	}
	return intake;
};

const verifyAppointment = async (patientId: string, appointmentId: string | null | undefined) => {
	if (!appointmentId) return null;
	const appointment = await prisma.appointment.findFirst({
		where: { id: appointmentId, patientId },
		select: { id: true, status: true, scheduledAt: true },
	});
	if (!appointment) throw new Error("Appointment not found for this patient");
	if (["CANCELLED_BY_PATIENT", "CANCELLED_BY_DOCTOR", "NO_SHOW"].includes(appointment.status)) {
		throw new Error("This appointment is not available for clinical intake");
	}
	return appointment;
};

const buildAiSummary = async (input: {
	chiefComplaint: string;
	hpi: HpiInput;
	ros: RosInput;
	medicationNotes?: string;
	allergyNotes?: string;
}) => {
	try {
		return await generateClinicalIntakeSummary(input);
	} catch {
		return buildFallbackClinicalSummary(input);
	}
};

export const getClinicalIntake = async (req: Request, res: Response) => {
	try {
		const patientId = requireAuthenticatedUserId(req, res);
		if (!patientId) return;
		const appointmentId = typeof req.query.appointmentId === "string" ? req.query.appointmentId : undefined;
		const intake = await expireIfNeeded(
			await prisma.clinicalIntakeSession.findFirst({
				where: appointmentId
					? { patientId, appointmentId }
					: {
							patientId,
							status: {
								in: [
									ClinicalIntakeStatus.DRAFT,
									ClinicalIntakeStatus.SUBMITTED,
									ClinicalIntakeStatus.REVIEWED,
								],
							},
						},
				orderBy: { updatedAt: "desc" },
				include: { appointment: { include: { doctor: true } } },
			})
		);
		return res.json({ intake });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get clinical intake" });
	}
};

export const saveClinicalIntake = async (req: Request, res: Response) => {
	try {
		const patientId = requireAuthenticatedUserId(req, res);
		if (!patientId) return;
		const input = clinicalIntakeSchema.parse(req.body);
		await verifyAppointment(patientId, input.appointmentId);

		const existing = input.appointmentId
			? await prisma.clinicalIntakeSession.findUnique({ where: { appointmentId: input.appointmentId } })
			: await prisma.clinicalIntakeSession.findFirst({
					where: { patientId, status: ClinicalIntakeStatus.DRAFT },
					orderBy: { updatedAt: "desc" },
				});
		const now = new Date();
		const triage = evaluateTriage(input.chiefComplaint, input.hpi, input.ros);
		if (input.submit && !input.consentGiven) {
			return res.status(400).json({ error: "Consent is required before sharing the intake with a doctor" });
		}

		const summary = input.submit
			? await buildAiSummary({
					chiefComplaint: input.chiefComplaint,
					hpi: input.hpi,
					ros: input.ros,
					medicationNotes: input.medicationNotes,
					allergyNotes: input.allergyNotes,
				})
			: (existing?.summaryDraft ?? null);
		const expiresAt = input.submit
			? new Date(now.getTime() + SHARED_INTAKE_TTL_MS)
			: new Date(now.getTime() + DRAFT_TTL_MS);
		const data = {
			patientId,
			appointmentId: input.appointmentId ?? null,
			status: input.submit ? ClinicalIntakeStatus.SUBMITTED : ClinicalIntakeStatus.DRAFT,
			chiefComplaint: input.chiefComplaint,
			hpi: input.hpi,
			ros: input.ros,
			medicationNotes: input.medicationNotes,
			allergyNotes: input.allergyNotes,
			summaryDraft: summary,
			triageLevel: triage.level as ClinicalTriageLevel,
			triageReasons: triage.reasons,
			triageMessage: triage.message,
			consentVersion: input.consentGiven ? CONSENT_VERSION : (existing?.consentVersion ?? null),
			consentGrantedAt: input.consentGiven
				? existing?.consentRevokedAt
					? now
					: (existing?.consentGrantedAt ?? now)
				: null,
			consentRevokedAt: input.consentGiven
				? null
				: existing?.consentGrantedAt
					? now
					: (existing?.consentRevokedAt ?? null),
			expiresAt,
			submittedAt: input.submit ? (existing?.submittedAt ?? now) : (existing?.submittedAt ?? null),
		};

		const intake = existing
			? await prisma.clinicalIntakeSession.update({ where: { id: existing.id }, data })
			: await prisma.clinicalIntakeSession.create({ data });
		return res.status(existing ? 200 : 201).json({ intake });
	} catch (error) {
		if (
			error instanceof Error &&
			[
				"Appointment not found for this patient",
				"This appointment is not available for clinical intake",
			].includes(error.message)
		) {
			return res.status(400).json({ error: error.message });
		}
		handleControllerError({ error, res, logger, context: "Failed to save clinical intake" });
	}
};

export const revokeClinicalIntakeConsent = async (req: Request, res: Response) => {
	try {
		const patientId = requireAuthenticatedUserId(req, res);
		if (!patientId) return;
		const id = getRouteParam(req, "id");
		const intake = await prisma.clinicalIntakeSession.findFirst({ where: { id, patientId } });
		if (!intake) return res.status(404).json({ error: "Clinical intake not found" });
		const updated = await prisma.clinicalIntakeSession.update({
			where: { id },
			data: { consentRevokedAt: new Date() },
		});
		return res.json({ intake: updated });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to revoke clinical intake consent" });
	}
};

export const getClinicalTimeline = async (req: Request, res: Response) => {
	try {
		const patientId = requireAuthenticatedUserId(req, res);
		if (!patientId) return;
		return res.json({ timeline: await buildClinicalTimeline(patientId) });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to build clinical timeline" });
	}
};

export const buildClinicalTimeline = async (patientId: string, doctorProfileId?: string) => {
	const doctorPrescriptionsPromise = prisma.doctorPrescription.findMany({
		where: { patientId, status: "ISSUED", ...(doctorProfileId ? { doctorProfileId } : {}) },
		select: {
			id: true,
			issuedAt: true,
			createdAt: true,
			medications: { select: { name: true, dosage: true } },
		},
		orderBy: { createdAt: "desc" },
	}) as unknown as Promise<
		Array<{
			id: string;
			issuedAt: Date | null;
			createdAt: Date;
			medications: Array<{ name: string; dosage: string | null }>;
		}>
	>;
	const [labReports, prescriptionHistory, medicineHistory, symptomHistory, intakes, storedEntries] =
		await Promise.all([
			prisma.labReport.findMany({
				where: { userId: patientId },
				select: {
					id: true,
					fileName: true,
					extractedText: true,
					overallRisk: true,
					overallSummary: true,
					createdAt: true,
				},
			}),
			prisma.prescriptionHistory.findMany({
				where: { userId: patientId },
				select: { id: true, extractedText: true, createdAt: true },
			}),
			prisma.medicineHistory.findMany({
				where: { userId: patientId },
				select: { id: true, medicineName: true, createdAt: true },
			}),
			prisma.symptomAnalysisHistory.findMany({
				where: { userId: patientId },
				select: { id: true, symptoms: true, urgencyLevel: true, createdAt: true },
			}),
			prisma.clinicalIntakeSession.findMany({
				where: { patientId, status: { in: [ClinicalIntakeStatus.SUBMITTED, ClinicalIntakeStatus.REVIEWED] } },
				select: {
					id: true,
					chiefComplaint: true,
					summaryDraft: true,
					summaryEdited: true,
					triageLevel: true,
					submittedAt: true,
					createdAt: true,
				},
			}),
			prisma.clinicalTimelineEntry.findMany({ where: { patientId }, orderBy: { eventDate: "desc" } }),
		]);
	const doctorPrescriptions = await doctorPrescriptionsPromise;

	const timeline = [
		...labReports.map((report) => ({
			sourceType: "LAB_REPORT",
			sourceId: report.id,
			eventDate: extractDocumentDate(report.extractedText) ?? report.createdAt,
			title: `Lab report: ${report.fileName}`,
			summary: timelinePreview(report.overallSummary) || `Risk: ${report.overallRisk}`,
		})),
		...prescriptionHistory.map((item) => ({
			sourceType: "UPLOADED_PRESCRIPTION",
			sourceId: item.id,
			eventDate: extractDocumentDate(item.extractedText) ?? item.createdAt,
			title: "Uploaded prescription",
			summary: timelinePreview(item.extractedText) || "Prescription document uploaded",
		})),
		...medicineHistory.map((item) => ({
			sourceType: "MEDICINE_ANALYSIS",
			sourceId: item.id,
			eventDate: item.createdAt,
			title: `Medicine analysis: ${item.medicineName || "Unknown medicine"}`,
			summary: "Medicine information was reviewed in Niraksh Guardian",
		})),
		...symptomHistory.map((item) => ({
			sourceType: "SYMPTOM_ANALYSIS",
			sourceId: item.id,
			eventDate: item.createdAt,
			title: `Symptoms: ${item.symptoms.slice(0, 3).join(", ")}`,
			summary: `Urgency: ${item.urgencyLevel}`,
		})),
		...doctorPrescriptions.map((item) => ({
			sourceType: "DOCTOR_PRESCRIPTION",
			sourceId: item.id,
			eventDate: item.issuedAt ?? item.createdAt,
			title: "Prescription issued after consultation",
			summary: item.medications
				.map((medicine) => `${medicine.name}${medicine.dosage ? ` (${medicine.dosage})` : ""}`)
				.join(", "),
		})),
		...intakes.map((item) => ({
			sourceType: "CLINICAL_INTAKE",
			sourceId: item.id,
			eventDate: item.submittedAt ?? item.createdAt,
			title: `Clinical intake: ${item.chiefComplaint || "Visit preparation"}`,
			summary: timelinePreview(item.summaryEdited || item.summaryDraft) || `Triage: ${item.triageLevel}`,
		})),
		...storedEntries.map((entry) => ({
			sourceType: entry.sourceType,
			sourceId: entry.sourceId,
			eventDate: entry.eventDate,
			title: entry.title,
			summary: entry.summary,
		})),
	].sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());

	return timeline;
};

export const findSharedClinicalIntake = async (patientId: string, appointmentId: string | null) => {
	const intake = await prisma.clinicalIntakeSession.findFirst({
		where: {
			patientId,
			status: { in: [ClinicalIntakeStatus.SUBMITTED, ClinicalIntakeStatus.REVIEWED] },
			consentGrantedAt: { not: null },
			consentRevokedAt: null,
			expiresAt: { gt: new Date() },
			...(appointmentId ? { appointmentId } : {}),
		},
		orderBy: { submittedAt: "desc" },
	});
	return intake && isConsentActive(intake) ? intake : null;
};

export const updateClinicalSummary = async (req: Request, res: Response) => {
	try {
		const doctorUserId = requireAuthenticatedUserId(req, res);
		if (!doctorUserId) return;
		const patientId = getRouteParam(req, "patientId");
		const input = clinicalSummaryUpdateSchema.parse({ ...req.body, intakeId: getRouteParam(req, "intakeId") });
		const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		const access = await prisma.patientDoctorAccess.findFirst({
			where: { patientId, doctorProfileId: profile.id, status: "ACTIVE", expiresAt: { gt: new Date() } },
		});
		if (!access) return res.status(403).json({ error: "Patient access is not active" });
		const intake = await prisma.clinicalIntakeSession.findFirst({
			where: {
				id: input.intakeId,
				patientId,
				appointmentId: access.appointmentId,
				status: { in: [ClinicalIntakeStatus.SUBMITTED, ClinicalIntakeStatus.REVIEWED] },
			},
		});
		if (!intake || !isConsentActive(intake))
			return res.status(403).json({ error: "Patient consent for this intake is not active" });
		const updated = await prisma.clinicalIntakeSession.update({
			where: { id: intake.id },
			data: {
				summaryEdited: input.summary,
				status: ClinicalIntakeStatus.REVIEWED,
				reviewedAt: new Date(),
				reviewedByDoctorProfileId: profile.id,
			},
		});
		return res.json({ intake: updated });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to update clinical summary" });
	}
};

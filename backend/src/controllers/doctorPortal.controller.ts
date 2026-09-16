import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";
import { requireAuthenticatedUserId } from "../types/auth";
import {
	doctorOnboardingSchema,
	doctorPrescriptionSchema,
	prePrescriptionCheckSchema,
	replaceAvailabilitySchema,
} from "../validators/appointment.schema";
import { doctorApplicationUpdateSchema } from "../validators/auth.schema";
import logger from "../config/logger";
import { handleControllerError } from "../utils/controllerError";
import { checkDrugInteraction } from "../services/ai/gemini";

const normalizeMedicineNames = (values: string[]) =>
	Array.from(new Map(values.map((value) => [value.trim().toLowerCase(), value.trim()])).values()).filter(Boolean);

const extractPrescriptionMedicines = (value: unknown): string[] => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return [];
	const medicines = (value as { medicines?: unknown }).medicines;
	return Array.isArray(medicines)
		? medicines.filter((medicine): medicine is string => typeof medicine === "string")
		: [];
};

const getDoctorProfile = async (userId: string) =>
	prisma.doctorProfile.findUnique({
		where: { userId },
		include: { directoryDoctor: true, availability: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] } },
	});

const getRouteParam = (req: Request, key: string): string => {
	const value = req.params[key];
	return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

export const getDoctorMe = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;
		const profile = await getDoctorProfile(userId);
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		return res.json({ profile });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get doctor profile" });
	}
};

export const updateDoctorApplication = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;
		const input = doctorApplicationUpdateSchema.parse(req.body);
		const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		if (profile.verificationStatus === "APPROVED") {
			return res.status(400).json({ error: "Approved doctor profiles cannot be edited as applications" });
		}

		const updated = await prisma.$transaction(async (tx) => {
			const result = await tx.doctorProfile.update({
				where: { id: profile.id },
				data: {
					displayName: input.name,
					licenseNumber: input.licenseNumber,
					specialization: input.specialization,
					qualification: input.qualification,
					experienceYears: input.experienceYears,
					consultationFee: input.consultationFee,
					city: input.city,
					state: input.state,
					bio: input.bio,
					contactInfo: input.contactInfo,
					phone: input.phone,
					clinicName: input.clinicName,
					clinicAddress: input.clinicAddress,
					consultationModes: input.consultationModes,
					verificationStatus: "PENDING",
					verificationNote: null,
				},
				include: { directoryDoctor: true },
			});

			if (profile.directoryDoctorId) {
				await tx.doctor.update({
					where: { id: profile.directoryDoctorId },
					data: {
						name: input.name,
						specialization: input.specialization,
						qualification: input.qualification,
						experienceYears: input.experienceYears,
						consultationFee: input.consultationFee,
						city: input.city,
						state: input.state,
						bio: input.bio,
						contactInfo: input.contactInfo,
						phone: input.phone,
						tags: [input.specialization],
						isAvailable: false,
					},
				});
			}

			return result;
		});
		return res.json({ profile: updated });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to update doctor application" });
	}
};

export const onboardDoctor = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;
		const input = doctorOnboardingSchema.parse(req.body);
		const directoryDoctor = await prisma.doctor.findUnique({ where: { id: input.directoryDoctorId } });
		if (!directoryDoctor) return res.status(404).json({ error: "Directory doctor not found" });
		const existing = await prisma.doctorProfile.findFirst({
			where: {
				OR: [
					{ userId },
					{ directoryDoctorId: input.directoryDoctorId },
					{ licenseNumber: input.licenseNumber },
				],
			},
		});
		if (existing) return res.status(409).json({ error: "Doctor profile already exists or is already linked" });
		const profile = await prisma.doctorProfile.create({
			data: {
				userId,
				directoryDoctorId: input.directoryDoctorId,
				licenseNumber: input.licenseNumber,
				clinicName: input.clinicName,
				clinicAddress: input.clinicAddress,
				consultationModes: input.consultationModes,
			},
			include: { directoryDoctor: true },
		});
		return res.status(201).json({ profile });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to onboard doctor" });
	}
};

export const getDoctorAppointments = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;
		const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		const appointments = await prisma.appointment.findMany({
			where: { doctorProfileId: profile.id },
			include: {
				patient: { select: { id: true, name: true, email: true, gender: true } },
				prescription: { include: { medications: true } },
			},
			orderBy: { scheduledAt: "asc" },
		});
		return res.json({ appointments });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get doctor appointments" });
	}
};

export const getDoctorPatients = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;
		const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		const grants = await prisma.patientDoctorAccess.findMany({
			where: { doctorProfileId: profile.id, status: "ACTIVE", expiresAt: { gt: new Date() } },
			select: { patientId: true, expiresAt: true, grantedAt: true },
			orderBy: { grantedAt: "desc" },
		});
		const patientIds = Array.from(new Set(grants.map((grant) => grant.patientId)));
		const patients = await prisma.user.findMany({
			where: { id: { in: patientIds } },
			select: {
				id: true,
				name: true,
				email: true,
				gender: true,
				patientHealthProfile: { select: { bloodGroup: true, allergies: true, chronicConditions: true } },
			},
		});
		const patientById = new Map(patients.map((patient) => [patient.id, patient]));
		const uniquePatients = patientIds
			.map((patientId) => ({
				patient: patientById.get(patientId),
				expiresAt: grants.find((grant) => grant.patientId === patientId)?.expiresAt,
				grantedAt: grants.find((grant) => grant.patientId === patientId)?.grantedAt,
			}))
			.filter((entry) => entry.patient);
		return res.json({ patients: uniquePatients });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get doctor patients" });
	}
};

export const getPatientRecord = async (req: Request, res: Response) => {
	try {
		const doctorUserId = requireAuthenticatedUserId(req, res);
		if (!doctorUserId) return;
		const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		const patientId = getRouteParam(req, "patientId");
		const access = await prisma.patientDoctorAccess.findFirst({
			where: { patientId, doctorProfileId: profile.id, status: "ACTIVE", expiresAt: { gt: new Date() } },
		});
		if (!access) return res.status(403).json({ error: "Patient access is not active" });

		const [
			patient,
			healthProfile,
			labReports,
			prescriptionHistory,
			medicineHistory,
			symptomHistory,
			doctorPrescriptions,
		] = await Promise.all([
			prisma.user.findUnique({
				select: { id: true, name: true, email: true, gender: true, createdAt: true },
				where: { id: patientId },
			}),
			prisma.patientHealthProfile.findUnique({ where: { userId: patientId } }),
			prisma.labReport.findMany({
				where: { userId: patientId },
				include: { components: true },
				orderBy: { createdAt: "desc" },
				take: 20,
			}),
			prisma.prescriptionHistory.findMany({
				where: { userId: patientId },
				orderBy: { createdAt: "desc" },
				take: 20,
			}),
			prisma.medicineHistory.findMany({ where: { userId: patientId }, orderBy: { createdAt: "desc" }, take: 20 }),
			prisma.symptomAnalysisHistory.findMany({
				where: { userId: patientId },
				orderBy: { createdAt: "desc" },
				take: 20,
			}),
			prisma.doctorPrescription.findMany({
				where: { patientId, doctorProfileId: profile.id },
				include: { medications: true },
				orderBy: { createdAt: "desc" },
				take: 20,
			}),
		]);

		if (!patient) return res.status(404).json({ error: "Patient not found" });
		return res.json({
			appointmentId: access.appointmentId,
			patient,
			healthProfile,
			labReports,
			prescriptionHistory,
			medicineHistory,
			symptomHistory,
			doctorPrescriptions,
		});
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get patient health record" });
	}
};

export const getDoctorAvailability = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;
		const profile = await prisma.doctorProfile.findUnique({ where: { userId }, include: { availability: true } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		return res.json({ availability: profile.availability });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get doctor availability" });
	}
};

export const replaceDoctorAvailability = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;
		const { slots } = replaceAvailabilitySchema.parse(req.body);
		const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		const availability = await prisma.$transaction(async (tx) => {
			await tx.doctorAvailability.deleteMany({ where: { doctorProfileId: profile.id } });
			if (slots.length === 0) return [];
			await tx.doctorAvailability.createMany({
				data: slots.map((slot) => ({ ...slot, doctorProfileId: profile.id })),
			});
			return tx.doctorAvailability.findMany({
				where: { doctorProfileId: profile.id },
				orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
			});
		});
		return res.json({ availability });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to update doctor availability" });
	}
};

export const runPrePrescriptionCheck = async (req: Request, res: Response) => {
	try {
		const doctorUserId = requireAuthenticatedUserId(req, res);
		if (!doctorUserId) return;
		const { proposedMedicines, appointmentId } = prePrescriptionCheckSchema.parse(req.body);
		const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		const patientId = getRouteParam(req, "patientId");
		const access = await prisma.patientDoctorAccess.findFirst({
			where: { patientId, doctorProfileId: profile.id, status: "ACTIVE", expiresAt: { gt: new Date() } },
		});
		if (!access) return res.status(403).json({ error: "Patient access is not active" });
		if (appointmentId && access.appointmentId && appointmentId !== access.appointmentId) {
			return res.status(403).json({ error: "This appointment does not grant access to the patient record" });
		}
		if (appointmentId) {
			const appointment = await prisma.appointment.findFirst({
				where: {
					id: appointmentId,
					patientId,
					doctorProfileId: profile.id,
					status: { in: ["CONFIRMED", "RESCHEDULED", "COMPLETED"] },
				},
			});
			if (!appointment)
				return res.status(403).json({ error: "Appointment is not valid for this patient record" });
		}

		const [issuedPrescriptions, uploadedPrescriptions] = await Promise.all([
			prisma.doctorPrescription.findMany({
				where: { patientId, status: "ISSUED" },
				select: { id: true },
			}),
			prisma.prescriptionHistory.findMany({
				where: { userId: patientId },
				select: { analysisResult: true, extractedText: true },
				take: 20,
				orderBy: { createdAt: "desc" },
			}),
		]);
		const issuedPrescriptionIds = issuedPrescriptions.map((prescription) => prescription.id);
		const issuedMedicines = issuedPrescriptionIds.length
			? await prisma.doctorPrescriptionMedicine.findMany({
					where: { prescriptionId: { in: issuedPrescriptionIds } },
					select: { name: true },
				})
			: [];
		const currentMedicines = normalizeMedicineNames([
			...issuedMedicines.map((medicine) => medicine.name),
			...uploadedPrescriptions.flatMap((prescription) => {
				const extracted = extractPrescriptionMedicines(prescription.analysisResult);
				return extracted.length > 0 ? extracted : prescription.extractedText.split(",");
			}),
		]);
		const proposed = normalizeMedicineNames(proposedMedicines);
		const interactionResult = await checkDrugInteraction(
			normalizeMedicineNames([...currentMedicines, ...proposed])
		);
		const check = await prisma.prePrescriptionCheck.create({
			data: {
				appointmentId: appointmentId ?? access.appointmentId,
				patientId,
				doctorProfileId: profile.id,
				proposedMedicines: proposed,
				currentMedicines,
				interactionResult,
			},
		});
		return res.json({
			check,
			checkId: check.id,
			currentMedicines,
			proposedMedicines: proposed,
			interactionResult,
		});
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to run pre-prescription check" });
	}
};

export const issueDoctorPrescription = async (req: Request, res: Response) => {
	try {
		const doctorUserId = requireAuthenticatedUserId(req, res);
		if (!doctorUserId) return;
		const input = doctorPrescriptionSchema.parse(req.body);
		const patientId = getRouteParam(req, "patientId");
		const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });

		const access = await prisma.patientDoctorAccess.findFirst({
			where: {
				patientId,
				doctorProfileId: profile.id,
				appointmentId: input.appointmentId,
				status: "ACTIVE",
				expiresAt: { gt: new Date() },
			},
		});
		if (!access) return res.status(403).json({ error: "This appointment does not grant active patient access" });

		const appointment = await prisma.appointment.findFirst({
			where: {
				id: input.appointmentId,
				patientId,
				doctorProfileId: profile.id,
				status: { in: ["CONFIRMED", "RESCHEDULED", "COMPLETED"] },
			},
		});
		if (!appointment) return res.status(403).json({ error: "Appointment is not valid for this prescription" });

		const preCheck = await prisma.prePrescriptionCheck.findFirst({
			where: {
				id: input.preCheckId,
				appointmentId: input.appointmentId,
				patientId,
				doctorProfileId: profile.id,
			},
		});
		if (!preCheck) return res.status(400).json({ error: "Run the safety check for this appointment first" });

		const checkedMedicines = new Set(preCheck.proposedMedicines.map((medicine) => medicine.trim().toLowerCase()));
		const requestedMedicines = normalizeMedicineNames(input.medicines.map((medicine) => medicine.name)).map(
			(medicine) => medicine.toLowerCase()
		);
		if (
			checkedMedicines.size !== requestedMedicines.length ||
			requestedMedicines.some((medicine) => !checkedMedicines.has(medicine))
		) {
			return res.status(400).json({ error: "Prescription medicines must match the completed safety check" });
		}

		const prescription = await prisma.$transaction(async (tx) => {
			const created = await tx.doctorPrescription.create({
				data: {
					appointmentId: appointment.id,
					patientId,
					doctorProfileId: profile.id,
					diagnosis: input.diagnosis,
					instructions: input.instructions,
					status: "ISSUED",
					issuedAt: new Date(),
					medications: {
						create: input.medicines.map((medicine) => ({ ...medicine })),
					},
				},
				include: { medications: true },
			});
			await tx.prePrescriptionCheck.update({ where: { id: preCheck.id }, data: { acknowledgedAt: new Date() } });
			return created;
		});
		return res.status(201).json({ prescription });
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return res.status(409).json({ error: "A prescription has already been issued for this appointment" });
		}
		handleControllerError({ error, res, logger, context: "Failed to issue doctor prescription" });
	}
};

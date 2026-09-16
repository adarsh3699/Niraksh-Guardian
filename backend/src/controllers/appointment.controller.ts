import { Request, Response } from "express";
import { AppointmentStatus, ConsultationMode, Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";
import { requireAuthenticatedUserId } from "../types/auth";
import {
	appointmentDateSchema,
	appointmentStatusSchema,
	createAppointmentSchema,
} from "../validators/appointment.schema";
import logger from "../config/logger";
import { handleControllerError } from "../utils/controllerError";

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
	AppointmentStatus.REQUESTED,
	AppointmentStatus.CONFIRMED,
	AppointmentStatus.RESCHEDULED,
];

// Availability is entered as India-local clinic time throughout the product.
const INDIA_TIMEZONE_OFFSET_MINUTES = 330;
const INDIA_TIMEZONE_OFFSET_MS = INDIA_TIMEZONE_OFFSET_MINUTES * 60 * 1000;

const getRouteParam = (req: Request, key: string): string => {
	const value = req.params[key];
	return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

const getApprovedDoctor = async (directoryDoctorId: string) => {
	const profile = await prisma.doctorProfile.findFirst({
		where: { directoryDoctorId, verificationStatus: "APPROVED" },
	});
	if (!profile) return null;

	const [directoryDoctor, availability] = await Promise.all([
		prisma.doctor.findUnique({ where: { id: directoryDoctorId } }),
		prisma.doctorAvailability.findMany({ where: { doctorProfileId: profile.id } }),
	]);

	return { ...profile, directoryDoctor, availability };
};

const getIndiaDayBounds = (date: string) => {
	const calendarDay = new Date(`${date}T00:00:00.000Z`);
	if (Number.isNaN(calendarDay.getTime())) return null;
	const dayStart = new Date(calendarDay.getTime() - INDIA_TIMEZONE_OFFSET_MS);
	const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
	return { calendarDay, dayStart, dayEnd };
};

const getIndiaTimeInMinutes = (date: Date) => {
	const indiaTime = new Date(date.getTime() + INDIA_TIMEZONE_OFFSET_MS);
	return indiaTime.getUTCHours() * 60 + indiaTime.getUTCMinutes();
};

const parseTime = (value: string) => {
	const [hours, minutes] = value.split(":").map(Number);
	return hours * 60 + minutes;
};

export const getDoctorSlots = async (req: Request, res: Response) => {
	try {
		const doctorId = getRouteParam(req, "doctorId");
		const { date } = appointmentDateSchema.parse(req.query);
		const doctor = await getApprovedDoctor(doctorId);

		if (!doctor || !doctor.directoryDoctor || !doctor.directoryDoctor.isAvailable) {
			return res.status(404).json({ error: "This doctor is not accepting appointments yet" });
		}

		const dayBounds = getIndiaDayBounds(date);
		if (!dayBounds) return res.status(400).json({ error: "Invalid appointment date" });
		const { calendarDay, dayStart, dayEnd } = dayBounds;
		const weekday = calendarDay.getUTCDay();
		const availability = doctor.availability.filter((slot) => slot.isActive && slot.weekday === weekday);
		const appointments = await prisma.appointment.findMany({
			where: {
				doctorId,
				scheduledAt: { gte: dayStart, lt: dayEnd },
				status: { in: ACTIVE_APPOINTMENT_STATUSES },
			},
			select: { scheduledAt: true },
		});

		const booked = new Set(appointments.map((appointment) => appointment.scheduledAt.toISOString()));
		const slots: string[] = [];

		for (const window of availability) {
			const start = parseTime(window.startTime);
			const end = parseTime(window.endTime);
			for (let minute = start; minute + window.slotDurationMinutes <= end; minute += window.slotDurationMinutes) {
				const slot = new Date(dayStart.getTime() + minute * 60 * 1000);
				if (slot > new Date() && !booked.has(slot.toISOString())) slots.push(slot.toISOString());
			}
		}

		return res.json({
			doctor: {
				id: doctor.directoryDoctor.id,
				name: doctor.directoryDoctor.name,
				consultationModes: doctor.consultationModes,
			},
			date,
			slots: Array.from(new Set(slots)).sort(),
		});
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get doctor appointment slots" });
	}
};

export const createAppointment = async (req: Request, res: Response) => {
	try {
		const patientId = requireAuthenticatedUserId(req, res);
		if (!patientId) return;
		const input = createAppointmentSchema.parse(req.body);

		if (input.scheduledAt <= new Date()) {
			return res.status(400).json({ error: "Appointments must be booked in the future" });
		}

		const doctor = await getApprovedDoctor(input.doctorId);
		if (!doctor || !doctor.directoryDoctor || !doctor.directoryDoctor.isAvailable) {
			return res.status(404).json({ error: "This doctor is not accepting appointments yet" });
		}
		if (!doctor.consultationModes.includes(input.mode as ConsultationMode)) {
			return res.status(400).json({ error: "This consultation mode is not available for the doctor" });
		}

		const indiaTime = new Date(input.scheduledAt.getTime() + INDIA_TIMEZONE_OFFSET_MS);
		const weekday = indiaTime.getUTCDay();
		const time = getIndiaTimeInMinutes(input.scheduledAt);
		const availability = doctor.availability.find((slot) => {
			const start = parseTime(slot.startTime);
			const end = parseTime(slot.endTime);
			return (
				slot.isActive &&
				slot.weekday === weekday &&
				time >= start &&
				time + slot.slotDurationMinutes <= end &&
				(time - start) % slot.slotDurationMinutes === 0
			);
		});
		if (!availability) return res.status(400).json({ error: "Selected time is outside the doctor's availability" });

		const existing = await prisma.appointment.findFirst({
			where: {
				doctorId: input.doctorId,
				scheduledAt: input.scheduledAt,
				status: { in: ACTIVE_APPOINTMENT_STATUSES },
			},
		});
		if (existing) return res.status(409).json({ error: "This appointment slot is no longer available" });

		const appointment = await prisma.$transaction(async (tx) => {
			const created = await tx.appointment.create({
				data: {
					patientId,
					doctorId: input.doctorId,
					doctorProfileId: doctor.id,
					scheduledAt: input.scheduledAt,
					mode: input.mode,
					reason: input.reason,
					patientNote: input.patientNote,
					status: AppointmentStatus.REQUESTED,
				},
				include: { doctor: true },
			});
			return created;
		});

		return res.status(201).json({ appointment });
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return res.status(409).json({ error: "This appointment slot is no longer available" });
		}
		handleControllerError({ error, res, logger, context: "Failed to create appointment" });
	}
};

export const getMyAppointments = async (req: Request, res: Response) => {
	try {
		const patientId = requireAuthenticatedUserId(req, res);
		if (!patientId) return;
		const appointments = await prisma.appointment.findMany({
			where: { patientId },
			include: { doctor: true, prescription: { include: { medications: true } } },
			orderBy: { scheduledAt: "asc" },
		});
		return res.json({ appointments });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get patient appointments" });
	}
};

export const cancelMyAppointment = async (req: Request, res: Response) => {
	try {
		const patientId = requireAuthenticatedUserId(req, res);
		if (!patientId) return;
		const appointment = await prisma.appointment.findFirst({ where: { id: getRouteParam(req, "id"), patientId } });
		if (!appointment) return res.status(404).json({ error: "Appointment not found" });
		if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)) {
			return res.status(400).json({ error: "This appointment cannot be cancelled" });
		}
		const updated = await prisma.appointment.update({
			where: { id: appointment.id },
			data: { status: AppointmentStatus.CANCELLED_BY_PATIENT },
		});
		await prisma.patientDoctorAccess.updateMany({
			where: { appointmentId: appointment.id, status: "ACTIVE" },
			data: { status: "REVOKED", revokedAt: new Date() },
		});
		return res.json({ appointment: updated });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to cancel appointment" });
	}
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
	try {
		const doctorUserId = requireAuthenticatedUserId(req, res);
		if (!doctorUserId) return;
		const input = appointmentStatusSchema.parse(req.body);
		const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
		if (!profile) return res.status(404).json({ error: "Doctor profile not found" });
		const appointment = await prisma.appointment.findFirst({
			where: { id: getRouteParam(req, "id"), doctorProfileId: profile.id },
		});
		if (!appointment) return res.status(404).json({ error: "Appointment not found" });

		const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
			[AppointmentStatus.REQUESTED]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED_BY_DOCTOR],
			[AppointmentStatus.CONFIRMED]: [
				AppointmentStatus.RESCHEDULED,
				AppointmentStatus.COMPLETED,
				AppointmentStatus.CANCELLED_BY_DOCTOR,
				AppointmentStatus.NO_SHOW,
			],
			[AppointmentStatus.RESCHEDULED]: [
				AppointmentStatus.CONFIRMED,
				AppointmentStatus.COMPLETED,
				AppointmentStatus.CANCELLED_BY_DOCTOR,
				AppointmentStatus.NO_SHOW,
			],
			[AppointmentStatus.CANCELLED_BY_PATIENT]: [],
			[AppointmentStatus.CANCELLED_BY_DOCTOR]: [],
			[AppointmentStatus.COMPLETED]: [],
			[AppointmentStatus.NO_SHOW]: [],
		};
		if (!allowedTransitions[appointment.status].includes(input.status)) {
			return res.status(400).json({ error: `Cannot change ${appointment.status} to ${input.status}` });
		}

		const updated = await prisma.$transaction(async (tx) => {
			const result = await tx.appointment.update({
				where: { id: appointment.id },
				data: { status: input.status, doctorNote: input.doctorNote },
			});

			if (input.status === AppointmentStatus.CONFIRMED) {
				await tx.patientDoctorAccess.upsert({
					where: { appointmentId: appointment.id },
					create: {
						patientId: appointment.patientId,
						doctorProfileId: appointment.doctorProfileId,
						appointmentId: appointment.id,
						expiresAt: new Date(appointment.scheduledAt.getTime() + 7 * 24 * 60 * 60 * 1000),
					},
					update: {
						status: "ACTIVE",
						revokedAt: null,
						expiresAt: new Date(appointment.scheduledAt.getTime() + 7 * 24 * 60 * 60 * 1000),
					},
				});
			} else if (input.status === AppointmentStatus.CANCELLED_BY_DOCTOR) {
				await tx.patientDoctorAccess.updateMany({
					where: { appointmentId: appointment.id, status: "ACTIVE" },
					data: { status: "REVOKED", revokedAt: new Date() },
				});
			}

			return result;
		});
		return res.json({ appointment: updated });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to update doctor appointment" });
	}
};

import { z } from "zod";

const isoDate = z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), "Invalid date");

export const createAppointmentSchema = z.object({
	doctorId: z.string().uuid(),
	scheduledAt: isoDate,
	mode: z.enum(["IN_PERSON", "VIDEO", "PHONE"]).default("IN_PERSON"),
	reason: z.string().trim().max(1000).optional(),
	patientNote: z.string().trim().max(2000).optional(),
});

export const appointmentDateSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"),
});

export const appointmentStatusSchema = z.object({
	status: z.enum(["CONFIRMED", "RESCHEDULED", "CANCELLED_BY_DOCTOR", "COMPLETED", "NO_SHOW"]),
	doctorNote: z.string().trim().max(2000).optional(),
});

export const doctorAvailabilitySchema = z
	.object({
		weekday: z.number().int().min(0).max(6),
		startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
		endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
		slotDurationMinutes: z.number().int().min(15).max(120).default(30),
		isActive: z.boolean().default(true),
	})
	.superRefine((slot, ctx) => {
		if (slot.startTime >= slot.endTime) {
			ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time" });
		}
		const [startHour, startMinute] = slot.startTime.split(":").map(Number);
		const [endHour, endMinute] = slot.endTime.split(":").map(Number);
		const windowMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
		if (windowMinutes < slot.slotDurationMinutes) {
			ctx.addIssue({
				code: "custom",
				path: ["slotDurationMinutes"],
				message: "Availability window must fit at least one slot",
			});
		}
	});

export const replaceAvailabilitySchema = z.object({
	slots: z.array(doctorAvailabilitySchema).max(100),
});

export const doctorOnboardingSchema = z.object({
	directoryDoctorId: z.string().uuid(),
	licenseNumber: z.string().trim().min(3).max(80),
	clinicName: z.string().trim().min(2).max(160).optional(),
	clinicAddress: z.string().trim().max(500).optional(),
	consultationModes: z
		.array(z.enum(["IN_PERSON", "VIDEO", "PHONE"]))
		.min(1)
		.max(3),
});

export const prePrescriptionCheckSchema = z.object({
	appointmentId: z.string().uuid().optional(),
	proposedMedicines: z.array(z.string().trim().min(1).max(160)).min(1).max(20),
});

export const doctorPrescriptionSchema = z.object({
	appointmentId: z.string().uuid(),
	preCheckId: z.string().uuid(),
	diagnosis: z.string().trim().max(2000).optional(),
	instructions: z.string().trim().max(4000).optional(),
	medicines: z
		.array(
			z.object({
				name: z.string().trim().min(1).max(160),
				dosage: z.string().trim().max(160).optional(),
				frequency: z.string().trim().max(160).optional(),
				duration: z.string().trim().max(160).optional(),
				instructions: z.string().trim().max(1000).optional(),
			})
		)
		.min(1)
		.max(20),
});

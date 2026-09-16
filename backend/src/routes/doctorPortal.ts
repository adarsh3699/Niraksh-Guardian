import { Router } from "express";
import { authenticate, requireApprovedDoctor, requireRole } from "../middlewares/auth";
import { UserRole } from "../generated/prisma/client";
import {
	getDoctorAppointments,
	getDoctorAvailability,
	getDoctorMe,
	getDoctorPatients,
	getPatientRecord,
	issueDoctorPrescription,
	onboardDoctor,
	updateDoctorApplication,
	replaceDoctorAvailability,
	runPrePrescriptionCheck,
} from "../controllers/doctorPortal.controller";
import { updateAppointmentStatus } from "../controllers/appointment.controller";

const router = Router();

router.use(authenticate, requireRole(UserRole.DOCTOR));
router.get("/me", getDoctorMe);
router.patch("/application", updateDoctorApplication);
router.post("/onboarding", onboardDoctor);
router.get("/appointments", requireApprovedDoctor, getDoctorAppointments);
router.patch("/appointments/:id/status", requireApprovedDoctor, updateAppointmentStatus);
router.get("/patients", requireApprovedDoctor, getDoctorPatients);
router.get("/patients/:patientId", requireApprovedDoctor, getPatientRecord);
router.post("/patients/:patientId/pre-prescription-check", requireApprovedDoctor, runPrePrescriptionCheck);
router.post("/patients/:patientId/prescriptions", requireApprovedDoctor, issueDoctorPrescription);
router.get("/availability", requireApprovedDoctor, getDoctorAvailability);
router.put("/availability", requireApprovedDoctor, replaceDoctorAvailability);

export default router;

import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { authenticate, requireRole } from "../middlewares/auth";
import {
	cancelMyAppointment,
	createAppointment,
	getDoctorSlots,
	getMyAppointments,
} from "../controllers/appointment.controller";

const router = Router();

router.use(authenticate);
router.get("/doctors/:doctorId/slots", getDoctorSlots);
router.get("/mine", requireRole(UserRole.PATIENT), getMyAppointments);
router.post("/", requireRole(UserRole.PATIENT), createAppointment);
router.patch("/:id/cancel", requireRole(UserRole.PATIENT), cancelMyAppointment);

export default router;

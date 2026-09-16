import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { authenticate, requireRole } from "../middlewares/auth";
import { getDoctorApplications, reviewDoctorApplication } from "../controllers/admin.controller";

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN));
router.get("/doctor-applications", getDoctorApplications);
router.patch("/doctor-applications/:id", reviewDoctorApplication);

export default router;

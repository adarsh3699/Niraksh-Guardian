import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { authenticate, requireRole } from "../middlewares/auth";
import {
	getClinicalIntake,
	saveClinicalIntake,
	revokeClinicalIntakeConsent,
	getClinicalTimeline,
} from "../controllers/clinicalIntake.controller";

const router = Router();

router.use(authenticate, requireRole(UserRole.PATIENT));
router.get("/timeline", getClinicalTimeline);
router.get("/", getClinicalIntake);
router.post("/", saveClinicalIntake);
router.post("/:id/revoke-consent", revokeClinicalIntakeConsent);

export default router;

import { Router } from "express";
import { getEducationController } from "../controllers/education.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Retrieve disease info (GET request)
// Protect it to prevent abuse, or make it public rate-limited?
// Let's protect it consistent with other API parts.
router.get("/info", authenticate, getEducationController);

export default router;

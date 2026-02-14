import { Router } from "express";
import { getDoctors } from "../controllers/doctor.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Public or Protected? Doctors list can be public, but let's secure it or leave public?
// Implementation plan doesn't specify auth. Assuming authenticated users (Patient app).
router.get("/", authenticate, getDoctors);

export default router;

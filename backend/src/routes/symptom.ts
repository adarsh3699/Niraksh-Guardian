import { Router } from "express";
import { analyzeSymptomsController } from "../controllers/symptom.controller";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/upload";

const router = Router();

// Protected route - only logged in users can analyze symptoms (to track history later)
router.post("/analyze", authenticate, upload.single("image"), analyzeSymptomsController);

export default router;

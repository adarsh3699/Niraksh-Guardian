import { Router } from "express";
import { aiRateLimiter } from "../middlewares/rateLimiter";
import { symptomDiagnosisController, chatSummaryController } from "../controllers/symptom.controller";
import {
	analyzeMedicineController,
	analyzePrescriptionController,
	checkDrugInteractionController,
} from "../controllers/healthTools.controller";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/upload";

const router = Router();

// Symptom analysis (text + optional image)
router.post("/analyze", authenticate, aiRateLimiter, upload.single("image"), symptomDiagnosisController);

// Summarize chat symptoms for doctor referral
router.post("/summarize-symptoms", authenticate, aiRateLimiter, chatSummaryController);

// Medicine analysis (text name OR image)
router.post("/medicine", authenticate, aiRateLimiter, upload.single("image"), analyzeMedicineController);

// Prescription analysis (up to 5 images)
router.post("/prescription", authenticate, aiRateLimiter, upload.array("files", 5), analyzePrescriptionController);

// Drug-drug interaction check (JSON body with medicines array)
router.post("/drug-interaction", authenticate, aiRateLimiter, checkDrugInteractionController);

export default router;

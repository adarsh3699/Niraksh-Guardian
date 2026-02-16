import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import {
	getMedicineHistory,
	getPrescriptionHistory,
	getDrugInteractionHistory,
	getSymptomHistory,
	deleteHistoryItem,
} from "../controllers/history.controller";

const router = Router();

// Apply auth middleware
router.use(authenticate);

// Fetch Routes
router.get("/medicine", getMedicineHistory);
router.get("/prescription", getPrescriptionHistory);
router.get("/interaction", getDrugInteractionHistory);
router.get("/symptom", getSymptomHistory);

// Delete Route (Generic)
router.delete("/:type/:id", deleteHistoryItem);

export default router;

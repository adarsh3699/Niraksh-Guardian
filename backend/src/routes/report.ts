import express from "express";
import { generateHealthReport, listHealthReports } from "../controllers/report.controller";
import {
	analyzeLabReportController,
	deleteLabReportController,
	getLabReportController,
	getLabReportJobStatusController,
	listLabReportsController,
	streamLabReportJobStatusController,
} from "../controllers/labReport.controller";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/upload";

const router = express.Router();

// All routes here should be protected
router.use(authenticate);

router.get("/", listHealthReports);
router.post("/health-summary", generateHealthReport);
router.get("/lab", listLabReportsController);
router.get("/lab/jobs/:jobId", getLabReportJobStatusController);
router.get("/lab/jobs/:jobId/stream", streamLabReportJobStatusController);
router.get("/lab/:id", getLabReportController);
router.delete("/lab/:id", deleteLabReportController);
router.post("/lab/analyze", upload.single("file"), analyzeLabReportController);

export default router;

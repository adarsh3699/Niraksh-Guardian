import express from "express";
import { aiRateLimiter } from "../middlewares/rateLimiter";
import { generateHealthReport, listHealthReports } from "../controllers/report.controller";
import {
	analyzeLabReportController,
	deleteLabReportController,
	getLabReportController,
	getLabReportJobStatusController,
	getDashboardInsightsController,
	listLabReportsController,
	streamLabReportJobStatusController,
	addLabReportNoteController,
	deleteLabReportNoteController,
	exportLabReportPDFController,
	exportLabReportCSVController,
	shareLabReportController,
	getPreviousLabReportController,
} from "../controllers/labReport.controller";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/upload";

const router = express.Router();

// All routes here should be protected
router.use(authenticate);

router.get("/", listHealthReports);
router.post("/health-summary", generateHealthReport);
router.get("/dashboard-insights", getDashboardInsightsController);
router.get("/lab", listLabReportsController);
router.get("/lab/jobs/:jobId", getLabReportJobStatusController);
router.get("/lab/jobs/:jobId/stream", streamLabReportJobStatusController);
router.get("/lab/:id", getLabReportController);
router.get("/lab/:id/previous", getPreviousLabReportController);
router.get("/lab/:id/export/pdf", exportLabReportPDFController);
router.get("/lab/:id/export/csv", exportLabReportCSVController);
router.post("/lab/:id/share", shareLabReportController);
router.delete("/lab/:id", deleteLabReportController);
router.patch("/lab/:id/notes", addLabReportNoteController);
router.delete("/lab/:id/notes/:noteId", deleteLabReportNoteController);
router.post("/lab/analyze", aiRateLimiter, upload.single("file"), analyzeLabReportController);

export default router;

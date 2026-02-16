import express from "express";
import { generateHealthReport } from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

// All routes here should be protected
router.use(authenticate);

router.get("/health-summary", generateHealthReport);

export default router;

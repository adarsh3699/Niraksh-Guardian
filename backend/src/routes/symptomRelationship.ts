import { Router } from "express";
import { aiRateLimiter } from "../middlewares/rateLimiter";
import { symptomRelationshipController } from "../controllers/symptomRelationship.controller";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/upload";

const router = Router();

router.post("/analyze", authenticate, aiRateLimiter, upload.single("image"), symptomRelationshipController);

export default router;

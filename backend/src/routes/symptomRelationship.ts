import { Router } from "express";
import { symptomRelationshipController } from "../controllers/symptomRelationship.controller";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/upload";

const router = Router();

router.post("/analyze", authenticate, upload.single("image"), symptomRelationshipController);

export default router;

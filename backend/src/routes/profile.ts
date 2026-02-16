import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { getProfile, updateProfile } from "../controllers/profile.controller";

const router = Router();

// Apply auth middleware
router.use(authenticate);

router.get("/", getProfile);
router.put("/", updateProfile);

export default router;

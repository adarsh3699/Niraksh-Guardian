import { Router } from "express";
import {
	signup,
	doctorSignup,
	login,
	refreshToken,
	logout,
	googleLogin,
	forgotPassword,
	resetPassword,
} from "../controllers/auth.controller";
import { loginLimiter, resetEmailLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post("/signup", signup);
router.post("/doctor/signup", doctorSignup);
router.post("/login", loginLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/google", googleLogin);
router.post("/forgot-password", resetEmailLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

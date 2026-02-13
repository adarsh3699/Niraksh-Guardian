import { Router } from "express";
import { signup, login, refreshToken, logout, googleLogin } from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/google", googleLogin);

export default router;

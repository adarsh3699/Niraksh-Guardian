import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/jwt/jwt";
import { checkTokenBlacklist } from "../services/tokenBlacklist";
import env from "../config/env";

// Extend Express Request interface to include user

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized: No token provided" });
	}

	const token = authHeader.split(" ")[1];

	try {
		// Check if token is blacklisted (revoked on logout)
		const blacklistStatus = await checkTokenBlacklist(token);

		if (blacklistStatus === "blacklisted") {
			return res.status(401).json({ error: "Unauthorized: Token has been revoked" });
		}

		if (blacklistStatus === "check_failed" && env.TOKEN_BLACKLIST_FAIL_MODE === "closed") {
			return res.status(503).json({ error: "Authentication temporarily unavailable" });
		}

		const decoded = verifyAccessToken(token);
		req.user = decoded;
		next();
	} catch {
		return res.status(401).json({ error: "Unauthorized: Invalid token" });
	}
};

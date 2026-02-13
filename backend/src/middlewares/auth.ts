import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/jwt/jwt";
import { isTokenBlacklisted } from "../services/tokenBlacklist";

// Extend Express Request interface to include user

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized: No token provided" });
	}

	const token = authHeader.split(" ")[1];

	try {
		// Check if token is blacklisted (revoked on logout)
		const blacklisted = await isTokenBlacklisted(token);
		if (blacklisted) {
			return res.status(401).json({ error: "Unauthorized: Token has been revoked" });
		}

		const decoded = verifyAccessToken(token);
		req.user = decoded;
		next();
	} catch {
		return res.status(401).json({ error: "Unauthorized: Invalid token" });
	}
};

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/jwt/jwt";

// Extend Express Request interface to include user

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized: No token provided" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = verifyAccessToken(token);
		req.user = decoded;
		next();
	} catch {
		return res.status(401).json({ error: "Unauthorized: Invalid token" });
	}
};

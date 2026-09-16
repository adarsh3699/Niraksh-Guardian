import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/jwt/jwt";
import { checkTokenBlacklist } from "../services/tokenBlacklist";
import env from "../config/env";
import prisma from "../db/prisma";
import { UserRole } from "../generated/prisma/client";
import { getAuthenticatedUserId } from "../types/auth";

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

export const requireRole = (...allowedRoles: UserRole[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { role: true, isActive: true },
			});

			if (!user || !user.isActive) {
				return res.status(401).json({ error: "Unauthorized" });
			}

			if (!allowedRoles.includes(user.role)) {
				return res.status(403).json({ error: "You do not have access to this area" });
			}

			next();
		} catch (error) {
			next(error);
		}
	};
};

export const requireApprovedDoctor = async (req: Request, res: Response, next: NextFunction) => {
	const userId = getAuthenticatedUserId(req);
	if (!userId) return res.status(401).json({ error: "Unauthorized" });

	try {
		const profile = await prisma.doctorProfile.findUnique({
			where: { userId },
			select: { verificationStatus: true },
		});
		if (!profile || profile.verificationStatus !== "APPROVED") {
			return res.status(403).json({ error: "Doctor profile approval is required for this action" });
		}
		next();
	} catch (error) {
		next(error);
	}
};

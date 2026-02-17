import { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import redisClient from "../config/redis";
import logger from "../config/logger";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (req: Request, res: Response) => {
	const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

	// Database check
	const dbStart = Date.now();
	try {
		await prisma.$queryRaw`SELECT 1`;
		checks.database = { status: "healthy", latency: Date.now() - dbStart };
	} catch (error: unknown) {
		checks.database = {
			status: "unhealthy",
			error: error instanceof Error ? error.message : "Unknown error",
			latency: Date.now() - dbStart,
		};
	}

	// Redis check
	const redisStart = Date.now();
	try {
		await redisClient.ping();
		checks.redis = { status: "healthy", latency: Date.now() - redisStart };
	} catch (error: unknown) {
		checks.redis = {
			status: "unhealthy",
			error: error instanceof Error ? error.message : "Unknown error",
			latency: Date.now() - redisStart,
		};
	}

	const allHealthy = Object.values(checks).every((c) => c.status === "healthy");
	const statusCode = allHealthy ? 200 : 503;

	const response = {
		status: allHealthy ? "ok" : "degraded",
		uptime: Math.round(process.uptime()),
		timestamp: new Date().toISOString(),
		checks,
	};

	if (!allHealthy) {
		logger.warn(response, "Health check degraded");
	}

	res.status(statusCode).json(response);
});

export default router;

import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";

// Helper to create a rate limiter
const createRateLimiter = (options: {
	prefix: string;
	limit: number;
	window: number; // in seconds
	message: string;
}) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const ip = req.ip || "unknown";
		// For login, maybe limit by email too? But email is in body.
		// Let's stick to IP for now to avoid parsing body issues before validation.
		// Or use a composite key if body available.

		const key = `rate_limit:${options.prefix}:${ip}`;

		try {
			const requests = await redisClient.incr(key);

			if (requests === 1) {
				await redisClient.expire(key, options.window);
			}

			if (requests > options.limit) {
				return res.status(429).json({ error: options.message });
			}

			next();
		} catch (error) {
			console.error(`Rate Limiter Error (${options.prefix}):`, error);
			next(); // Fail open
		}
	};
};

export const apiRateLimiter = createRateLimiter({
	prefix: "api",
	limit: 100,
	window: 15 * 60, // 15 mins
	message: "Too many requests from this IP, please try again later.",
});

export const loginLimiter = createRateLimiter({
	prefix: "login",
	limit: 5, // 5 attempts
	window: 15 * 60, // 15 mins
	message: "Too many login attempts, please try again later.",
});

export const resetEmailLimiter = createRateLimiter({
	prefix: "reset_email",
	limit: 3, // 3 requests
	window: 60 * 60, // 1 hour
	message: "Too many password reset requests, please try again later.",
});

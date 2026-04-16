import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";
import logger from "../config/logger";

interface RateLimiterOptions {
	prefix: string;
	limit: number;
	window: number;
	message: string;
	keyBy?: "ip" | "user" | "both";
}

const createRateLimiter = (options: RateLimiterOptions) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const userId = (req as Request & { user?: { id: string } }).user?.id;
		const ip = req.ip || "unknown";

		const identifier =
			options.keyBy === "ip"
				? ip
				: options.keyBy === "both"
					? `${userId ?? "anon"}:${ip}`
					: userId
						? `user:${userId}`
						: `ip:${ip}`;

		const key = `rate_limit:${options.prefix}:${identifier}`;

		if (!redisClient.isOpen) {
			logger.warn({ prefix: options.prefix }, "Rate limiter skipped: Redis not connected");
			return next();
		}

		try {
			const requests = await redisClient.incr(key);

			if (requests === 1) {
				await redisClient.expire(key, options.window);
			}

			res.setHeader("X-RateLimit-Limit", options.limit);
			res.setHeader("X-RateLimit-Remaining", Math.max(0, options.limit - requests));

			if (requests > options.limit) {
				const ttl = await redisClient.ttl(key);
				res.setHeader("Retry-After", ttl);
				logger.warn(
					{ prefix: options.prefix, identifier, requests, limit: options.limit },
					"Rate limit exceeded"
				);
				return res.status(429).json({ error: options.message, retryAfter: ttl });
			}

			next();
		} catch (error) {
			logger.error({ error, prefix: options.prefix }, "Rate limiter error");
			next();
		}
	};
};

export const loginLimiter = createRateLimiter({
	prefix: "auth:login",
	limit: 10,
	window: 15 * 60, // 15 minutes
	message: "Too many login attempts. Please try again later.",
	keyBy: "ip",
});

export const resetEmailLimiter = createRateLimiter({
	prefix: "auth:reset",
	limit: 5,
	window: 30 * 60, // 30 minutes
	message: "Too many password reset requests. Please try again later.",
	keyBy: "ip",
});

export const aiRateLimiter = createRateLimiter({
	prefix: "api:ai",
	limit: 25,
	window: 10 * 60,
	message: "AI request limit reached. Please wait before trying again.",
	keyBy: "user",
});

export const chatRateLimiter = createRateLimiter({
	prefix: "api:chat",
	limit: 60,
	window: 10 * 60,
	message: "Too many messages. Please slow down.",
	keyBy: "user",
});

export const apiRateLimiter = createRateLimiter({
	prefix: "api:general",
	limit: 300,
	window: 10 * 60,
	message: "Too many requests. Please try again shortly.",
	keyBy: "user",
});

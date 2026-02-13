import redisClient from "../../config/redis";

class RedisService {
	async get(key: string): Promise<string | null> {
		try {
			return await redisClient.get(key);
		} catch (error) {
			console.error("Redis Get Error:", error);
			return null;
		}
	}

	async set(key: string, value: string, ttl?: number): Promise<void> {
		try {
			if (ttl) {
				await redisClient.set(key, value, { EX: ttl });
			} else {
				await redisClient.set(key, value);
			}
		} catch (error) {
			console.error("Redis Set Error:", error);
		}
	}

	async del(key: string): Promise<void> {
		try {
			await redisClient.del(key);
		} catch (error) {
			console.error("Redis Del Error:", error);
		}
	}
}

export const redisService = new RedisService();

// Rate Limiter Middleware
import { Request, Response, NextFunction } from "express";

export const apiRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
	const ip = req.ip || "unknown";
	const key = `rate_limit:${ip}`;
	const limit = 100; // Limit per window
	const window = 60 * 15; // 15 minutes in seconds

	try {
		const requests = await redisClient.incr(key);

		if (requests === 1) {
			await redisClient.expire(key, window);
		}

		if (requests > limit) {
			return res.status(429).json({ error: "Too many requests" });
		}

		next();
	} catch (error) {
		console.error("Rate Limiter Error:", error);
		next(); // Fail open if Redis is down
	}
};

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

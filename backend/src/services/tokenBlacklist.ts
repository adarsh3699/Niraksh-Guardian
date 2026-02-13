import redisClient from "../config/redis";
import logger from "../config/logger";

const BLACKLIST_PREFIX = "token_blacklist:";

/**
 * Add an access token to the Redis blacklist.
 * TTL is set to match the token's remaining lifetime so it auto-cleans.
 */
export const blacklistToken = async (token: string, expiresInSeconds: number): Promise<void> => {
	try {
		const key = `${BLACKLIST_PREFIX}${token}`;
		await redisClient.set(key, "1", { EX: expiresInSeconds });
		logger.debug(`Token blacklisted (TTL: ${expiresInSeconds}s)`);
	} catch (error) {
		logger.error({ err: error }, "Failed to blacklist token");
	}
};

/**
 * Check if an access token is blacklisted.
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
	try {
		const key = `${BLACKLIST_PREFIX}${token}`;
		const result = await redisClient.get(key);
		return result !== null;
	} catch (error) {
		logger.error({ err: error }, "Failed to check token blacklist");
		return false; // Fail open to avoid blocking all requests if Redis is down
	}
};

import redisClient from "../config/redis";
import logger from "../config/logger";
import env from "../config/env";

const BLACKLIST_PREFIX = "token_blacklist:";

export type TokenBlacklistCheckResult = "blacklisted" | "clear" | "check_failed";

/**
 * Add an access token to the Redis blacklist.
 * TTL is set to match the token's remaining lifetime so it auto-cleans.
 */
export const blacklistToken = async (token: string, expiresInSeconds: number): Promise<void> => {
	try {
		if (!redisClient.isOpen) {
			return;
		}

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
export const checkTokenBlacklist = async (token: string): Promise<TokenBlacklistCheckResult> => {
	try {
		if (!redisClient.isOpen) {
			return "check_failed";
		}

		const key = `${BLACKLIST_PREFIX}${token}`;
		const result = await redisClient.get(key);
		return result !== null ? "blacklisted" : "clear";
	} catch (error) {
		logger.error({ err: error, mode: env.TOKEN_BLACKLIST_FAIL_MODE }, "Failed to check token blacklist");
		return "check_failed";
	}
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
	const result = await checkTokenBlacklist(token);
	if (result === "blacklisted") return true;
	if (result === "clear") return false;

	return env.TOKEN_BLACKLIST_FAIL_MODE === "closed";
};

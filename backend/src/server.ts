import app from "./app";
import env from "./config/env";
import redisClient from "./config/redis";
import prisma from "./db/prisma";
import logger from "./config/logger";

const PORT = env.PORT || 5000;
const REDIS_RECONNECT_INTERVAL_MS = 30_000;

const startServer = async () => {
	try {
		// Connect to Database
		await prisma.$connect();
		logger.info("Database connected");

		const connectRedisSafely = async () => {
			if (redisClient.isOpen) {
				return true;
			}

			try {
				await redisClient.connect();
				logger.info("Redis connected");
				return true;
			} catch (redisError) {
				logger.warn({ err: redisError }, "Redis unavailable. Continuing in degraded mode without cache");
				return false;
			}
		};

		const isRedisReady = await connectRedisSafely();
		let reconnectInProgress = false;
		let redisReconnectTimer: NodeJS.Timeout | null = null;

		const server = app.listen(PORT, () => {
			logger.info(`Server running on port ${PORT}`);
		});

		if (!isRedisReady) {
			redisReconnectTimer = setInterval(async () => {
				if (reconnectInProgress || redisClient.isOpen) {
					return;
				}

				reconnectInProgress = true;
				try {
					await connectRedisSafely();
				} finally {
					reconnectInProgress = false;
				}
			}, REDIS_RECONNECT_INTERVAL_MS);
		}

		const shutdown = async () => {
			logger.info("Shutting down server...");
			if (redisReconnectTimer) {
				clearInterval(redisReconnectTimer);
			}
			server.close();
			if (redisClient.isOpen) {
				await redisClient.quit();
			}
			await prisma.$disconnect();
			process.exit(0);
		};

		process.on("SIGTERM", shutdown);
		process.on("SIGINT", shutdown);
	} catch (error) {
		logger.error(error, "Failed to start server");
		process.exit(1);
	}
};

startServer();

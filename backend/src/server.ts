import app from "./app";
import env from "./config/env";
import redisClient from "./config/redis";
import pino from "pino";

const logger = pino({ name: "server" });
const PORT = env.PORT || 5000;

const startServer = async () => {
	try {
		await redisClient.connect();
		logger.info("Redis connected");

		const server = app.listen(PORT, () => {
			logger.info(`Server running on port ${PORT}`);
		});

		const shutdown = async () => {
			logger.info("Shutting down server...");
			server.close();
			await redisClient.quit();
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

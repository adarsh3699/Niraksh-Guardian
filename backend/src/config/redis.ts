import { createClient } from "redis";
import env from "./env";
import pino from "pino";

const logger = pino({ name: "redis" });

const redisClient = createClient({
	url: env.REDIS_URL,
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.on("connect", () => logger.info("Redis Client Connected"));

export default redisClient;

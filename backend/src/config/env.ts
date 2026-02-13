import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
	PORT: z.string().default("4000"),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	DATABASE_URL: z.string().min(1),
	JWT_SECRET: z.string().min(1),
	JWT_REFRESH_SECRET: z.string().min(1),
	GOOGLE_CLIENT_ID: z.string().optional(), // Optional for now until set up
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	GEMINI_API_KEY: z.string().optional(),
	REDIS_URL: z.string().default("redis://localhost:6379"),
	AWS_REGION: z.string().default("us-east-1"),
	AWS_ACCESS_KEY_ID: z.string().optional(),
	AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

export default env;

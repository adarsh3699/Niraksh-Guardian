import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import logger from "./config/logger";

import authRoutes from "./routes/auth";
import webhookRoutes from "./routes/webhook";
import healthRoutes from "./routes/health";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";

const app: Application = express();

// Request Logging
app.use(
	pinoHttp({
		logger,
		autoLogging: {
			ignore: (req) => {
				// Don't log health check requests
				return (req as Request).url === "/health";
			},
		},
		customLogLevel: (_req, res, error) => {
			if (error || res.statusCode >= 500) return "error";
			if (res.statusCode >= 400) return "warn";
			return "info";
		},
	})
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(apiRateLimiter);

app.get("/", (req: Request, res: Response) => {
	res.status(200).json({ message: "Welcome to Niraksh Guardian API" });
});

app.get("/api", (req: Request, res: Response) => {
	res.status(200).json({
		"/": "/",
		auth: "/api/auth",
		users: "/api/users",
	});
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/health", healthRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;

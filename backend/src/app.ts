import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import logger from "./config/logger";
import env from "./config/env";

import authRoutes from "./routes/auth";
import webhookRoutes from "./routes/webhook";
import healthRoutes from "./routes/health";
import chatRoutes from "./routes/chat";
import doctorRoutes from "./routes/doctor";
import symptomRoutes from "./routes/symptom";
import educationRoutes from "./routes/education";
import historyRoutes from "./routes/history";
import profileRoutes from "./routes/profile";
import reportRoutes from "./routes/report";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";

const app: Application = express();

// Request Logging
app.use(
	pinoHttp({
		logger,
		autoLogging: {
			ignore: (req) => (req as Request).url === "/health",
		},
		customLogLevel: (_req, res, error) => {
			if (error || res.statusCode >= 500) return "error";
			if (res.statusCode >= 400) return "warn";
			return "info";
		},
	})
);

// Security Headers
app.use(
	helmet({
		contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
		crossOriginEmbedderPolicy: false,
	})
);

// CORS
const allowedOrigins = env.CORS_ORIGINS
	? env.CORS_ORIGINS.split(",").map((o) => o.trim())
	: ["http://localhost:3000", "http://localhost:5173", "https://niraksh.bhemu.in/", "https://niraksh.vercel.app/"];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			callback(new Error(`Origin ${origin} not allowed by CORS`));
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		maxAge: 86400,
	})
);

// Body Parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Rate Limiting
app.use(apiRateLimiter);

// Disable x-powered-by
app.disable("x-powered-by");

app.get("/", (req: Request, res: Response) => {
	res.status(200).json({ message: "Welcome to Niraksh Guardian API" });
});

app.get("/api", (req: Request, res: Response) => {
	res.status(200).json({
		"/": "/",
		api: "/api",
		auth: "/api/auth",
		users: "/api/users",
		chats: "/api/chats",
		doctors: "/api/doctors",
		ai: "/api/ai",
		education: "/api/education",
		history: "/api/history",
		profile: "/api/profile",
		reports: "/api/reports",
	});
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/health", healthRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/ai", symptomRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/history", historyRoutes); // Register History Routes
app.use("/api/profile", profileRoutes); // Register Profile Routes
app.use("/api/reports", reportRoutes); // Register Report Routes
// Global Error Handler
app.use(errorHandler);

export default app;

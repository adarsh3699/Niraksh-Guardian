import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import logger from "./config/logger";
import env from "./config/env";

import authRoutes from "./routes/auth";
import webhookRoutes from "./routes/webhook";
import healthRoutes from "./routes/health";
import chatRoutes from "./routes/chat";
import doctorRoutes from "./routes/doctor";
import symptomRoutes from "./routes/symptom";
import symptomRelationshipRoutes from "./routes/symptomRelationship";
import diseaseRoutes from "./routes/education";
import historyRoutes from "./routes/history";
import profileRoutes from "./routes/profile";
import reportRoutes from "./routes/report";
import medicineRoutes from "./routes/medicine";
import researchRouter from "./routes/research";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import appointmentRoutes from "./routes/appointments";
import doctorPortalRoutes from "./routes/doctorPortal";
import adminRoutes from "./routes/admin";

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
		customSuccessMessage: (req, res) => {
			return `${(req as Request).method} ${(req as Request).url} → ${res.statusCode}`;
		},
		customErrorMessage: (req, res) => {
			return `${(req as Request).method} ${(req as Request).url} → ${res.statusCode}`;
		},
		serializers: {
			req: (req) => ({
				method: req.method,
				url: req.url,
			}),
			res: (res) => ({
				status: res.statusCode,
			}),
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
	: ["http://localhost:3000", "http://localhost:5173", "https://niraksh.bhemu.in", "https://niraksh.vercel.app"];

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

app.use((err: unknown, req: Request, res: Response, next: express.NextFunction) => {
	if (err instanceof Error && err.message.includes("not allowed by CORS")) {
		logger.warn(
			{
				event: "cors.origin.blocked",
				origin: req.headers.origin,
				path: req.path,
			},
			"Blocked request from disallowed origin"
		);
		return res.status(403).json({ error: "Forbidden origin" });
	}

	return next(err);
});

// Body Parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Rate Limiting
// Applied per route
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
		chats: "/api/chats",
		doctors: "/api/doctors",
		ai: "/api/ai (analyze, medicine, prescription, drug-interaction)",
		disease: "/api/disease",
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
app.use("/api/ai", symptomRoutes);
app.use("/api/symptoms", symptomRelationshipRoutes);
app.use("/api/research", researchRouter);
app.use("/api/reports", reportRoutes);
app.use("/api/doctors", apiRateLimiter, doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctor", doctorPortalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/disease", apiRateLimiter, diseaseRoutes);
app.use("/api/history", apiRateLimiter, historyRoutes);
app.use("/api/profile", apiRateLimiter, profileRoutes);
app.use("/api/medicine", apiRateLimiter, medicineRoutes);
// Global Error Handler
app.use(errorHandler);

export default app;

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";

import authRoutes from "./routes/auth";

const app: Application = express();
const logger = pino();

import { apiRateLimiter } from "./middlewares/rateLimiter";

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

// Health Check
app.get("/health", (req: Request, res: Response) => {
	res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	logger.error(err);
	res.status(500).json({
		error: "Internal Server Error",
		message: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

export default app;

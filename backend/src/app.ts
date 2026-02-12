import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";

const app: Application = express();
const logger = pino();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

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

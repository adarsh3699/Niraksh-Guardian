import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export class AppError extends Error {
	public statusCode: number;
	public isOperational: boolean;

	constructor(message: string, statusCode: number, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		Object.setPrototypeOf(this, AppError.prototype);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
	if (err instanceof AppError) {
		logger.warn(
			{
				statusCode: err.statusCode,
				message: err.message,
				path: req.path,
				method: req.method,
			},
			"Operational Error"
		);

		res.status(err.statusCode).json({
			error: err.message,
		});
		return;
	}

	// Unexpected errors
	logger.error(
		{
			err,
			path: req.path,
			method: req.method,
		},
		"Unhandled Error"
	);

	res.status(500).json({
		error: "Internal Server Error",
		...(process.env.NODE_ENV === "development" && { message: err.message }),
	});
};

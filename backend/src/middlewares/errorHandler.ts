import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
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

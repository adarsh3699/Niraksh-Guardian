import { Response } from "express";
import { ZodError } from "zod";

interface LoggerLike {
	error: (obj: unknown, msg?: string) => void;
}

interface HandleControllerErrorOptions {
	error: unknown;
	res: Response;
	logger: LoggerLike;
	context: string;
	internalErrorMessage?: string;
}

export function handleControllerError({
	error,
	res,
	logger,
	context,
	internalErrorMessage,
}: HandleControllerErrorOptions): void {
	if (error instanceof ZodError) {
		res.status(400).json({ error: "Validation failed", validationErrors: error.issues });
		return;
	}

	logger.error({ err: error }, context);
	res.status(500).json({ error: internalErrorMessage ?? "Internal Server Error" });
}

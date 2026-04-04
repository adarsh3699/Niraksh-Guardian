import { Request, Response } from "express";

export interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
	};
}

export const getAuthenticatedUserId = (req: Request): string | null => {
	return (req as AuthenticatedRequest).user?.userId ?? null;
};

export const requireAuthenticatedUserId = (req: Request, res: Response): string | null => {
	const userId = getAuthenticatedUserId(req);
	if (!userId) {
		res.status(401).json({ error: "Unauthorized" });
		return null;
	}
	return userId;
};

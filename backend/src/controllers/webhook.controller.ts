import { Request, Response } from "express";
import { snsService } from "../services/sns/sns.service";

export const handleSesWebhook = async (req: Request, res: Response) => {
	try {
		// SNS sends content-type as text/plain sometimes, so we might need to parse it if body is empty or string.
		// Assuming body parser handles it or we add middleware.
		// The validator expects the body object.

		let body = req.body;
		if (typeof body === "string") {
			try {
				body = JSON.parse(body);
			} catch {
				console.error("Failed to parse string body in webhook");
			}
		}

		await snsService.handleMessage(body);
		res.status(200).send("OK");
	} catch (error) {
		console.error("Webhook Error:", error);
		res.status(500).send("Webhook Failed");
	}
};

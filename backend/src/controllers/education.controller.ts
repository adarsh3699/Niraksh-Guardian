import { Request, Response } from "express";
import { educationSchema } from "../validators/education.schema";
import { getDiseaseInfo } from "../services/ai/gemini";
import { ZodError } from "zod";
import logger from "../config/logger";

export const getEducationController = async (req: Request, res: Response) => {
	try {
		const { topic, language } = educationSchema.parse(req.query);

		const info = await getDiseaseInfo(topic, language);

		res.json(info);
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Education Info Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

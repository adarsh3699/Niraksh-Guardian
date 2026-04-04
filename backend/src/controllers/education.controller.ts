import { Request, Response } from "express";
import { educationSchema } from "../validators/education.schema";
import { getDiseaseInfo } from "../services/ai/gemini";
import { ZodError } from "zod";
import logger from "../config/logger";

import prisma from "../db/prisma";

export const getEducationController = async (req: Request, res: Response) => {
	try {
		const { topic, language, refresh } = educationSchema.parse(req.query);

		const normalizedTopic = topic.trim().toLowerCase();

		// 1. Check Cache
		const cacheEntry = await prisma.diseaseInfoCache.findUnique({
			where: {
				topic_language: {
					topic: normalizedTopic,
					language,
				},
			},
		});

		// 2. Cache Hit (valid and not forcing refresh)
		if (cacheEntry && cacheEntry.expiresAt > new Date() && !refresh) {
			logger.info({ cacheHit: true, topic: normalizedTopic, language }, "Disease info cache hit");
			return res.json(cacheEntry.response);
		}

		// 3. Cache Miss / Expired / Refresh -> Call Gemini
		logger.info({ cacheHit: false, topic: normalizedTopic, language }, "Disease info cache miss/refresh");
		const info = await getDiseaseInfo(topic, language);

		// 4. Upsert into Cache (30 days TTL)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 30);

		await prisma.diseaseInfoCache.upsert({
			where: {
				topic_language: {
					topic: normalizedTopic,
					language,
				},
			},
			update: {
				response: info as import("../generated/prisma/client").Prisma.InputJsonValue,
				expiresAt,
			},
			create: {
				topic: normalizedTopic,
				language,
				response: info as import("../generated/prisma/client").Prisma.InputJsonValue,
				expiresAt,
			},
		});

		res.json(info);
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Education Info Failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

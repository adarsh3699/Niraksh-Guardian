import { Router } from "express";
import { aiRateLimiter } from "../middlewares/rateLimiter";
import { authenticate } from "../middlewares/auth";
import { fetchResearchPapers } from "../services/research/researchFetcher";
import env from "../config/env";
import logger from "../config/logger";
import {
	researchErrorResponseSchema,
	researchQuerySchema,
	researchResponseSchema,
} from "../validators/research.schema";

const router = Router();

// GET /api/research/papers?q=diabetes+metformin
router.get("/papers", authenticate, aiRateLimiter, async (req, res) => {
	const parsedQuery = researchQuerySchema.safeParse(req.query);
	if (!parsedQuery.success) {
		const hasMissingQuery = !req.query.q || String(req.query.q).trim() === "";
		const payload = researchErrorResponseSchema.parse({
			error: {
				code: hasMissingQuery ? "RESEARCH_QUERY_REQUIRED" : "RESEARCH_QUERY_INVALID",
				message: hasMissingQuery ? "Query required" : "Invalid research query",
				details: parsedQuery.error.issues,
			},
		});
		return res.status(400).json(payload);
	}

	try {
		const { q, maxPerSource } = parsedQuery.data;
		const rawResult = await fetchResearchPapers(q, maxPerSource ?? 4);

		const response = researchResponseSchema.parse({
			contractVersion: "1.0",
			papers: rawResult.papers.map((paper) => ({
				id: paper.id,
				source: paper.source,
				title: paper.title,
				authors: paper.authors ?? [],
				journal: paper.journal ?? "",
				year: paper.year ?? "",
				abstract: paper.abstract ?? "",
				url: paper.url,
				...(typeof paper.citationCount === "number" ? { citationCount: paper.citationCount } : {}),
				...(typeof paper.retrievalScore === "number" ? { retrievalScore: paper.retrievalScore } : {}),
				...(Array.isArray(paper.retrievalSignals) ? { retrievalSignals: paper.retrievalSignals } : {}),
			})),
			keywords: rawResult.keywords ?? [],
			rag: rawResult.rag,
			metadata: rawResult.metadata,
		});

		return res.json(response);
	} catch (err: unknown) {
		logger.error({ err }, "Error in /api/research/papers");
		const errorMessage = err instanceof Error ? err.message : String(err);
		const payload = researchErrorResponseSchema.parse({
			error: {
				code: "RESEARCH_FETCH_FAILED",
				message: "Failed to fetch research",
				...(env.NODE_ENV !== "production" ? { details: errorMessage } : {}),
			},
		});
		return res.status(500).json(payload);
	}
});

export default router;

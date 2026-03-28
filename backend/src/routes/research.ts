import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { fetchResearchPapers } from "../services/research/researchFetcher";
import env from "../config/env";

const router = Router();

// GET /api/research/papers?q=diabetes+metformin
router.get("/papers", authenticate, async (req, res) => {
	try {
		const q = (req.query.q as string)?.trim();
		if (!q) return res.status(400).json({ error: "Query required" });
		const result = await fetchResearchPapers(q, 4);
		return res.json(result);
	} catch (err: unknown) {
		console.error("Error in /api/research/papers:", err);
		const errorMessage = err instanceof Error ? err.message : String(err);
		return res.status(500).json({
			error: "Failed to fetch research",
			...(env.NODE_ENV !== "production" ? { details: errorMessage } : {}),
		});
	}
});

export default router;

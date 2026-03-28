import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { fetchResearchPapers } from "../services/research/researchFetcher";

const router = Router();

// GET /api/research/papers?q=diabetes+metformin
router.get("/papers", authenticate, async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q) return res.status(400).json({ error: "Query required" });
    const { papers, keywords } = await fetchResearchPapers(q, 4);
    return res.json({ papers, keywords });
  } catch (err: any) {
    console.error("Error in /api/research/papers:", err);
    return res.status(500).json({ error: "Failed to fetch research", details: err?.message });
  }
});

export default router;

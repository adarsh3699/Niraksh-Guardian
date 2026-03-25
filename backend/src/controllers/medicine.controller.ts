import { Request, Response } from "express";
import prisma from "../db/prisma";
import logger from "../config/logger";

interface AuthenticatedRequest extends Request {
	user?: { userId: string };
}

const ONE_MG_AUTOCOMPLETE = "https://www.1mg.com/pwa-dweb-api/api/v4/search/autocomplete";
const DEFAULT_CITY = "New Delhi";

export const medicineAutocompleteController = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const q = (req.query.q as string | undefined)?.trim();
		if (!q) return res.json({ suggestions: [] });

		// Fetch user city (fast indexed PK lookup) then call 1mg with correct city header
		const profile = await prisma.patientHealthProfile
			.findUnique({ where: { userId }, select: { city: true } })
			.catch(() => null);

		const city = profile?.city ?? DEFAULT_CITY;

		const upstream = await fetch(`${ONE_MG_AUTOCOMPLETE}?q=${encodeURIComponent(q)}&types=sku,udp&per_page=12`, {
			headers: {
				"x-city": city,
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
				Accept: "application/json",
				Referer: "https://www.1mg.com/",
			},
		});

		if (!upstream.ok) {
			logger.warn({ status: upstream.status, q }, "1mg autocomplete upstream error");
			return res.json({ suggestions: [] });
		}

		const data = await upstream.json();

		// Normalize on the backend — only return drug type with clean fields
		const raw: Record<string, unknown>[] = data?.data?.search_results ?? data?.search_results ?? [];

		const suggestions = raw
			.filter((s) => s.type === "drug" && s.name)
			.map((s) => ({
				name: s.name,
				search_term: s.search_term ?? null,
				image: s.image ?? null,
				url: s.url ?? null,
				slug: s.slug ?? null,
				pack_size_label: s.pack_size_label ?? null,
				manufacturer_name: s.manufacturer_name ?? null,
			}));

		res.json({ suggestions });
	} catch (error) {
		logger.error({ err: error }, "Medicine autocomplete failed");
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// --- Image proxy (avoids 1mg hotlink blocking) ---
export const medicineImageProxyController = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const imageUrl = (req.query.url as string | undefined)?.trim();
		if (!imageUrl) return res.status(400).json({ error: "url param required" });

		// Only allow 1mg image domains
		let parsed: URL;
		try {
			parsed = new URL(imageUrl);
		} catch {
			return res.status(400).json({ error: "Invalid URL" });
		}

		if (!parsed.hostname.endsWith("1mg.com") && !parsed.hostname.endsWith("gumlet.io")) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const upstream = await fetch(imageUrl, {
			headers: {
				Referer: "https://www.1mg.com/",
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
			},
		});

		if (!upstream.ok) {
			return res.status(upstream.status).end();
		}

		const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
		res.setHeader("Content-Type", contentType);
		res.setHeader("Cache-Control", "public, max-age=86400");

		const buffer = await upstream.arrayBuffer();
		res.send(Buffer.from(buffer));
	} catch (error) {
		logger.error({ err: error }, "Medicine image proxy failed");
		res.status(500).end();
	}
};

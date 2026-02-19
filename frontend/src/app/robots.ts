import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/dashboard", "/profile", "/history", "/reports"],
			},
		],
		sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
	};
}

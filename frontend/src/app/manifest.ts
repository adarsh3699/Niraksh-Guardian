import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
		short_name: SITE_CONFIG.name,
		description: SITE_CONFIG.description,
		start_url: "/",
		scope: "/",
		display: "standalone",
		display_override: ["standalone", "minimal-ui"],
		orientation: "portrait",
		background_color: "#f9fafb",
		theme_color: SITE_CONFIG.themeColor,
		categories: ["medical", "health", "productivity"],
		icons: [
			{
				src: "/brandLogo.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/brandLogo.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/brandLogo.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}

import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
		short_name: SITE_CONFIG.name,
		description: SITE_CONFIG.description,
		start_url: "/",
		display: "standalone",
		background_color: "#f9fafb",
		theme_color: SITE_CONFIG.themeColor,
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
		],
	};
}

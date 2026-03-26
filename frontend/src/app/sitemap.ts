import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = SITE_CONFIG.url;
	const now = new Date();

	return [
		{
			url: baseUrl,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 1.0,
		},
		{
			url: `${baseUrl}/about`,
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/login`,
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${baseUrl}/register`,
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${baseUrl}/symptom-analysis`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/niraksh-ai`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/prescription`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/drug-interaction`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/medicine`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/disease`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.8,
		},
	];
}

import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { DiseaseCards } from "@/components/home/DiseaseCards";
import { StatsStrip } from "@/components/home/StatsStrip";
import { DoMoreCards } from "@/components/home/DoMoreCards";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CTABanner } from "@/components/home/CTABanner";
import {
	generatePageMetadata,
	generateWebsiteJsonLd,
	generateMedicalOrgJsonLd,
	generateFaqJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
	title: "AI-Powered Health Assistant — Symptom Checker & Doctor Finder",
	description:
		"Describe your symptoms and get AI-powered health guidance, doctor recommendations, prescription analysis, and medicine information — all in one place.",
	path: "/",
	keywords: [
		"symptom checker online",
		"find doctor by symptoms",
		"AI health diagnosis",
		"free health assistant",
	],
});

/* JSON-LD structured data for rich search results */
const jsonLd = [generateWebsiteJsonLd(), generateMedicalOrgJsonLd(), generateFaqJsonLd()];

export default function HomePage() {
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			{/* Hero + diseases — padded */}
			<div id="homePage" className="px-[5%] pt-[20px]">
				<HeroSection />
				<DiseaseCards />
			</div>

			{/* Tools bento + how it works — padded */}
			<div className="px-[5%]">
				<HowItWorks />
			</div>
			{/* Full-width trust strip */}
			<StatsStrip />
			<div className="px-[5%]">
				<DoMoreCards />
				<CTABanner />
			</div>
		</>
	);
}

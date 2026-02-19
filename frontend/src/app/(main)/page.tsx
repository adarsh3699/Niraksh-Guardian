import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { DiseaseCards } from "@/components/home/DiseaseCards";
import { StatsStrip } from "@/components/home/StatsStrip";
import { DoMoreCards } from "@/components/home/DoMoreCards";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CTABanner } from "@/components/home/CTABanner";

export const metadata: Metadata = {
	title: "Niraksh Guardian — AI-Powered Health Assistant",
	description:
		"Describe your symptoms and get AI-powered health guidance, doctor recommendations, prescription analysis, and medicine information — all in one place.",
	openGraph: {
		title: "Niraksh Guardian — AI-Powered Health Assistant",
		description:
			"AI symptom analysis, doctor suggestions, prescription explainer, drug interaction checker, and medicine search.",
		type: "website",
	},
};

export default function HomePage() {
	return (
		<>
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

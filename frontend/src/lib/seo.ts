import type { Metadata } from "next";

/* ------------------------------------------------------------------ */
/*  Base site configuration                                           */
/* ------------------------------------------------------------------ */

export const SITE_CONFIG = {
	name: "Niraksh Guardian",
	tagline: "AI-Powered Health Assistant",
	description:
		"AI-powered health assistant for symptom analysis, doctor suggestions, prescription analysis, drug interaction checks, and medicine information — all in one place.",
	url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://niraksh.bhemu.in",
	creator: "Adarsh Suman",
	keywords: [
		"AI health assistant",
		"symptom checker",
		"doctor suggestion",
		"prescription analysis",
		"drug interaction checker",
		"medicine search",
		"health tools",
		"AI symptom analysis",
		"find doctor online",
		"health report generator",
		"Niraksh Guardian",
	],
	authors: [
		{
			name: "Adarsh Suman",
			url: "https://www.bhemu.in",
		},
	],
	openGraph: {
		type: "website" as const,
		locale: "en_US",
		title: "Niraksh Guardian — AI-Powered Health Assistant",
		description:
			"AI symptom analysis, doctor suggestions, prescription and lab analysis, drug interaction checker, and medicine search.",
		siteName: "Niraksh Guardian",
	},
	twitter: {
		card: "summary_large_image" as const,
		title: "Niraksh Guardian — AI-Powered Health Assistant",
		description:
			"AI-powered symptom analysis, doctor suggestions, prescription and lab analysis, and drug interaction checker.",
	},
	themeColor: "#448e94",
};

/* ------------------------------------------------------------------ */
/*  Generate metadata for specific pages                              */
/* ------------------------------------------------------------------ */

export function generatePageMetadata({
	title,
	description,
	path = "",
	keywords = [],
	noIndex = false,
}: {
	title?: string;
	description?: string;
	path?: string;
	keywords?: string[];
	noIndex?: boolean;
} = {}): Metadata {
	const pageTitle = title ?? SITE_CONFIG.tagline;
	const pageDescription = description ?? SITE_CONFIG.description;
	const pageUrl = `${SITE_CONFIG.url}${path}`;
	const allKeywords = [...SITE_CONFIG.keywords, ...keywords];

	return {
		title: pageTitle,
		description: pageDescription,
		keywords: allKeywords,
		authors: SITE_CONFIG.authors,
		creator: SITE_CONFIG.creator,
		metadataBase: new URL(SITE_CONFIG.url),
		alternates: {
			canonical: pageUrl,
		},
		robots: {
			index: !noIndex,
			follow: !noIndex,
			googleBot: {
				index: !noIndex,
				follow: !noIndex,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
		openGraph: {
			type: SITE_CONFIG.openGraph.type,
			locale: SITE_CONFIG.openGraph.locale,
			title: title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.openGraph.title,
			description: pageDescription,
			siteName: SITE_CONFIG.openGraph.siteName,
			url: pageUrl,
		},
		twitter: {
			card: SITE_CONFIG.twitter.card,
			title: title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.twitter.title,
			description: pageDescription,
		},
		verification: {
			google: process.env.GOOGLE_SITE_VERIFICATION,
		},
	};
}

/* ------------------------------------------------------------------ */
/*  JSON-LD: WebSite schema                                           */
/* ------------------------------------------------------------------ */

export function generateWebsiteJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE_CONFIG.name,
		url: SITE_CONFIG.url,
		description: SITE_CONFIG.description,
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${SITE_CONFIG.url}/symptom-analysis?symptoms={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};
}

/* ------------------------------------------------------------------ */
/*  JSON-LD: MedicalOrganization schema                               */
/* ------------------------------------------------------------------ */

export function generateMedicalOrgJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "MedicalOrganization",
		name: SITE_CONFIG.name,
		url: SITE_CONFIG.url,
		description:
			"AI-powered health tools — symptom analysis, doctor matching, prescription and lab analysis, drug interaction checks, and health reports.",
		medicalSpecialty: "General Practice",
		areaServed: {
			"@type": "Country",
			name: "India",
		},
		availableService: [
			{
				"@type": "MedicalTherapy",
				name: "AI Symptom Analysis",
				description:
					"Describe your symptoms and get AI-powered health guidance and doctor recommendations.",
			},
			{
				"@type": "MedicalTherapy",
				name: "Prescription & Lab Analysis",
				description:
					"Upload prescriptions or lab reports for plain-language explanations and marker-level risk interpretation.",
			},
			{
				"@type": "MedicalTherapy",
				name: "Drug Interaction Checker",
				description: "Check multiple medications for dangerous combinations and interactions.",
			},
		],
	};
}

/* ------------------------------------------------------------------ */
/*  JSON-LD: FAQPage schema (for home page)                           */
/* ------------------------------------------------------------------ */

export function generateFaqJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: [
			{
				"@type": "Question",
				name: "What is Niraksh Guardian?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "Niraksh Guardian is a free AI-powered health assistant that helps you analyze symptoms, find the right doctor, understand prescriptions, check drug interactions, and get medicine information.",
				},
			},
			{
				"@type": "Question",
				name: "How does the AI symptom checker work?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "Describe your symptoms in plain language. Our AI analyzes them against thousands of conditions and suggests possible causes, urgency level, and the right specialist to consult.",
				},
			},
			{
				"@type": "Question",
				name: "Is Niraksh Guardian free to use?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "Yes, Niraksh Guardian is completely free. No credit card or payment is required for any feature including symptom analysis, doctor suggestions, and prescription explanations.",
				},
			},
			{
				"@type": "Question",
				name: "What languages does Niraksh Guardian support?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "Niraksh Guardian supports 11 languages including English, Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam, and Punjabi.",
				},
			},
		],
	};
}

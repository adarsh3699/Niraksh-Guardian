/* ------------------------------------------------------------------ */
/*  App-wide constants                                                */
/* ------------------------------------------------------------------ */

import {
	MessageSquare,
	Pill,
	FileText,
	AlertTriangle,
	LayoutDashboard,
	User,
	Info,
	type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  API route map                                                     */
/* ------------------------------------------------------------------ */

export const API_ROUTES = {
	// Auth
	LOGIN: "/api/auth/login",
	SIGNUP: "/api/auth/signup",
	GOOGLE_AUTH: "/api/auth/google",
	REFRESH_TOKEN: "/api/auth/refresh-token",
	LOGOUT: "/api/auth/logout",
	FORGOT_PASSWORD: "/api/auth/forgot-password",
	RESET_PASSWORD: "/api/auth/reset-password",

	// Chat
	CHATS: "/api/chats",
	CHAT: (chatId: string) => `/api/chats/${chatId}`,
	CHAT_MESSAGES: (chatId: string) => `/api/chats/${chatId}/messages`,

	// Doctor
	DOCTORS: "/api/doctors",

	// AI / Symptom
	ANALYZE_SYMPTOMS: "/api/ai/analyze",
	SUMMARIZE_SYMPTOMS: "/api/ai/summarize-symptoms",
	MEDICINE: "/api/ai/medicine",
	PRESCRIPTION: "/api/ai/prescription",
	DRUG_INTERACTION: "/api/ai/drug-interaction",
	MEDICINE_AUTOCOMPLETE: "/api/medicine/autocomplete",

	// Education
	DISEASE_INFO: "/api/disease/info",

	// Profile
	PROFILE: "/api/profile",

	// History
	HISTORY_MEDICINE: "/api/history/medicine",
	HISTORY_PRESCRIPTION: "/api/history/prescription",
	HISTORY_INTERACTION: "/api/history/interaction",
	HISTORY_SYMPTOM: "/api/history/symptom",
	DELETE_HISTORY: (type: string, id: string) => `/api/history/${type}/${id}`,

	// Reports
	REPORTS: "/api/reports",
	GENERATE_REPORT: "/api/reports/health-summary",

	// Symptom Relationship Intelligence
	SYMPTOM_RELATIONSHIP: "/api/symptoms/analyze",

	// Research RAG
	RESEARCH_PAPERS: "/api/research/papers",
} as const;

/* ------------------------------------------------------------------ */
/*  Navigation items                                                  */
/* ------------------------------------------------------------------ */

export interface NavItem {
	label: string;
	path: string;
	icon: LucideIcon;
	requiresAuth: boolean;
}

export const NAV_ITEMS: NavItem[] = [
	{ label: "Home", path: "/", icon: Info, requiresAuth: false },
	{ label: "Works", path: "/#how-it-works", icon: FileText, requiresAuth: false },
	{ label: "Tools", path: "/#tools", icon: LayoutDashboard, requiresAuth: false },
	{ label: "About", path: "/about", icon: Info, requiresAuth: false },
	{ label: "Dashboard", path: "/dashboard", icon: User, requiresAuth: true },
];

/* ------------------------------------------------------------------ */
/*  Disease categories (for HomePage cards)                           */
/* ------------------------------------------------------------------ */

export interface DiseaseCategory {
	name: string;
	emoji: string;
	description: string;
	topic: string; // used as query param for /disease?topic=
}

export const DISEASE_CATEGORIES: DiseaseCategory[] = [
	{
		name: "Cold & Flu",
		emoji: "🤧",
		description: "Common respiratory infections",
		topic: "cold-and-flu",
	},
	{
		name: "Diabetes",
		emoji: "🩸",
		description: "Blood sugar management",
		topic: "diabetes",
	},
	{
		name: "Heart Disease",
		emoji: "❤️",
		description: "Cardiovascular conditions",
		topic: "heart-disease",
	},
	{
		name: "Mental Health",
		emoji: "🧠",
		description: "Anxiety, depression & more",
		topic: "mental-health",
	},
	{
		name: "COVID-19",
		emoji: "🦠",
		description: "Coronavirus information",
		topic: "covid-19",
	},
	{
		name: "Headache",
		emoji: "🤕",
		description: "Migraines & tension headaches",
		topic: "headache",
	},
	{
		name: "Allergies",
		emoji: "🤥",
		description: "Allergic reactions & management",
		topic: "allergies",
	},
	{
		name: "Skin Conditions",
		emoji: "🧴",
		description: "Dermatological issues",
		topic: "skin-conditions",
	},
];

/* ------------------------------------------------------------------ */
/*  Quick symptoms (for chat quick-pick chips)                        */
/* ------------------------------------------------------------------ */

export const QUICK_SYMPTOMS: string[] = [
	"Headache",
	"Fever",
	"Cough",
	"Sore Throat",
	"Body Pain",
	"Fatigue",
	"Nausea",
	"Stomach Pain",
	"Back Pain",
	"Shortness of Breath",
	"Chest Pain",
	"Dizziness",
];

/* ------------------------------------------------------------------ */
/*  Health tool cards (for HomePage "Do More" section)                 */
/* ------------------------------------------------------------------ */

export interface HealthToolCard {
	title: string;
	description: string;
	icon: LucideIcon;
	href: string;
	cta: string;
}

export const HEALTH_TOOL_CARDS: HealthToolCard[] = [
	{
		title: "Prescription Explainer",
		description: "Upload a prescription image and get a detailed explanation of your medicines.",
		icon: FileText,
		href: "/prescription",
		cta: "Try Now",
	},
	{
		title: "Drug-Drug Interaction",
		description: "Check for potential interactions between your medications.",
		icon: AlertTriangle,
		href: "/drug-interaction",
		cta: "Check Now",
	},
	{
		title: "Medicine Search",
		description: "Look up detailed information about any medicine.",
		icon: Pill,
		href: "/medicine",
		cta: "Search",
	},
	{
		title: "Niraksh AI",
		description: "Chat with our AI assistant about your health concerns.",
		icon: MessageSquare,
		href: "/niraksh-ai",
		cta: "Chat Now",
	},
];

/* ------------------------------------------------------------------ */
/*  Supported chat languages                                          */
/* ------------------------------------------------------------------ */

export const CHAT_LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "hi", label: "हिन्दी (Hindi)" },
	{ code: "bn", label: "বাংলা (Bengali)" },
	{ code: "te", label: "తెలుగు (Telugu)" },
	{ code: "mr", label: "मराठी (Marathi)" },
	{ code: "ta", label: "தமிழ் (Tamil)" },
	{ code: "ur", label: "اردو (Urdu)" },
	{ code: "gu", label: "ગુજરાતી (Gujarati)" },
	{ code: "kn", label: "ಕನ್ನಡ (Kannada)" },
	{ code: "ml", label: "മലയാളം (Malayalam)" },
	{ code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
] as const;

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
	CHAT_MESSAGES_STREAM: (chatId: string) => `/api/chats/${chatId}/messages/stream`,

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
	LAB_REPORTS: "/api/reports/lab",
	DASHBOARD_INSIGHTS: "/api/reports/dashboard-insights",
	DASHBOARD_INSIGHTS_QUERY: (reportWindow: number) =>
		`/api/reports/dashboard-insights?reportWindow=${reportWindow}`,
	LAB_REPORT_ANALYZE: "/api/reports/lab/analyze",
	LAB_REPORT_JOB_STATUS: (jobId: string) => `/api/reports/lab/jobs/${jobId}`,
	LAB_REPORT_JOB_STREAM: (jobId: string) => `/api/reports/lab/jobs/${jobId}/stream`,
	LAB_REPORT_DETAIL: (id: string) => `/api/reports/lab/${id}`,
	LAB_REPORT_DELETE: (id: string) => `/api/reports/lab/${id}`,

	// Symptom Relationship Intelligence
	SYMPTOM_RELATIONSHIP: "/api/symptoms/analyze",

	// Research RAG
	RESEARCH_PAPERS: "/api/research/papers",
} as const;

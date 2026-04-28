/* ------------------------------------------------------------------ */
/*  Profile & Health History types                                    */
/* ------------------------------------------------------------------ */

/** `GET /api/profile` response. */
export interface ProfileResponse {
	user: ProfileUser;
	healthProfile: HealthProfile | null;
}

export interface ProfileUser {
	id: string;
	email: string;
	name: string | null;
	gender: string | null;
	languagePreference: string | null;
}

export interface HealthProfile {
	id: string;
	bloodGroup: string | null;
	allergies: string[];
	chronicConditions: string[];
	emergencyContactName: string | null;
	emergencyContactPhone: string | null;
	emergencyContactEmail: string | null;
	healthRiskScore: number;
	/** User's city — used for location-based doctor sorting */
	city: string | null;
	/** User's state — used for location-based doctor sorting */
	state: string | null;
	createdAt: string;
	updatedAt: string;
}

/** `PUT /api/profile` request body. */
export interface UpdateProfileRequest {
	name?: string;
	gender?: string;
	languagePreference?: string;
	bloodGroup?: string;
	allergies?: string[];
	chronicConditions?: string[];
	emergencyContactName?: string;
	emergencyContactPhone?: string;
	emergencyContactEmail?: string;
	city?: string;
	state?: string;
}

/* ------------------------------------------------------------------ */
/*  History records                                                   */
/* ------------------------------------------------------------------ */

export interface MedicineHistory {
	id: string;
	userId: string;
	imageUrl: string;
	medicineName: string | null;
	analysisResult: { description: string };
	createdAt: string;
}

export interface PrescriptionHistory {
	id: string;
	userId: string;
	imageUrl: string;
	extractedText: string;
	analysisResult: { description: string; medicines: string[] };
	createdAt: string;
}

export interface DrugInteractionHistory {
	id: string;
	userId: string;
	drugs: string[];
	interactionResult: { description: string };
	createdAt: string;
}

export interface SymptomAnalysisHistory {
	id: string;
	userId: string;
	symptoms: string[];
	imageUrl: string | null;
	duration: string | null;
	needMoreInfo: boolean;
	suggestedSymptoms: string[];
	followUpMessage: string | null;
	relationship: unknown | null;
	insight: unknown | null;
	predictedConditions: unknown; // JSON — array of conditions from AI
	urgencyLevel: string;
	recommendedSpecialist: string;
	severity: string | null;
	reasoning: string | null;
	homeRemedies: string[];
	createdAt: string;
}

export type HistoryType = "medicine" | "prescription" | "interaction" | "symptom";

/* ------------------------------------------------------------------ */
/*  AI Health Tool responses                                          */
/* ------------------------------------------------------------------ */

/** `POST /api/ai/medicine` response. */
export interface MedicineAnalysisResponse {
	description: string;
}

/** `POST /api/ai/prescription` response. */
export interface PrescriptionAnalysisResponse {
	description: string;
	medicines: string[];
}

/** `POST /api/ai/drug-interaction` response. */
export interface DrugInteractionResponse {
	description: string;
	mode?: "personalized" | "direct";
	severity?: "none" | "mild" | "moderate" | "severe";
	riskScore?: number;
}

/** `GET /api/disease/info` response. */
export interface DiseaseInfo {
	name: string;
	description: string;
	symptoms: string[];
	causes: string[];
	prevention: string[];
	treatment: string[];
	whenToSeeDoctor: string;
}

/* ------------------------------------------------------------------ */
/*  Dashboard insights                                                */
/* ------------------------------------------------------------------ */

export interface DashboardTrendPoint {
	reportId: string;
	date: string;
	value: number;
	status: string;
	referenceMin: number | null;
	referenceMax: number | null;
}

export interface DashboardTrendSeries {
	componentName: string;
	unit: string | null;
	points: DashboardTrendPoint[];
	latestValue: number | null;
	previousValue: number | null;
	delta: number | null;
	deltaPercent: number | null;
	trendDirection: "up" | "down" | "stable";
	latestStatus: string;
}

export interface DashboardTimelinePoint {
	reportId: string;
	date: string;
	criticalCount: number;
	highCount: number;
	lowCount: number;
	borderlineCount: number;
	normalCount: number;
	totalCount: number;
}

export interface DashboardInsightCard {
	componentName: string;
	title: string;
	message: string;
	severity: "high" | "moderate" | "info";
	direction: "up" | "down" | "stable";
}

export interface DashboardMedicineSummaryItem {
	name: string;
	count: number;
	lastSeenAt: string;
}

export interface DashboardRecentActivityItem {
	id: string;
	type: "medicine" | "prescription" | "interaction" | "symptom";
	title: string;
	subtitle: string;
	date: string;
}

export interface DashboardInsightsResponse {
	generatedAt: string;
	meta: {
		reportWindow: 3 | 6 | 12 | number;
	};
	snapshot: {
		profileComplete: boolean;
		healthScore: number | null;
		lastLabReportAt: string | null;
		totalLabReports: number;
		totalPrescriptionScans: number;
		highRiskComponents: number;
		abnormalComponents: number;
		latestOverallRisk: string | null;
	};
	prescribedMedicines: {
		recent: DashboardMedicineSummaryItem[];
		frequent: DashboardMedicineSummaryItem[];
		lastPrescriptionAt: string | null;
	};
	labTrends: {
		series: DashboardTrendSeries[];
		timeline: DashboardTimelinePoint[];
		insights: DashboardInsightCard[];
	};
	recentActivity: DashboardRecentActivityItem[];
}

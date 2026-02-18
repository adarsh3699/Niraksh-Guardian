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
	predictedConditions: unknown; // JSON — array of conditions from AI
	urgencyLevel: string;
	recommendedSpecialist: string;
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

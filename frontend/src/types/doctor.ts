/* ------------------------------------------------------------------ */
/*  Doctor & Symptom Analysis types                                   */
/* ------------------------------------------------------------------ */

export interface Doctor {
	id: string;
	name: string;
	specialization: string;
	qualification: string | null;
	experienceYears: number;
	consultationFee: number;
	rating: number;
	city: string;
	state: string;
	bio: string;
	contactInfo: string;
	phone: string | null;
	imageUrl: string | null;
	isAvailable: boolean;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

/** Query parameters for `GET /api/doctors`. */
export interface DoctorSearchParams {
	search?: string;
	/** Single specialization or comma-separated list for multi-specialist queries */
	specialization?: string;
	city?: string;
	state?: string;
	minFee?: number;
	maxFee?: number;
	sortBy?: "name" | "experience" | "fee" | "rating";
	order?: "asc" | "desc";
	page?: number;
	limit?: number;
}

/** Response from `POST /api/ai/analyze`. */
export interface SymptomAnalysis {
	possibleConditions: string[];
	severity: "Mild" | "Moderate" | "Severe" | "Emergency";
	urgency: "Home Care" | "Doctor Visit" | "Emergency Room";
	reasoning: string;
	/** Array of 1–3 specialist names, each matching a known DB specialization */
	recommendedSpecialists: string[];
	homeRemedies: string[];
}

/** Request/response for `POST /api/ai/summarize-symptoms`. */
export interface SymptomSummaryRequest {
	chatId: string;
}

export interface SymptomSummaryResponse {
	summary: string;
	status: "success" | "non_medical";
}

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
	/** Computed relevance score — present only when matchTags/location params were sent */
	_relevanceScore?: number;
	/** True when the doctor's city matches the user's city */
	_isNearby?: boolean;
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
	/** Comma-separated condition/tag keywords from symptom analysis for relevance scoring */
	matchTags?: string;
	/** User's city — enables location-based boosting in relevance sort */
	userCity?: string;
	/** User's state — enables location-based boosting in relevance sort */
	userState?: string;
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

/* ------------------------------------------------------------------ */
/*  Symptom Relationship Intelligence (SRI) types                     */
/* ------------------------------------------------------------------ */

export interface SymptomRelationshipEdge {
	from: string;
	to: string;
	relation: string;
}

export interface SymptomRelationshipGraph {
	nodes: string[];
	edges: SymptomRelationshipEdge[];
	cluster: { name: string; description: string };
}

export interface SymptomInsightData {
	category: string;
	severity: "Mild" | "Moderate" | "Severe" | "Emergency";
	affectedSystem: string;
	summary: string;
}

export interface SymptomRelationshipResponse {
	symptoms: string[];
	duration: string | null;
	needMoreInfo: boolean;
	// needMoreInfo=true fields
	suggestedSymptoms?: string[];
	message?: string;
	// needMoreInfo=false fields
	relationship?: SymptomRelationshipGraph;
	insight?: SymptomInsightData;
	// Legacy analysis — always present
	analysis?: SymptomAnalysis;
}

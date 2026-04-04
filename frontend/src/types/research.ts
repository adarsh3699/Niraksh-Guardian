export type ResearchSource = "PubMed" | "Semantic Scholar";

export interface ResearchPaper {
	id: string;
	source: ResearchSource;
	title: string;
	authors: string[];
	journal: string;
	year: string;
	abstract: string;
	url: string;
	citationCount?: number;
	retrievalScore?: number;
	retrievalSignals?: string[];
}

export interface ResearchRagSummary {
	enabled: boolean;
	method: "semantic+lexical" | "lexical";
	confidence: "high" | "medium" | "low";
	summary: string;
	citations: string[];
}

export interface ResearchMetadata {
	totalCandidates: number;
	returned: number;
	keywordJoinerUsed: "AND" | "OR";
	embeddingsUsed: boolean;
}

export interface ResearchResponse {
	contractVersion: "1.0";
	papers: ResearchPaper[];
	keywords: string[];
	rag: ResearchRagSummary;
	metadata: ResearchMetadata;
}

export interface ResearchErrorResponse {
	error: {
		code:
			| "RESEARCH_QUERY_INVALID"
			| "RESEARCH_QUERY_REQUIRED"
			| "RESEARCH_CONTRACT_ERROR"
			| "RESEARCH_FETCH_FAILED";
		message: string;
		details?: unknown;
	};
}

import { z } from "zod";

export const researchSourceSchema = z.enum(["PubMed", "Semantic Scholar"]);

export const researchPaperSchema = z.object({
	id: z.string().min(1),
	source: researchSourceSchema,
	title: z.string().min(1),
	authors: z.array(z.string()),
	journal: z.string(),
	year: z.string(),
	abstract: z.string(),
	url: z.string().url(),
	citationCount: z.number().int().nonnegative().optional(),
	retrievalScore: z.number().min(0).max(1).optional(),
	retrievalSignals: z.array(z.string()).optional(),
});

export const researchRagSummarySchema = z.object({
	enabled: z.boolean(),
	method: z.enum(["semantic+lexical", "lexical"]),
	confidence: z.enum(["high", "medium", "low"]),
	summary: z.string(),
	citations: z.array(z.string()),
});

export const researchMetadataSchema = z.object({
	totalCandidates: z.number().int().nonnegative(),
	returned: z.number().int().nonnegative(),
	keywordJoinerUsed: z.enum(["AND", "OR"]),
	embeddingsUsed: z.boolean(),
});

export const researchResponseSchema = z.object({
	contractVersion: z.literal("1.0"),
	papers: z.array(researchPaperSchema),
	keywords: z.array(z.string()),
	rag: researchRagSummarySchema,
	metadata: researchMetadataSchema,
});

const queryLimitSchema = z
	.preprocess((value) => {
		if (typeof value === "string" && value.trim() !== "") {
			return Number.parseInt(value, 10);
		}
		if (typeof value === "number") {
			return value;
		}
		return undefined;
	}, z.number().int().min(1).max(10).optional())
	.optional();

export const researchQuerySchema = z.object({
	q: z.string().trim().min(2, "Query must be at least 2 characters").max(300),
	maxPerSource: queryLimitSchema,
});

export const researchErrorResponseSchema = z.object({
	error: z.object({
		code: z.enum([
			"RESEARCH_QUERY_INVALID",
			"RESEARCH_QUERY_REQUIRED",
			"RESEARCH_CONTRACT_ERROR",
			"RESEARCH_FETCH_FAILED",
		]),
		message: z.string(),
		details: z.unknown().optional(),
	}),
});

export type ResearchResponse = z.infer<typeof researchResponseSchema>;

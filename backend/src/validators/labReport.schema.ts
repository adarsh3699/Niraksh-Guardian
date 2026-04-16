import { z } from "zod";

// Related condition schema for nested validation
const relatedConditionSchema = z.object({
	name: z.string(),
	description: z.string(),
	riskLevel: z.enum(["low", "moderate", "high"]),
});

// Extended LabReportComponent schema with new fields
export const labReportComponentSchema = z.object({
	id: z.string().uuid().optional(),
	reportId: z.string().uuid(),
	componentName: z.string().min(1, "Component name is required"),
	observedValue: z.number().nullable().optional(),
	observedRaw: z.string().nullable().optional(),
	unit: z.string().nullable().optional(),
	referenceMin: z.number().nullable().optional(),
	referenceMax: z.number().nullable().optional(),
	status: z.enum(["critical", "high", "borderline", "normal", "low", "unknown"]),
	effectSummary: z.string().nullable().optional(),
	riskTag: z.string().nullable().optional(),
	confidence: z.number().min(0).max(1).nullable().optional(),
	sourceSnippet: z.string().nullable().optional(),
	// New fields for lab analysis enhancements
	category: z.string().nullable().optional(),
	aiInsight: z.string().nullable().optional(),
	urgency: z.enum(["immediate", "monitor", "routine"]).nullable().optional(),
	symptomConnections: z.array(z.string()).default([]),
	relatedConditions: z.array(relatedConditionSchema).nullable().optional(),
	trend: z.array(z.number()).default([]),
	whatToDoNext: z.string().nullable().optional(),
	createdAt: z.string().datetime().optional(),
});

// Schema for adding a note to a lab component
export const addNoteRequestSchema = z.object({
	componentId: z.string().uuid("Invalid component ID"),
	note: z.string().min(1, "Note cannot be empty").max(1000, "Note cannot exceed 1000 characters"),
});

// Schema for updating a note
export const updateNoteRequestSchema = z.object({
	noteId: z.string().uuid("Invalid note ID"),
	note: z.string().min(1, "Note cannot be empty").max(1000, "Note cannot exceed 1000 characters"),
});

// Schema for share report response
export const shareReportResponseSchema = z.object({
	shareLink: z.string().url("Invalid share link"),
	expiresAt: z.string().datetime("Invalid expiration date"),
});

// Schema for previous report response
export const previousReportResponseSchema = z.object({
	reportId: z.string().uuid(),
	components: z.array(labReportComponentSchema),
	createdAt: z.string().datetime(),
});

// Schema for lab report analysis request
export const labReportAnalysisRequestSchema = z.object({
	file: z.any(), // File validation handled by multer
});

// Export types for TypeScript
export type LabReportComponent = z.infer<typeof labReportComponentSchema>;
export type AddNoteRequest = z.infer<typeof addNoteRequestSchema>;
export type UpdateNoteRequest = z.infer<typeof updateNoteRequestSchema>;
export type ShareReportResponse = z.infer<typeof shareReportResponseSchema>;
export type PreviousReportResponse = z.infer<typeof previousReportResponseSchema>;

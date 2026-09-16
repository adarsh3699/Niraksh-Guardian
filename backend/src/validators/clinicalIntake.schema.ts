import { z } from "zod";

const textField = (max: number) => z.string().trim().max(max).optional().default("");

export const hpiSchema = z.object({
	onset: textField(120),
	duration: textField(120),
	severity: textField(80),
	location: textField(160),
	character: textField(160),
	aggravatingFactors: textField(500),
	relievingFactors: textField(500),
	associatedSymptoms: textField(800),
	previousTreatment: textField(800),
});

export const rosSchema = z.object({
	general: textField(500),
	respiratory: textField(500),
	cardiac: textField(500),
	gastrointestinal: textField(500),
	neurological: textField(500),
	endocrine: textField(500),
	other: textField(500),
});

export const clinicalIntakeSchema = z.object({
	appointmentId: z.string().uuid().nullable().optional(),
	chiefComplaint: z.string().trim().min(2).max(1000),
	hpi: hpiSchema,
	ros: rosSchema,
	medicationNotes: z.string().trim().max(1500).optional().default(""),
	allergyNotes: z.string().trim().max(1000).optional().default(""),
	consentGiven: z.boolean(),
	submit: z.boolean().default(false),
});

export const clinicalSummaryUpdateSchema = z.object({
	intakeId: z.string().uuid(),
	summary: z.string().trim().min(20).max(10000),
});

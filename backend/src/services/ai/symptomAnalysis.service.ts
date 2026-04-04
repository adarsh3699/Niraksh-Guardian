import env from "../../config/env";
import logger from "../../config/logger";

let aiClientPromise: Promise<any> | null = null;

async function getAiClient() {
	if (!aiClientPromise) {
		aiClientPromise = import("@google/genai").then(
			({ GoogleGenAI }) => new GoogleGenAI({ apiKey: env.GEMINI_API_KEY || "" })
		);
	}
	return aiClientPromise;
}

const ai = {
	models: {
		generateContent: async (params: any) => {
			const client = await getAiClient();
			return client.models.generateContent(params);
		},
	},
};
const MODEL_NAME = "gemini-2.5-flash";

const KNOWN_SPECIALISTS = [
	"General Physician",
	"Cardiologist",
	"Dermatologist",
	"Orthopedic Surgeon",
	"Gynecologist",
	"Pediatrician",
	"Neurologist",
	"ENT Specialist",
	"Ophthalmologist",
	"Psychiatrist",
	"Dentist",
	"Gastroenterologist",
	"Urologist",
	"Pulmonologist",
	"Endocrinologist",
	"Nephrologist",
	"Oncologist",
	"Rheumatologist",
	"General Surgeon",
	"Physiotherapist",
] as const;

export type KnownSpecialist = (typeof KNOWN_SPECIALISTS)[number];

/* ------------------------------------------------------------------ */
/*  Shared JSON extraction helper                                     */
/* ------------------------------------------------------------------ */

function extractJson(text: string): unknown {
	const match = text
		.replace(/```json/g, "")
		.replace(/```/g, "")
		.trim()
		.match(/\{[\s\S]*\}/);
	if (!match) throw new Error("Invalid AI response format");
	try {
		return JSON.parse(match[0]);
	} catch {
		throw new Error("Invalid AI response format");
	}
}

/* ------------------------------------------------------------------ */
/*  1. extractSymptoms                                                */
/* ------------------------------------------------------------------ */

export interface ExtractedSymptoms {
	symptoms: string[];
	duration: string | null;
	severity: string | null;
}

export async function extractSymptoms(
	input: string,
	imageBuffer?: Buffer,
	mimeType?: string
): Promise<ExtractedSymptoms> {
	const textPrompt = `Extract medical symptoms from the following patient description and/or attached image. Return valid JSON only, no markdown.

Patient description: "${input}"

Output structure:
{
  "symptoms": ["symptom1", "symptom2"],
  "duration": "e.g. 3 days or null if not mentioned",
  "severity": "e.g. mild, severe or null if not mentioned"
}

Rules:
- symptoms must be lowercase strings
- symptoms array may be empty if no medical symptoms found
- analyze the attached image for visible symptoms if provided
- duration and severity are strings or null`;

	const parts: any[] = [{ text: textPrompt }];
	if (imageBuffer && mimeType) {
		parts.push({
			inlineData: { data: imageBuffer.toString("base64"), mimeType },
		});
	}

	const result = await ai.models.generateContent({
		model: MODEL_NAME,
		config: {
			systemInstruction:
				"You are a medical symptom extraction assistant. Analyze images and text to extract symptoms. Only respond with valid JSON.",
		},
		contents: [{ role: "user", parts }],
	});

	const parsed = extractJson(result.text || "") as Record<string, unknown>;

	if (!Array.isArray(parsed.symptoms)) {
		throw new Error("Unexpected AI response structure");
	}

	return {
		symptoms: (parsed.symptoms as unknown[])
			.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
			.map((s) => s.toLowerCase().trim()),
		duration: typeof parsed.duration === "string" && parsed.duration.trim() ? parsed.duration.trim() : null,
		severity: typeof parsed.severity === "string" && parsed.severity.trim() ? parsed.severity.trim() : null,
	};
}

/* ------------------------------------------------------------------ */
/*  6. generateFullAnalysis — COMBINED: relationship + insight +       */
/*     specialist + diagnosis in ONE Gemini call (saves 3 API calls)   */
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

export type InsightSeverity = "Mild" | "Moderate" | "Severe" | "Emergency";

export interface SymptomInsightData {
	category: string;
	severity: InsightSeverity;
	affectedSystem: string;
	summary: string;
}

const VALID_SEVERITIES: InsightSeverity[] = ["Mild", "Moderate", "Severe", "Emergency"];

export interface FullAnalysisResult {
	relationship: SymptomRelationshipGraph;
	insight: SymptomInsightData;
	diagnosis: {
		possibleConditions: string[];
		severity: "Mild" | "Moderate" | "Severe" | "Emergency";
		urgency: "Home Care" | "Doctor Visit" | "Emergency Room";
		reasoning: string;
		recommendedSpecialists: string[];
		homeRemedies: string[];
	};
}

export async function generateFullAnalysis(
	symptoms: string[],
	imageBuffer?: Buffer,
	mimeType?: string
): Promise<FullAnalysisResult> {
	const textPrompt = `Perform a comprehensive analysis of these symptoms: ${symptoms.join(", ")}.

Return valid JSON only, no markdown. Combine all analyses into a single response.

You MUST choose recommendedSpecialists ONLY from this exact list:
${KNOWN_SPECIALISTS.join(", ")}

Output structure:
{
  "relationship": {
    "nodes": ["symptom1", "symptom2"],
    "edges": [
      { "from": "symptom1", "to": "symptom2", "relation": "clinical relationship description" }
    ],
    "cluster": {
      "name": "Pattern name e.g. Respiratory Viral Pattern",
      "description": "Brief explanation of why these symptoms occur together"
    }
  },
  "insight": {
    "category": "e.g. Viral, Bacterial, Neurological, Cardiovascular",
    "severity": "Mild | Moderate | Severe | Emergency",
    "affectedSystem": "e.g. Respiratory, Neurological, Digestive, Cardiovascular",
    "summary": "2-3 sentence clinical summary"
  },
  "diagnosis": {
    "possibleConditions": ["Condition 1", "Condition 2"],
    "severity": "Mild | Moderate | Severe | Emergency",
    "urgency": "Home Care | Doctor Visit | Emergency Room",
    "reasoning": "Brief clinical reasoning based on the symptom relationships, clinical insight, and the attached image if provided",
    "recommendedSpecialists": ["Specialist from the list above"],
    "homeRemedies": ["Remedy 1", "Remedy 2"]
  }
}

Rules:
- relationship.nodes must include all provided symptoms
- every edge from/to must reference a value in nodes
- insight.severity must be exactly one of: Mild, Moderate, Severe, Emergency
- diagnosis.possibleConditions MUST be informed by the symptom relationship pattern, clinical insight, and any attached image
- recommendedSpecialists: return 1–3 from the allowed list
- diagnosis.reasoning should reference the symptom relationship patterns and any visible signs in the image`;

	const parts: any[] = [{ text: textPrompt }];
	if (imageBuffer && mimeType) {
		parts.push({
			inlineData: { data: imageBuffer.toString("base64"), mimeType },
		});
	}

	const result = await ai.models.generateContent({
		model: MODEL_NAME,
		config: {
			systemInstruction:
				"You are an expert clinical medical AI (Niraksh Guardian). Consider both the text symptoms and any attached image in your analysis. Only respond with valid JSON.",
		},
		contents: [{ role: "user", parts }],
	});

	const parsed = extractJson(result.text || "") as Record<string, unknown>;

	// Validate relationship
	const rel = parsed.relationship as Record<string, unknown>;
	if (
		!rel ||
		!Array.isArray(rel.nodes) ||
		!Array.isArray(rel.edges) ||
		typeof rel.cluster !== "object" ||
		rel.cluster === null
	) {
		throw new Error("Unexpected AI response structure");
	}
	const nodes = (rel.nodes as unknown[]).filter((n): n is string => typeof n === "string");
	const nodeSet = new Set(nodes);
	const edges = (rel.edges as unknown[]).filter((e): e is SymptomRelationshipEdge => {
		if (typeof e !== "object" || e === null) return false;
		const edge = e as Record<string, unknown>;
		return (
			typeof edge.from === "string" &&
			typeof edge.to === "string" &&
			typeof edge.relation === "string" &&
			nodeSet.has(edge.from) &&
			nodeSet.has(edge.to)
		);
	});
	const cluster = rel.cluster as Record<string, unknown>;
	if (typeof cluster.name !== "string" || typeof cluster.description !== "string") {
		throw new Error("Unexpected AI response structure");
	}

	// Validate insight
	const ins = parsed.insight as Record<string, unknown>;
	if (
		!ins ||
		typeof ins.category !== "string" ||
		typeof ins.severity !== "string" ||
		typeof ins.affectedSystem !== "string" ||
		typeof ins.summary !== "string"
	) {
		throw new Error("Unexpected AI response structure");
	}
	if (!VALID_SEVERITIES.includes(ins.severity as InsightSeverity)) {
		throw new Error("Unexpected AI response structure");
	}

	// Validate diagnosis
	const diag = parsed.diagnosis as Record<string, unknown>;
	if (
		!diag ||
		!Array.isArray(diag.possibleConditions) ||
		typeof diag.severity !== "string" ||
		typeof diag.urgency !== "string" ||
		typeof diag.reasoning !== "string"
	) {
		throw new Error("Unexpected AI response structure");
	}
	if (!Array.isArray(diag.recommendedSpecialists)) {
		diag.recommendedSpecialists = diag.recommendedSpecialist
			? [diag.recommendedSpecialist as string]
			: ["General Physician"];
	}

	return {
		relationship: { nodes, edges, cluster: { name: cluster.name, description: cluster.description } },
		insight: {
			category: ins.category,
			severity: ins.severity as InsightSeverity,
			affectedSystem: ins.affectedSystem,
			summary: ins.summary,
		},
		diagnosis: {
			possibleConditions: diag.possibleConditions as string[],
			severity: diag.severity as "Mild" | "Moderate" | "Severe" | "Emergency",
			urgency: diag.urgency as "Home Care" | "Doctor Visit" | "Emergency Room",
			reasoning: diag.reasoning as string,
			recommendedSpecialists: diag.recommendedSpecialists as string[],
			homeRemedies: Array.isArray(diag.homeRemedies) ? (diag.homeRemedies as string[]) : [],
		},
	};
}

/* ------------------------------------------------------------------ */
/*  7. generateSuggestionsWithDiagnosis — COMBINED: suggestions +     */
/*     diagnosis in ONE Gemini call (saves 1 API call)                */
/* ------------------------------------------------------------------ */

export interface SuggestionWithDiagnosisResult {
	suggestions: string[];
	diagnosis: {
		possibleConditions: string[];
		severity: "Mild" | "Moderate" | "Severe" | "Emergency";
		urgency: "Home Care" | "Doctor Visit" | "Emergency Room";
		reasoning: string;
		recommendedSpecialists: string[];
		homeRemedies: string[];
	};
}

export async function generateSuggestionsWithDiagnosis(
	symptoms: string[],
	imageBuffer?: Buffer,
	mimeType?: string
): Promise<SuggestionWithDiagnosisResult> {
	const textPrompt = `A patient has reported these symptoms: ${symptoms.join(", ")}.

Perform TWO tasks and return the combined result as valid JSON only, no markdown.

You MUST choose recommendedSpecialists ONLY from this exact list:
${KNOWN_SPECIALISTS.join(", ")}

Output structure:
{
  "suggestions": ["symptom1", "symptom2", "symptom3"],
  "diagnosis": {
    "possibleConditions": ["Condition 1", "Condition 2"],
    "severity": "Mild | Moderate | Severe | Emergency",
    "urgency": "Home Care | Doctor Visit | Emergency Room",
    "reasoning": "Brief clinical reasoning based on the symptom patterns and the attached image if provided...",
    "recommendedSpecialists": ["Specialist from the list above"],
    "homeRemedies": ["Remedy 1", "Remedy 2"]
  }
}

Rules:
- suggestions: 3-6 additional symptoms the patient might also be experiencing, clinically related, lowercase
- do not include any already-reported symptoms in suggestions: ${symptoms.join(", ")}
- diagnosis: standard symptom analysis based on the reported symptoms and any attached image
- recommendedSpecialists: 1–3 from the allowed list`;

	const parts: any[] = [{ text: textPrompt }];
	if (imageBuffer && mimeType) {
		parts.push({
			inlineData: { data: imageBuffer.toString("base64"), mimeType },
		});
	}

	const result = await ai.models.generateContent({
		model: MODEL_NAME,
		config: {
			systemInstruction:
				"You are an expert clinical medical AI (Niraksh Guardian). Consider both the text symptoms and any attached image in your analysis. Only respond with valid JSON.",
		},
		contents: [{ role: "user", parts }],
	});

	const parsed = extractJson(result.text || "") as Record<string, unknown>;

	// Validate suggestions
	const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
	const suggestions = (rawSuggestions as unknown[])
		.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
		.map((s) => s.toLowerCase().trim())
		.filter((s) => !symptoms.includes(s))
		.slice(0, 6);

	// Validate diagnosis
	const diag = parsed.diagnosis as Record<string, unknown>;
	if (
		!diag ||
		!Array.isArray(diag.possibleConditions) ||
		typeof diag.severity !== "string" ||
		typeof diag.urgency !== "string" ||
		typeof diag.reasoning !== "string"
	) {
		throw new Error("Unexpected AI response structure");
	}
	if (!Array.isArray(diag.recommendedSpecialists)) {
		diag.recommendedSpecialists = diag.recommendedSpecialist
			? [diag.recommendedSpecialist as string]
			: ["General Physician"];
	}

	return {
		suggestions,
		diagnosis: {
			possibleConditions: diag.possibleConditions as string[],
			severity: diag.severity as "Mild" | "Moderate" | "Severe" | "Emergency",
			urgency: diag.urgency as "Home Care" | "Doctor Visit" | "Emergency Room",
			reasoning: diag.reasoning as string,
			recommendedSpecialists: diag.recommendedSpecialists as string[],
			homeRemedies: Array.isArray(diag.homeRemedies) ? (diag.homeRemedies as string[]) : [],
		},
	};
}

export { KNOWN_SPECIALISTS };

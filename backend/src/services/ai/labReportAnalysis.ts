import env from "../../config/env";
import logger from "../../config/logger";
import { extractJsonObjectString } from "./utils/jsonParser";
import { getCategoryWithFallback, type LabCategory } from "../../utils/categoryClassifier";

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
const MODEL_NAME = "gemini-3.1-flash-lite";

export type LabComponentStatus = "critical" | "high" | "borderline" | "normal" | "low" | "unknown";

export interface RelatedCondition {
	name: string;
	description: string;
	riskLevel: "low" | "moderate" | "high";
}

export interface ParsedLabComponent {
	componentName: string;
	observedRaw: string;
	observedValue: number | null;
	unit: string | null;
	referenceMin: number | null;
	referenceMax: number | null;
	status: LabComponentStatus;
	effectSummary: string;
	riskTag: string;
	confidence: number;
	sourceSnippet: string;
	category: LabCategory;
	aiInsight: string | null;
	urgency: string | null;
	symptomConnections: string[];
	relatedConditions: RelatedCondition[];
	whatToDoNext: string | null;
}

export interface LabReportAnalysisResult {
	extractedText: string;
	overallSummary: string;
	overallRisk: "low" | "moderate" | "high";
	abnormalCount: number;
	totalCount: number;
	components: ParsedLabComponent[];
}

function parseNumber(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string") return null;

	const normalized = value
		.replace(/,/g, "")
		.replace(/[^0-9.+-]/g, " ")
		.trim()
		.split(/\s+/)[0];

	if (!normalized) return null;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseRange(value: unknown): { min: number | null; max: number | null } | null {
	if (typeof value !== "string") return null;
	const text = value.trim();
	if (!text) return null;

	const match = text.match(/(-?\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(-?\d+(?:\.\d+)?)/i);
	if (!match) return null;

	const min = Number(match[1]);
	const max = Number(match[2]);
	if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

	return { min, max };
}

function resolveReferenceBounds(rawMin: unknown, rawMax: unknown): { min: number | null; max: number | null } {
	const fromMin = parseRange(rawMin);
	if (fromMin) return fromMin;

	const fromMax = parseRange(rawMax);
	if (fromMax) return fromMax;

	return {
		min: parseNumber(rawMin),
		max: parseNumber(rawMax),
	};
}

function parseStatus(value: unknown): LabComponentStatus {
	if (typeof value !== "string") return "unknown";
	const key = value.trim().toLowerCase();
	if (key.includes("critical")) return "critical";
	if (key.includes("high")) return "high";
	if (key.includes("low")) return "low";
	if (key.includes("borderline")) return "borderline";
	if (key.includes("normal")) return "normal";
	return "unknown";
}

function classifyStatus(value: number | null, min: number | null, max: number | null): LabComponentStatus {
	if (value === null || (min === null && max === null)) return "unknown";

	// Critical: >150% of upper limit OR <50% of lower limit
	if (max !== null && value > max * 1.5) return "critical";
	if (min !== null && value < min * 0.5) return "critical";

	// High: above upper limit but not critical
	if (max !== null && value > max) return "high";

	// Low: below lower limit but not critical
	if (min !== null && value < min) return "low";

	// Borderline: within 10% of either boundary
	if (min !== null && max !== null) {
		const range = max - min;
		const lowerBoundary = min + range * 0.1;
		const upperBoundary = max - range * 0.1;

		if (value < lowerBoundary || value > upperBoundary) {
			return "borderline";
		}
	}

	// Normal: within safe range
	return "normal";
}

function fallbackEffect(name: string, status: LabComponentStatus): string {
	if (status === "normal") return `${name} is within reference limits in this report.`;
	if (status === "low")
		return `${name} is below the reference range and may indicate reduced physiological function; correlate clinically.`;
	if (status === "high")
		return `${name} is above the reference range and may indicate increased physiological stress; clinical follow-up is advised.`;
	return `Unable to confidently classify ${name} from the uploaded report.`;
}

function deriveOverallRisk(components: ParsedLabComponent[]): "low" | "moderate" | "high" {
	const abnormal = components.filter((c) => c.status === "high" || c.status === "low");
	const highCount = components.filter((c) => c.status === "high").length;
	if (!abnormal.length) return "low";
	if (abnormal.length >= 4 || highCount >= 3) return "high";
	return "moderate";
}

function normalizeConfidence(value: unknown): number {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return 0.5;
	return Math.max(0, Math.min(1, n));
}

function normalizeComponentKey(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function dedupeComponents(components: ParsedLabComponent[]): ParsedLabComponent[] {
	const map = new Map<string, ParsedLabComponent>();

	for (const component of components) {
		const key = normalizeComponentKey(component.componentName);
		if (!key) continue;

		const prev = map.get(key);
		if (!prev) {
			map.set(key, component);
			continue;
		}

		const prevCompleteness = Number(prev.referenceMin !== null) + Number(prev.referenceMax !== null);
		const nextCompleteness = Number(component.referenceMin !== null) + Number(component.referenceMax !== null);

		if (
			component.confidence > prev.confidence ||
			(component.confidence === prev.confidence && nextCompleteness > prevCompleteness)
		) {
			map.set(key, component);
		}
	}

	return Array.from(map.values());
}

export async function analyzeLabReportFile(fileBuffer: Buffer, mimeType: string): Promise<LabReportAnalysisResult> {
	if (!env.GEMINI_API_KEY) {
		throw new Error("GEMINI_API_KEY is not configured");
	}

	const prompt = `
You are a medical lab report extraction assistant.
Extract structured lab test rows from the attached report and return JSON only.

Strict JSON schema:
{
	"extractedText": "complete transcription of all readable report text, including patient/report metadata and every result row",
  "overallSummary": "4-6 lines summary with key abnormalities and likely risk tendency",
  "components": [
    {
      "componentName": "Creatinine",
      "observedRaw": "0.76",
      "unit": "mg/dL",
      "referenceMin": 0.5,
      "referenceMax": 1.2,
      "status": "critical|high|borderline|normal|low|unknown",
      "effectSummary": "short clinical implication in simple language",
      "riskTag": "renal|liver|metabolic|hematology|cardiac|electrolyte|other",
      "confidence": 0.0,
      "sourceSnippet": "short snippet from row used for extraction",
      "category": "Lipid Panel|Hematology|Thyroid|Metabolic|Liver|Kidney|Electrolytes|Vitamins|Hormones|Microbiology|Other",
      "aiInsight": "2-3 sentence plain-language explanation of health implications",
      "urgency": "immediate|monitor|routine",
      "symptomConnections": ["fatigue", "weakness"],
      "relatedConditions": [
        {
          "name": "Chronic Kidney Disease",
          "description": "Brief explanation of the condition",
          "riskLevel": "low|moderate|high"
        }
      ],
      "whatToDoNext": "2-3 sentence actionable guidance"
    }
  ]
}

Rules:
- Extract EVERY readable result row from the report. Do not return a representative subset.
- Include CBC sub-rows and calculated indices (for example TLC, DLC percentages, RBC, MCH, MCHC, RDW, MPV, and PCT), even when they are normal.
- Include qualitative and microbiology rows (for example Widal, culture, reactive/non-reactive, positive/negative) with observedRaw preserved exactly as shown; observedValue may be null for non-numeric results.
- Do not combine multiple rows into one component, omit normal rows, or infer values that are not visible.
- referenceMin/referenceMax may be null if unavailable.
- If observed value cannot be parsed, keep observedRaw and set status unknown.
- If reference interval is shown as a combined range (e.g. "21-43"), split into referenceMin/referenceMax numbers.
- Preserve the complete readable source in extractedText, not a short summary. Keep line breaks or row separators where possible.
- Before responding, compare the components array against the image and verify that every visible result row has exactly one component entry.
- Keep effectSummary concise and educational (not diagnosis).
- No markdown.

Status Classification Rules:
- critical: observed value >150% of upper reference limit OR <50% of lower reference limit
- high: above upper reference limit but not critical
- low: below lower reference limit but not critical
- borderline: within 10% of either reference boundary (upper or lower) but not outside the range
- normal: within safe range
- unknown: cannot determine reference range

Category Classification:
- Lipid Panel: Cholesterol, LDL, HDL, Triglycerides, VLDL
- Hematology: Hemoglobin, WBC, RBC, Platelets, Hematocrit, MCV, MCH, MCHC
- Thyroid: TSH, T3, T4, Free T3, Free T4
- Metabolic: Glucose, HbA1c, Creatinine, Urea, Uric Acid
- Liver: ALT, AST, Bilirubin, Alkaline Phosphatase, GGT, Total Protein, Albumin
- Kidney: Creatinine, Urea, eGFR, Albumin, BUN
- Electrolytes: Sodium, Potassium, Chloride, Calcium, Magnesium, Phosphate
- Vitamins: Vitamin D, Vitamin B12, Folate, Vitamin A, Vitamin E
- Hormones: Testosterone, Estrogen, Cortisol, Insulin, Prolactin, FSH, LH
- Microbiology: Culture results, sensitivity tests, bacterial counts
- Other: Any component not fitting the above categories

AI Insight Guidelines:
- Use plain language accessible to non-medical users
- Explain what the component measures and why it matters
- Indicate whether the value is concerning and why
- Avoid medical jargon where possible
- Be concise (2-3 sentences)

Urgency Classification:
- immediate: Critical values requiring urgent medical attention (e.g., critically high glucose, severely low hemoglobin)
- monitor: Abnormal values requiring follow-up within days/weeks (e.g., borderline cholesterol, slightly elevated liver enzymes)
- routine: Normal or borderline values for routine check-up

Symptom Connections:
- Identify symptoms commonly associated with abnormal values
- Examples: High Cholesterol → chest pain, shortness of breath; Low Hemoglobin → fatigue, weakness, pale skin, dizziness
- Return as array of strings

Related Conditions:
- List medical conditions associated with the component's abnormal value
- Include condition name, brief description, and risk level (low/moderate/high)
- Risk level should reflect the severity of the abnormal value

What To Do Next:
- Provide actionable guidance (2-3 sentences)
- Suggest lifestyle changes, follow-up tests, or specialist consultation as appropriate
- Be specific but not prescriptive (avoid direct medical advice)`;

	try {
		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: {
				systemInstruction:
					"You parse medical reports into reliable structured JSON with conservative interpretation.",
			},
			contents: [
				{
					role: "user",
					parts: [{ text: prompt }, { inlineData: { data: fileBuffer.toString("base64"), mimeType } }],
				},
			],
		});

		const raw = result.text || "";
		const jsonStr = extractJsonObjectString(raw);
		if (!jsonStr) throw new Error("Failed to parse structured lab JSON");

		const parsed = JSON.parse(jsonStr) as {
			extractedText?: unknown;
			overallSummary?: unknown;
			components?: Array<{
				componentName?: unknown;
				observedRaw?: unknown;
				unit?: unknown;
				referenceMin?: unknown;
				referenceMax?: unknown;
				status?: unknown;
				effectSummary?: unknown;
				riskTag?: unknown;
				confidence?: unknown;
				sourceSnippet?: unknown;
				category?: unknown;
				aiInsight?: unknown;
				urgency?: unknown;
				symptomConnections?: unknown;
				relatedConditions?: unknown;
				whatToDoNext?: unknown;
			}>;
		};

		const normalizedComponents: ParsedLabComponent[] = (parsed.components || [])
			.map((item) => {
				const componentName = typeof item.componentName === "string" ? item.componentName.trim() : "";
				if (!componentName) return null;

				const observedRaw =
					typeof item.observedRaw === "string"
						? item.observedRaw.trim()
						: item.observedRaw !== undefined
							? String(item.observedRaw)
							: "";
				const observedValue = parseNumber(item.observedRaw);
				const { min: referenceMin, max: referenceMax } = resolveReferenceBounds(
					item.referenceMin,
					item.referenceMax
				);
				const aiStatus = parseStatus(item.status);
				const status =
					aiStatus !== "unknown" ? aiStatus : classifyStatus(observedValue, referenceMin, referenceMax);

				// Parse new fields with fallback classification
				const aiCategory =
					typeof item.category === "string" && item.category.trim() ? item.category.trim() : null;

				// Use fallback classifier if AI didn't provide a valid category
				const category = getCategoryWithFallback(aiCategory, componentName);

				const aiInsight =
					typeof item.aiInsight === "string" && item.aiInsight.trim() ? item.aiInsight.trim() : null;

				const urgency = typeof item.urgency === "string" && item.urgency.trim() ? item.urgency.trim() : null;

				const symptomConnections = Array.isArray(item.symptomConnections)
					? item.symptomConnections
							.filter((s): s is string => typeof s === "string")
							.map((s) => s.trim())
							.filter((s) => s.length > 0)
					: [];

				const relatedConditions: RelatedCondition[] = Array.isArray(item.relatedConditions)
					? item.relatedConditions
							.filter((c): c is any => typeof c === "object" && c !== null)
							.map((c) => ({
								name: typeof c.name === "string" ? c.name.trim() : "",
								description: typeof c.description === "string" ? c.description.trim() : "",
								riskLevel: ["low", "moderate", "high"].includes(c.riskLevel) ? c.riskLevel : "moderate",
							}))
							.filter((c) => c.name.length > 0)
					: [];

				const whatToDoNext =
					typeof item.whatToDoNext === "string" && item.whatToDoNext.trim() ? item.whatToDoNext.trim() : null;

				return {
					componentName,
					observedRaw,
					observedValue,
					unit: typeof item.unit === "string" && item.unit.trim() ? item.unit.trim() : null,
					referenceMin,
					referenceMax,
					status,
					effectSummary:
						typeof item.effectSummary === "string" && item.effectSummary.trim()
							? item.effectSummary.trim()
							: fallbackEffect(componentName, status),
					riskTag:
						typeof item.riskTag === "string" && item.riskTag.trim()
							? item.riskTag.trim().toLowerCase()
							: "other",
					confidence: normalizeConfidence(item.confidence),
					sourceSnippet:
						typeof item.sourceSnippet === "string" && item.sourceSnippet.trim()
							? item.sourceSnippet.trim().slice(0, 200)
							: `${componentName}: ${observedRaw}`.slice(0, 200),
					category,
					aiInsight,
					urgency,
					symptomConnections,
					relatedConditions,
					whatToDoNext,
				};
			})
			.filter((item): item is ParsedLabComponent => Boolean(item));

		const dedupedComponents = dedupeComponents(normalizedComponents);

		const abnormalCount = dedupedComponents.filter((c) => c.status === "high" || c.status === "low").length;
		const totalCount = dedupedComponents.length;
		const overallRisk = deriveOverallRisk(dedupedComponents);

		return {
			extractedText:
				typeof parsed.extractedText === "string"
					? parsed.extractedText
					: dedupedComponents.map((c) => `${c.componentName}: ${c.observedRaw}`).join("; "),
			overallSummary:
				typeof parsed.overallSummary === "string" && parsed.overallSummary.trim()
					? parsed.overallSummary.trim()
					: `Detected ${abnormalCount} abnormal components out of ${totalCount}. Overall risk tendency appears ${overallRisk}.`,
			overallRisk,
			abnormalCount,
			totalCount,
			components: dedupedComponents,
		};
	} catch (err) {
		logger.error({ err }, "Lab report analysis failed");
		throw new Error("Failed to analyze lab report");
	}
}

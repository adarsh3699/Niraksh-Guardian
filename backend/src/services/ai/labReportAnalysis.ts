import env from "../../config/env";
import logger from "../../config/logger";
import { extractJsonObjectString } from "./utils/jsonParser";

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

export type LabComponentStatus = "low" | "normal" | "high" | "unknown";

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
	if (key.includes("high")) return "high";
	if (key.includes("low")) return "low";
	if (key.includes("normal")) return "normal";
	return "unknown";
}

function classifyStatus(value: number | null, min: number | null, max: number | null): LabComponentStatus {
	if (value === null || (min === null && max === null)) return "unknown";
	if (min !== null && value < min) return "low";
	if (max !== null && value > max) return "high";
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
  "extractedText": "short extracted summary",
  "overallSummary": "4-6 lines summary with key abnormalities and likely risk tendency",
  "components": [
    {
      "componentName": "Creatinine",
      "observedRaw": "0.76",
      "unit": "mg/dL",
      "referenceMin": 0.5,
      "referenceMax": 1.2,
      "status": "low|normal|high|unknown",
      "effectSummary": "short clinical implication in simple language",
      "riskTag": "renal|liver|metabolic|hematology|cardiac|electrolyte|other",
			"confidence": 0.0,
			"sourceSnippet": "short snippet from row used for extraction"
    }
  ]
}

Rules:
- Include only medically meaningful test rows.
- referenceMin/referenceMax may be null if unavailable.
- If observed value cannot be parsed, keep observedRaw and set status unknown.
- If reference interval is shown as a combined range (e.g. "21-43"), split into referenceMin/referenceMax numbers.
- Keep effectSummary concise and educational (not diagnosis).
- No markdown.`;

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

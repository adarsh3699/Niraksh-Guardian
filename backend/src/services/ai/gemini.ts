import env from "../../config/env";
import logger from "../../config/logger";

const API_KEY = env.GEMINI_API_KEY || "";

type GeminiApiErrorLike = {
	status?: number;
	code?: string | number;
	message?: string;
	retryAfter?: number | string;
	retryAfterSeconds?: number | string;
	retryDelay?: number | string;
	error?: {
		status?: number;
		code?: string | number;
		message?: string;
		details?: Array<{ retryDelay?: string | number }>;
	};
};

export class GeminiStreamError extends Error {
	constructor(
		public readonly code: string,
		message: string,
		public readonly retryable: boolean,
		public readonly retryAfterSeconds?: number
	) {
		super(message);
		this.name = "GeminiStreamError";
	}
}

const parseRetryAfterSeconds = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) {
		return Math.ceil(value);
	}

	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return undefined;
	}

	if (/^\d+(\.\d+)?$/.test(trimmed)) {
		const asNumber = Number(trimmed);
		return Number.isFinite(asNumber) && asNumber > 0 ? Math.ceil(asNumber) : undefined;
	}

	const secondMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*s/i);
	if (secondMatch) {
		const seconds = Number(secondMatch[1]);
		return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
	}

	const minuteMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*m/i);
	if (minuteMatch) {
		const minutes = Number(minuteMatch[1]);
		if (Number.isFinite(minutes) && minutes > 0) {
			return Math.ceil(minutes * 60);
		}
	}

	const retryInMatch = trimmed.match(/retry in\s+(\d+)/i);
	if (retryInMatch) {
		const seconds = Number(retryInMatch[1]);
		return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
	}

	return undefined;
};

const normalizeStreamError = (error: unknown): GeminiStreamError => {
	const geminiError = error as GeminiApiErrorLike;
	const status =
		typeof geminiError?.status === "number"
			? geminiError.status
			: typeof geminiError?.error?.status === "number"
				? geminiError.error.status
				: undefined;

	const rawCode = geminiError?.code ?? geminiError?.error?.code ?? (status ? String(status) : undefined) ?? "";

	const code = typeof rawCode === "number" ? String(rawCode) : String(rawCode || "");
	const message =
		geminiError?.message ??
		geminiError?.error?.message ??
		(error instanceof Error ? error.message : "Failed to stream AI response");

	const retryAfterSeconds =
		parseRetryAfterSeconds(geminiError?.retryAfterSeconds) ??
		parseRetryAfterSeconds(geminiError?.retryAfter) ??
		parseRetryAfterSeconds(geminiError?.retryDelay) ??
		parseRetryAfterSeconds(geminiError?.error?.details?.[0]?.retryDelay) ??
		parseRetryAfterSeconds(message);

	const isRateLimited =
		status === 429 || /resource_exhausted|quota|rate[-_ ]?limit|too many requests|429/i.test(`${code} ${message}`);

	if (isRateLimited) {
		return new GeminiStreamError(
			"RESOURCE_EXHAUSTED",
			"AI quota exceeded. Please try again shortly.",
			true,
			retryAfterSeconds
		);
	}

	return new GeminiStreamError("INTERNAL_STREAM_ERROR", "Failed to stream AI response", false, retryAfterSeconds);
};

let aiClientPromise: Promise<any> | null = null;

async function getAiClient() {
	if (!aiClientPromise) {
		aiClientPromise = import("@google/genai").then(({ GoogleGenAI }) => new GoogleGenAI({ apiKey: API_KEY }));
	}
	return aiClientPromise;
}

const ai = {
	models: {
		generateContent: async (params: any) => {
			const client = await getAiClient();
			return client.models.generateContent(params);
		},
		generateContentStream: async (params: any) => {
			const client = await getAiClient();
			const streamFn = client?.models?.generateContentStream;
			if (typeof streamFn === "function") {
				return streamFn.call(client.models, params);
			}
			throw new Error("Gemini streaming is not supported by the current SDK/runtime");
		},
	},
};

// Constants
const MODEL_NAME = "gemini-2.5-flash"; // Explicitly using models/ prefix
const CHAT_SYSTEM_INSTRUCTION =
	"You are Niraksh AI, an empathetic and highly knowledgeable Smart Healthcare Assistant. Your primary goal is to quickly pinpoint the user's actual medical issue.\nWhen a user describes a symptom, DO NOT overwhelm them with multiple questions. Ask only 1 short, highly targeted, solution-based question at a time to narrow down the main cause (e.g., 'Does the pain worsen after eating?').\nOnce you clearly understand the specific issue, stop asking questions and provide a structured, easy-to-read guide with detailed clinical insights and recommendations.\nOnly discuss topics related to healthcare and medicine. If a user asks a non-medical question, politely decline by saying: 'As a Smart Healthcare Assistant, I can only discuss topics related to healthcare and medicine.'";

type ConversationMessage = { role: string; content: string };

const buildChatContents = (
	history: ConversationMessage[],
	newMessage: string,
	language: string,
	imageBuffer?: Buffer,
	mimeType?: string
) => {
	const contents: any[] = history.map((msg) => ({
		role: msg.role === "user" ? "user" : "model",
		parts: [{ text: msg.content }],
	}));

	const currentParts: any[] = [
		{
			text: language && language !== "en" ? `[Respond in ${language}] ${newMessage}` : newMessage,
		},
	];

	if (imageBuffer && mimeType) {
		currentParts.push({
			inlineData: {
				data: imageBuffer.toString("base64"),
				mimeType,
			},
		});
	}

	contents.push({
		role: "user",
		parts: currentParts,
	});

	return contents;
};

export const generateAIResponse = async (
	history: ConversationMessage[],
	newMessage: string,
	language: string = "en",
	imageBuffer?: Buffer,
	mimeType?: string
): Promise<string> => {
	try {
		if (!API_KEY) {
			throw new Error("GEMINI_API_KEY is not configured");
		}

		const contents = buildChatContents(history, newMessage, language, imageBuffer, mimeType);

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: {
				systemInstruction: CHAT_SYSTEM_INSTRUCTION,
			},
			contents,
		});

		return result.text || "";
	} catch (error) {
		logger.error({ err: error }, "Gemini API Error");
		throw new Error("Failed to generate AI response");
	}
};

export async function* generateAIResponseStream(
	history: ConversationMessage[],
	newMessage: string,
	language: string = "en",
	imageBuffer?: Buffer,
	mimeType?: string
): AsyncGenerator<string> {
	try {
		if (!API_KEY) {
			throw new Error("GEMINI_API_KEY is not configured");
		}

		const contents = buildChatContents(history, newMessage, language, imageBuffer, mimeType);

		const stream = await ai.models.generateContentStream({
			model: MODEL_NAME,
			config: {
				systemInstruction: CHAT_SYSTEM_INSTRUCTION,
			},
			contents,
		});

		let emittedText = "";
		for await (const chunk of stream) {
			const text = typeof chunk?.text === "string" ? chunk.text : "";
			if (!text) {
				continue;
			}

			if (text.startsWith(emittedText)) {
				const delta = text.slice(emittedText.length);
				emittedText = text;
				if (delta) {
					yield delta;
				}
				continue;
			}

			// Some SDK versions emit already-delta chunks; keep behavior robust.
			emittedText += text;
			yield text;
		}

		if (!emittedText.trim()) {
			throw new Error("Gemini stream returned no text");
		}
	} catch (error) {
		const normalizedError = normalizeStreamError(error);
		logger.error({ err: error, normalizedError }, "Gemini stream error");
		throw normalizedError;
	}
}

export const diagnoseSymptoms = async (
	symptoms: string[],
	language: string = "en",
	imageBuffer?: Buffer,
	mimeType?: string
): Promise<{
	possibleConditions: string[];
	severity: "Mild" | "Moderate" | "Severe" | "Emergency";
	urgency: "Home Care" | "Doctor Visit" | "Emergency Room";
	reasoning: string;
	recommendedSpecialists: string[];
	homeRemedies: string[];
}> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		const parts: any[] = [];

		// Add text prompt
		const promptText = `
        Act as an expert medical AI (Niraksh Guardian).
        Analyze the following symptoms: ${symptoms.join(", ")}.
        ${imageBuffer ? "Also analyze the attached medical image (e.g., skin rash, visible symptom)." : ""}

        Provide a structured analysis in JSON format ONLY. Do not include markdown code blocks.
        Language: ${language}.

        You MUST choose recommended specialists ONLY from this exact list:
        General Physician, Cardiologist, Dermatologist, Orthopedic Surgeon, Gynecologist,
        Pediatrician, Neurologist, ENT Specialist, Ophthalmologist, Psychiatrist, Dentist,
        Gastroenterologist, Urologist, Pulmonologist, Endocrinologist, Nephrologist,
        Oncologist, Rheumatologist, General Surgeon, Physiotherapist.

        Return 1–3 specialists that best match the symptoms and its possibleConditions. If the symptoms could indicate
        a serious condition (e.g. chest pain → Cardiologist + Pulmonologist), list all relevant ones.
        Only include General Physician if no more specific specialist fits.

        Output Structure:
        {
            "possibleConditions": ["Condition 1", "Condition 2", ...],
            "severity": "Mild" | "Moderate" | "Severe" | "Emergency",
            "urgency": "Home Care" | "Doctor Visit" | "Emergency Room",
            "reasoning": "Brief clinical reasoning...",
            "recommendedSpecialists": ["Specialist from the list above"],
            "homeRemedies": ["Remedy 1", "Remedy 2"]
        }
        `;
		parts.push({ text: promptText });

		// Add image if provided
		if (imageBuffer && mimeType) {
			parts.push({
				inlineData: {
					data: imageBuffer.toString("base64"),
					mimeType: mimeType,
				},
			});
		}

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			contents: [{ role: "user", parts }],
		});

		const text = result.text || "";

		// Robust JSON extraction
		let jsonStr = text
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
		const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);

		if (jsonMatch) {
			jsonStr = jsonMatch[0];
		} else {
			logger.warn({ text }, "Failed to extract JSON from AI response");
			throw new Error("Invalid AI response format");
		}

		const parsed = JSON.parse(jsonStr);

		// Normalise: AI might still return the old single-string field — coerce to array
		if (!Array.isArray(parsed.recommendedSpecialists)) {
			parsed.recommendedSpecialists = parsed.recommendedSpecialist
				? [parsed.recommendedSpecialist]
				: ["General Physician"];
			delete parsed.recommendedSpecialist;
		}

		return parsed;
	} catch (error) {
		logger.error({ err: error }, "Gemini Symptom Analysis Error");
		throw new Error("Failed to analyze symptoms");
	}
};

export const getDiseaseInfo = async (
	topic: string,
	language: string = "en"
): Promise<{
	name: string;
	description: string;
	symptoms: string[];
	causes: string[];
	prevention: string[];
	treatment: string[];
	whenToSeeDoctor: string;
}> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		const prompt = `
        Act as an expert medical AI (Niraksh Guardian). 
        Provide detailed information about the following disease/condition: "${topic}".
        
        Provide a structured analysis in JSON format ONLY. Do not include markdown code blocks.
        Language: ${language}.
        
        Output Structure:
        {
            "name": "Correct Medical Name",
            "description": "Comprehensive overview...",
            "symptoms": ["Symptom 1", "Symptom 2"],
            "causes": ["Cause 1", "Cause 2"],
            "prevention": ["Tip 1", "Tip 2"],
            "treatment": ["Treatment 1", "Treatment 2"],
            "whenToSeeDoctor": "Clear guidelines on when to seek help"
        }
        `;

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			contents: [{ role: "user", parts: [{ text: prompt }] }], // Explicit structure usually safer
		});

		const text = result.text || "";

		// Robust JSON extraction
		let jsonStr = text
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
		const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);

		if (jsonMatch) {
			jsonStr = jsonMatch[0];
		} else {
			logger.warn({ text }, "Failed to extract JSON from AI response (Education)");
			throw new Error("Invalid AI response format");
		}

		return JSON.parse(jsonStr);
	} catch (error: any) {
		logger.error({ err: error }, "Gemini Disease Info Error");
		throw new Error("Failed to get disease info");
	}
};

export const generateContent = async (prompt: string): Promise<string> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			contents: [{ role: "user", parts: [{ text: prompt }] }],
		});

		return result.text || "";
	} catch (error) {
		logger.error({ err: error }, "Gemini Generate Content Error");
		throw new Error("Failed to generate content");
	}
};

// --- Summarize Chat Symptoms for Doctor ---

export const summarizeChatForDoctor = async (
	messages: { role: string; content: string }[]
): Promise<{ summary: string; status: "success" | "non_medical" }> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		// Format the whole conversation history
		const formattedConversation = messages
			.map((msg) => `${msg.role === "user" ? "Patient" : "Niraksh AI"}: ${msg.content}`)
			.join("\n\n");

		if (!formattedConversation.trim()) {
			return {
				summary: "No messages found in the conversation.",
				status: "non_medical",
			};
		}

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: {
				systemInstruction: "Only talk about medical and healthcare",
			},
			contents: [
				{
					role: "user",
					parts: [
						{
							text: `Analyze the following patient-AI conversation thoroughly. Your task is to extract and summarize the patient's key symptoms, health concerns, and medical history into a clear, concise paragraph that would help a human doctor understand their condition rapidly.
Pay close attention to contexts elicited by Niraksh AI's questions. For example, if Niraksh AI asks "How long has the pain lasted?", and the Patient replies "3 days", you must infer the pain has lasted 3 days. Focus only on medical information and symptoms.

If the conversation contains NO medical symptoms or health concerns, respond with EXACTLY: "NON_MEDICAL"

Here is the conversation:

${formattedConversation}`,
						},
					],
				},
			],
		});

		// Safely extract text — result.text getter can throw on blocked/empty responses
		let summary = "";
		try {
			summary = (result.text || "").trim();
		} catch {
			logger.warn({ candidates: result.candidates }, "Gemini returned no usable text for symptom summary");
			return {
				summary: "Unable to analyze the conversation. Please try again.",
				status: "non_medical",
			};
		}

		if (
			summary === "NON_MEDICAL" ||
			summary.includes("not provided any medical information") ||
			summary.includes("not related to healthcare")
		) {
			return {
				summary: "This conversation does not contain any medical symptoms or health-related concerns.",
				status: "non_medical",
			};
		}

		return { summary, status: "success" };
	} catch (error) {
		logger.error({ err: error }, "Gemini Summarize Symptoms Error");
		throw new Error("Failed to summarize symptoms");
	}
};

// --- Health Tool AI Functions ---

export const analyzeMedicine = async (
	medicineName?: string,
	imageBuffer?: Buffer,
	mimeType?: string
): Promise<string> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		const parts: any[] = [];

		const buildMedicinePrompt = (topicInstruction: string, includeUncertaintyRule: boolean): string => {
			const uncertaintyRule = includeUncertaintyRule
				? "- If medicine identity is uncertain, clearly state uncertainty before giving guidance."
				: "";

			return `${topicInstruction}

Use simple, patient-friendly, result-oriented language.
Format in markdown with clear H2 headings and bullet points.

Use this section order when relevant (skip irrelevant sections):
## Overview
## Uses
## Composition
## How To Take
## Side Effects
## Warnings & Precautions
## Interactions
## Alternatives
## When To Seek Help

Quality rules:
- Give practical, useful detail for normal patients.
- Add 3-5 unique bullet points per included section.
- Do not repeat the same idea across sections, even with different wording.
- Do not duplicate headings (only one section for each heading).
- If dosage is mentioned, keep it general and clearly say doctor advice has priority.
- For side effects, separate common effects from serious warning signs when possible.
- Do not invent unknown details or unsupported claims.
${uncertaintyRule}
- End with one short safety note advising consultation with a doctor for personalized decisions.`;
		};

		if (medicineName) {
			parts.push({
				text: buildMedicinePrompt(`Explain this medicine named "${medicineName}" for a normal patient.`, false),
			});
		} else if (imageBuffer && mimeType) {
			parts.push({
				text: buildMedicinePrompt(
					"Identify and explain the medicine shown in this image for a normal patient.",
					true
				),
			});
			parts.push({
				inlineData: {
					data: imageBuffer.toString("base64"),
					mimeType,
				},
			});
		} else {
			throw new Error("Either medicine name or image is required");
		}

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: { systemInstruction: "Only talk about medical and healthcare" },
			contents: [{ role: "user", parts }],
		});

		const raw = result.text || "";
		return normalizeMarkdownForPatients(raw);
	} catch (error) {
		logger.error({ err: error }, "Gemini Medicine Analysis Error");
		throw new Error("Failed to analyze medicine");
	}
};

export const analyzePrescription = async (
	imageBuffers: { buffer: Buffer; mimeType: string }[]
): Promise<{ description: string; medicines: string[] }> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		const parts: any[] = [
			{
				text: `Analyze this medical prescription in detail. Please provide:

1. A comprehensive explanation of the prescription
2. List all medicines with their dosages and frequencies
3. Purpose of each medicine
4. Important instructions for the patient
5. Potential side effects to be aware of

Format your response in clear markdown. Also, in your response, clearly list all medicines names so they can be extracted for drug interaction checking.

After your explanation, include a JSON-formatted list of all medications in this format - place it on a single line at the very end of your response:
MEDICINES_JSON:[{"name":"Medicine Name 1", "dosage":"Dosage 1"},{"name":"Medicine Name 2", "dosage":"Dosage 2"}]`,
			},
		];

		for (const img of imageBuffers) {
			parts.push({
				inlineData: {
					data: img.buffer.toString("base64"),
					mimeType: img.mimeType,
				},
			});
		}

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: { systemInstruction: "Only talk about medical and healthcare" },
			contents: [{ role: "user", parts }],
		});

		const rawText = result.text || "";

		// Extract medicines from MEDICINES_JSON tag
		let medicines: string[] = [];
		const jsonMatch = rawText.match(/MEDICINES_JSON:\s*(\[[\s\S]*?\])/);
		if (jsonMatch) {
			try {
				const parsed = JSON.parse(jsonMatch[1]);
				medicines = parsed.map((m: { name: string }) => m.name);
			} catch {
				// Fallback regex extraction
				const nameMatches = rawText.match(
					/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b\s*(?:\d+\s*(?:mg|mcg|g|ml|IU))?/g
				);
				if (nameMatches) medicines = Array.from(new Set<string>(nameMatches)).slice(0, 20);
			}
		}

		// Clean the response text
		const description = rawText
			.replace(/MEDICINES_JSON:.*$/m, "")
			.replace(/MEDICINES_LIST:.*$/m, "")
			.replace(/```json[\s\S]*?```/g, "")
			.trim();

		return { description: normalizeMarkdownForPatients(description), medicines };
	} catch (error) {
		logger.error({ err: error }, "Gemini Prescription Analysis Error");
		throw new Error("Failed to analyze prescription");
	}
};

const stripOuterQuotes = (input: string): string => {
	const trimmed = input.trim();
	if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
		return trimmed.slice(1, -1).trim();
	}
	return trimmed;
};

const toPointByPointMarkdown = (value: unknown): string => {
	if (value == null) return "";

	if (typeof value === "string") {
		const cleaned = stripOuterQuotes(value).replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();

		if (!cleaned) return "";

		if ((cleaned.startsWith("[") && cleaned.endsWith("]")) || (cleaned.startsWith("{") && cleaned.endsWith("}"))) {
			try {
				return toPointByPointMarkdown(JSON.parse(cleaned));
			} catch {
				/* non-JSON string, continue */
			}
		}

		return cleaned
			.replace(/",\s*"/g, "\n- ")
			.replace(/^\["/, "")
			.replace(/"\]$/, "")
			.trim();
	}

	if (Array.isArray(value)) {
		const lines = value
			.map((item) => toPointByPointMarkdown(item))
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => (line.startsWith("- ") ? line : `- ${line}`));
		return lines.join("\n");
	}

	if (typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>);
		const lines = entries
			.map(([key, entryValue]) => {
				const normalized = toPointByPointMarkdown(entryValue).trim();
				if (!normalized) return "";
				const heading = key.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
				if (normalized.startsWith("- ")) {
					return `- **${heading}:**\n${normalized}`;
				}
				return `- **${heading}:** ${normalized}`;
			})
			.filter(Boolean);
		return lines.join("\n");
	}

	return String(value);
};

const normalizeTabTitle = (value: unknown): string => {
	const raw = typeof value === "string" ? value : String(value || "Analysis");
	return stripOuterQuotes(raw).replace(/\*\*/g, "").trim() || "Analysis";
};

const normalizePatientFacingTitle = (value: string): string => {
	const raw = stripOuterQuotes(value).replace(/\*\*/g, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

	if (!raw) return "Overview";

	const key = raw.toLowerCase();

	if (/overview|summary|introduction|about|at a glance/.test(key)) return "Overview";
	if (/use|benefit|indication|what .* for|why .* used/.test(key)) return "Uses";
	if (/composition|ingredient|contains|active/.test(key)) return "Composition";
	if (/dose|dosage|how to take|administration/.test(key)) return "How To Take";
	if (/side effect|adverse|undesired/.test(key)) return "Side Effects";
	if (/warning|precaution|contraindication|safety|avoid/.test(key)) return "Warnings & Precautions";
	if (/interaction|drug.?drug|drug.?disease/.test(key)) return "Interactions";
	if (/mechanism|how .* work|mode of action/.test(key)) return "How It Works";
	if (/alternative|substitute|replacement/.test(key)) return "Alternatives";
	if (/monitor|follow up|test|checkup/.test(key)) return "Monitoring";
	if (/seek help|see a doctor|emergency|red flag/.test(key)) return "When To Seek Help";
	if (/recommendation|next step|what to do|guidance|plan/.test(key)) return "What To Do Next";

	return raw
		.split(" ")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
};

const normalizeMarkdownForPatients = (markdown: string): string => {
	if (!markdown.trim()) return markdown;

	const normalized = markdown.replace(/^(#{2,3})\s+(.*)$/gm, (_full, hashes: string, title: string) => {
		return `${hashes} ${normalizePatientFacingTitle(title)}`;
	});

	return normalized.trim();
};

const normalizeTabContent = (value: unknown): string => {
	const markdown = toPointByPointMarkdown(value).trim();
	if (!markdown) return "No specific details provided.";
	return markdown;
};

export const checkDrugInteraction = async (
	medicines: string[]
): Promise<{
	tabs: { title: string; content: string }[];
	severity: "none" | "mild" | "moderate" | "severe";
	riskScore: number;
}> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		const medicineList = medicines.join(", ");

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: {
				systemInstruction:
					"You are a helpful medical assistant that provides accurate information about drug interactions based on established medical knowledge. Always provide specific details about interactions when known medicines are mentioned, with evidence-based information. Never refuse to answer with generic disclaimers when legitimate medicines are provided.\nProvide a structured analysis in JSON format ONLY.",
			},
			contents: [
				{
					role: "user",
					parts: [
						{
							text: `Provide a detailed analysis of potential Drug-Drug interactions between the following medications: ${medicineList}.

For these specific medications:
1. Explain in detail any known interactions between these exact medications using pharmaceutical databases
2. Rate each interaction's severity (No interaction, mild, moderate, severe) with clinical significance
3. Provide clear recommendations for patients regarding timing, dosing, or monitoring

Use patient-friendly language and generic result-oriented tab titles only.

Format the response strictly as a JSON object. Include a "severity" field (values: "none", "mild", "moderate", "severe") representing the HIGHEST severity found, and a "tabs" array for detailed information.

Output Structure:
{
    "severity": "mild|moderate|severe|none",
    "tabs": [
        { "title": "Overview", "content": "Analysis intro..." },
		{ "title": "Interactions", "content": "Detailed bullet points..." },
		{ "title": "What To Do Next", "content": "Practical next steps..." }
    ]
}`,
						},
					],
				},
			],
		});

		let text = result.text || "";

		// Fallback if response is too generic
		if (text.length < 500 && /I am an AI|I cannot provide|I'm not able/i.test(text)) {
			const retryResult = await ai.models.generateContent({
				model: MODEL_NAME,
				config: {
					systemInstruction:
						"You are a medical database assistant with expertise in drug interactions.\nProvide a structured analysis in JSON format ONLY.",
				},
				contents: [
					{
						role: "user",
						parts: [
							{
								text: `As a pharmacology expert, analyze drug interactions between: ${medicineList}. Include severity field: "none|mild|moderate|severe". Provide severity ratings and clinical recommendations. Be specific and evidence-based. Format response strictly as JSON with a "severity" field and "tabs" array containing {title, content} objects.`,
							},
						],
					},
				],
			});
			text = retryResult.text || text;
		}

		// Robust JSON extraction
		let jsonStr = text
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
		const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);

		if (jsonMatch) {
			jsonStr = jsonMatch[0];
		} else {
			logger.warn({ text }, "Failed to extract JSON from AI response (Drug Interaction)");
			throw new Error("Invalid AI response format");
		}

		const parsed = JSON.parse(jsonStr);

		// Ensure tabs array exists and all content is strings
		if (!Array.isArray(parsed.tabs)) {
			logger.warn({ parsed }, "Invalid tabs structure from AI response");
			throw new Error("Invalid tabs structure in AI response");
		}

		// Extract and validate severity
		const severityMap: Record<string, { score: number; label: string }> = {
			none: { score: 0, label: "none" },
			"no interaction": { score: 0, label: "none" },
			mild: { score: 33, label: "mild" },
			moderate: { score: 66, label: "moderate" },
			severe: { score: 100, label: "severe" },
		};

		const rawSeverity = String(parsed.severity || "")
			.trim()
			.toLowerCase();
		const severityData =
			severityMap[rawSeverity] || (rawSeverity.includes("severe") ? severityMap.severe : severityMap.mild);

		const sanitizedTabs = parsed.tabs.map((tab: Record<string, unknown>) => ({
			title: normalizePatientFacingTitle(normalizeTabTitle(tab.title)),
			content: normalizeTabContent(tab.content),
		}));

		return {
			tabs: sanitizedTabs,
			severity: severityData.label as "none" | "mild" | "moderate" | "severe",
			riskScore: severityData.score,
		};
	} catch (error) {
		logger.error({ err: error }, "Gemini Drug Interaction Error");
		throw new Error("Failed to check drug interactions");
	}
};

export const checkPersonalizedDrugInteraction = async (
	medicine: string,
	historicalMedicines: string[],
	diseaseContext: { conditions: string[]; symptoms: string[] }
): Promise<{
	tabs: { title: string; content: string }[];
	severity: "none" | "mild" | "moderate" | "severe";
	riskScore: number;
}> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		const medicineList = historicalMedicines.join(", ");
		const conditionList = diseaseContext.conditions.length
			? diseaseContext.conditions.join(", ")
			: "None from recent symptom history";
		const symptomList = diseaseContext.symptoms.length
			? diseaseContext.symptoms.join(", ")
			: "None from recent symptom history";

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: {
				systemInstruction:
					"You are a clinical pharmacology assistant. Provide evidence-based medicine safety checks using medication history and disease context.\nProvide a structured analysis in JSON format ONLY.",
			},
			contents: [
				{
					role: "user",
					parts: [
						{
							text: `Perform a personalized drug safety review for this patient.

Selected medicine: ${medicine}
Recent historical medicines (last 1 year): ${medicineList}
Recent disease context from symptom analysis (last 1 year):
- Conditions: ${conditionList}
- Symptoms: ${symptomList}

Please provide:
1. Drug-drug interaction check between selected medicine and each historical medicine
2. Drug-disease cautions or contraindications based on listed conditions/symptoms
3. Severity for each finding (none, mild, moderate, severe)
4. Practical patient guidance and monitoring advice
5. A short summary with clear next step

Use patient-friendly language and generic result-oriented tab titles only.

Format the response strictly as a JSON object. Include a "severity" field (values: "none", "mild", "moderate", "severe") representing the HIGHEST risk found.

Output Structure:
{
    "severity": "mild|moderate|severe|none",
    "tabs": [
        { "title": "Overview", "content": "Analysis intro..." },
		{ "title": "Interactions", "content": "Detailed bullet points..." },
		{ "title": "Warnings & Precautions", "content": "Condition-based cautions..." },
		{ "title": "What To Do Next", "content": "Practical next steps..." }
    ]
}`,
						},
					],
				},
			],
		});

		const text = result.text || "";

		// Robust JSON extraction
		let jsonStr = text
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
		const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);

		if (jsonMatch) {
			jsonStr = jsonMatch[0];
		} else {
			logger.warn({ text }, "Failed to extract JSON from AI response (Personalized Drug Interaction)");
			throw new Error("Invalid AI response format");
		}

		const parsed = JSON.parse(jsonStr);

		// Ensure tabs array exists and all content is strings
		if (!Array.isArray(parsed.tabs)) {
			logger.warn({ parsed }, "Invalid tabs structure from AI response");
			throw new Error("Invalid tabs structure in AI response");
		}

		// Extract and validate severity
		const severityMap: Record<string, { score: number; label: string }> = {
			none: { score: 0, label: "none" },
			"no interaction": { score: 0, label: "none" },
			mild: { score: 33, label: "mild" },
			moderate: { score: 66, label: "moderate" },
			severe: { score: 100, label: "severe" },
		};

		const rawSeverity = String(parsed.severity || "")
			.trim()
			.toLowerCase();
		const severityData =
			severityMap[rawSeverity] || (rawSeverity.includes("severe") ? severityMap.severe : severityMap.mild);

		const sanitizedTabs = parsed.tabs.map((tab: Record<string, unknown>) => ({
			title: normalizePatientFacingTitle(normalizeTabTitle(tab.title)),
			content: normalizeTabContent(tab.content),
		}));

		return {
			tabs: sanitizedTabs,
			severity: severityData.label as "none" | "mild" | "moderate" | "severe",
			riskScore: severityData.score,
		};
	} catch (error) {
		logger.error({ err: error }, "Gemini Personalized Drug Interaction Error");
		throw new Error("Failed to check personalized drug interactions");
	}
};

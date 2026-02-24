import { GoogleGenAI } from "@google/genai";
import env from "../../config/env";
import logger from "../../config/logger";

const API_KEY = env.GEMINI_API_KEY || "";

// Initialize Gemini (New SDK)
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Constants
const MODEL_NAME = "gemini-2.5-flash"; // Explicitly using models/ prefix

export const generateAIResponse = async (
	history: { role: string; content: string }[],
	newMessage: string,
	language: string = "en",
	imageBuffer?: Buffer,
	mimeType?: string
): Promise<string> => {
	try {
		if (!API_KEY) {
			throw new Error("GEMINI_API_KEY is not configured");
		}

		// Convert DB history to Gemini format
		const contents: any[] = history.map((msg) => ({
			role: msg.role === "user" ? "user" : "model",
			parts: [{ text: msg.content }],
		}));

		// Construct current message parts
		const currentParts: any[] = [
			{
				text: language && language !== "en" ? `[Respond in ${language}] ${newMessage}` : newMessage,
			},
		];

		// Add image if provided
		if (imageBuffer && mimeType) {
			currentParts.push({
				inlineData: {
					data: imageBuffer.toString("base64"),
					mimeType: mimeType,
				},
			});
		}

		// Add the new message
		contents.push({
			role: "user",
			parts: currentParts,
		});

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: {
				systemInstruction:
					"You are a Smart Healthcare Assistant. Only discuss topics related to healthcare, medicine, symptoms, medical procedures, or general well-being. If a user asks a non-medical question, politely decline by saying: 'As a Smart Healthcare Assistant, I can only discuss topics related to healthcare and medicine.'",
			},
			contents: contents,
		});

		return result.text || "";
	} catch (error) {
		logger.error({ err: error }, "Gemini API Error");
		throw new Error("Failed to generate AI response");
	}
};

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

        Return 1–3 specialists that best match the symptoms. If the symptoms could indicate
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

		// Extract user messages only
		const userMessages = messages
			.filter((msg) => msg.role === "user")
			.map((msg) => msg.content)
			.join("\n");

		if (!userMessages.trim()) {
			return {
				summary: "No user messages found in the conversation.",
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
							text: `Based on the following patient's conversation, summarize their key symptoms and health concerns in a clear, concise paragraph that would help a doctor understand their condition. Focus only on medical information and symptoms.

If the conversation contains NO medical symptoms or health concerns, respond with EXACTLY: "NON_MEDICAL"

Here's the conversation:

${userMessages}`,
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

		if (medicineName) {
			parts.push({
				text: `Tell me about this medicine named "${medicineName}" and its uses, side effects, dosage, composition, alternatives, and everything important about it. Format your response in clear markdown with headings. Give a small note at the end to consult a doctor for medical advice.`,
			});
		} else if (imageBuffer && mimeType) {
			parts.push({
				text: `Tell me about this medicine shown in the image — its name, uses, side effects, dosage, composition, alternatives, and everything important about it. Format your response in clear markdown with headings. Give a small note at the end to consult a doctor for medical advice.`,
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

		return result.text || "";
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
				if (nameMatches) medicines = [...new Set(nameMatches)].slice(0, 20);
			}
		}

		// Clean the response text
		const description = rawText
			.replace(/MEDICINES_JSON:.*$/m, "")
			.replace(/MEDICINES_LIST:.*$/m, "")
			.replace(/```json[\s\S]*?```/g, "")
			.trim();

		return { description, medicines };
	} catch (error) {
		logger.error({ err: error }, "Gemini Prescription Analysis Error");
		throw new Error("Failed to analyze prescription");
	}
};

export const checkDrugInteraction = async (medicines: string[]): Promise<string> => {
	try {
		if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

		const medicineList = medicines.join(", ");

		const result = await ai.models.generateContent({
			model: MODEL_NAME,
			config: {
				systemInstruction:
					"You are a helpful medical assistant that provides accurate information about drug interactions based on established medical knowledge. Always provide specific details about interactions when known medicines are mentioned, with evidence-based information. Never refuse to answer with generic disclaimers when legitimate medicines are provided.",
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

Important guidelines:
- If these are legitimate medications, provide specific interaction information
- If you don't recognize a medication name, suggest possible corrections or similar medication names
- If a true interaction exists, be specific about the mechanism and management
- Format your response with clear headings and bullet points for readability

End with a brief disclaimer reminding patients to consult healthcare providers about drug interactions.`,
						},
					],
				},
			],
		});

		const text = result.text || "";

		// Fallback if response is too generic
		if (text.length < 500 && /I am an AI|I cannot provide|I'm not able/i.test(text)) {
			const retryResult = await ai.models.generateContent({
				model: MODEL_NAME,
				config: {
					systemInstruction: "You are a medical database assistant with expertise in drug interactions.",
				},
				contents: [
					{
						role: "user",
						parts: [
							{
								text: `As a pharmacology expert, analyze drug interactions between: ${medicineList}. Provide severity ratings and clinical recommendations. Be specific and evidence-based.`,
							},
						],
					},
				],
			});
			return retryResult.text || text;
		}

		return text;
	} catch (error) {
		logger.error({ err: error }, "Gemini Drug Interaction Error");
		throw new Error("Failed to check drug interactions");
	}
};

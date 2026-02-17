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
			contents: contents,
		});

		return result.text || "";
	} catch (error) {
		logger.error({ err: error }, "Gemini API Error");
		throw new Error("Failed to generate AI response");
	}
};

export const analyzeSymptoms = async (
	symptoms: string[],
	language: string = "en",
	imageBuffer?: Buffer,
	mimeType?: string
): Promise<{
	possibleConditions: string[];
	severity: "Mild" | "Moderate" | "Severe" | "Emergency";
	urgency: "Home Care" | "Doctor Visit" | "Emergency Room";
	reasoning: string;
	recommendedSpecialist: string;
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
        
        Output Structure:
        {
            "possibleConditions": ["Condition 1", "Condition 2"],
            "severity": "Mild" | "Moderate" | "Severe" | "Emergency",
            "urgency": "Home Care" | "Doctor Visit" | "Emergency Room",
            "reasoning": "Brief explanation of why...",
            "recommendedSpecialist": "Specialist Name",
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

		return JSON.parse(jsonStr);
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

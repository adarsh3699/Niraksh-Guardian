const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();

const app = express();

// Configure multer for file uploads
const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, "uploads/");
		},
	}),
});

function fileToGenerativePart(path, mimeType) {
	return {
		inlineData: {
			data: Buffer.from(fs.readFileSync(path)).toString("base64"),
			mimeType,
		},
	};
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/medicine", upload.single("file"), async (req, res) => {
	const name = req.body.name;

	if (name) {
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			systemInstruction: "Only talk about medical and healthcare",
		});

		const prompt =
			"tell me about this medicine named" +
			name +
			" and its uses and side effects and everything about it. Give a small note at the end to consult doctor medical advice.";
		const result = await model.generateContent(prompt);

		res.json({ description: result.response.text() });
	} else {
		try {
			if (!req.file) {
				return res.status(400).json({ error: "No file uploaded" });
			}

			const filePath = req.file.path;
			const mimeType = req.file.mimetype;

			const model = genAI.getGenerativeModel({
				model: "gemini-2.5-flash",
				systemInstruction: "Only talk about medical and healthcare",
			});
			const prompt =
				"Tell me about this medicine and its uses and side effects and everything about it. Give a small note at the end to consult doctor medical advice.";
			const filePart = fileToGenerativePart(filePath, mimeType);

			const result = await model.generateContent([prompt, filePart]);

			res.json({ description: result.response.text() });

			// Cleanup: Delete uploaded file after processing
			fs.unlinkSync(filePath);
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: error.message });
		}
	}
});

app.post("/prescription", upload.array("files", 5), async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ error: "No files uploaded" });
		}

		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			systemInstruction: "Only talk about medical and healthcare",
		});

		// Enhanced prompt to specifically ask for structured data
		const prompt = `
        Analyze this medical prescription in detail. Please provide:
        
        1. A comprehensive explanation of the prescription
        2. List all medicines with their dosages and frequencies
        3. Purpose of each medicine
        4. Important instructions for the patient
        5. Potential side effects to be aware of
        
        Format your response in clear markdown. Also, in your response, clearly list all medicines names so they can be extracted for drug interaction checking.
        
        After your explanation, include a JSON-formatted list of all medications in this format - place it on a single line at the very end of your response:
        MEDICINES_JSON:[{"name":"Medicine Name 1", "dosage":"Dosage 1"},{"name":"Medicine Name 2", "dosage":"Dosage 2"}]
        `;

		// Convert files to generative parts
		const imageParts = req.files.map((file) => fileToGenerativePart(file.path, file.mimetype));

		// Generate content with multiple files
		const result = await model.generateContent([prompt, ...imageParts]);
		const response = await result.response;
		const text = response.text();

		// Extract medicines list from the response
		let medicines = [];
		const medicinesMatch = text.match(/MEDICINES_JSON:\[(.*?)\]/s);

		if (medicinesMatch && medicinesMatch[1]) {
			try {
				// Try to parse the JSON list of medicines
				const medicinesJson = JSON.parse(`[${medicinesMatch[1]}]`);
				medicines = medicinesJson.map((med) => med.name);
			} catch (parseError) {
				console.error("Error parsing medicines list:", parseError);

				// Fallback: Use regex to extract medicine names
				const medicineRegex = /\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b\s*(?:\d+\s*(?:mg|mcg|g|ml|IU))?/g;
				const medicineMatches = text.match(medicineRegex) || [];
				medicines = [...new Set(medicineMatches)];
			}
		}

		// Cleanup: Delete uploaded files after processing
		req.files.forEach((file) => fs.unlinkSync(file.path));

		// Clean up the response by removing the MEDICINES_JSON and related content
		let cleanedText = text.replace(/MEDICINES_JSON:\[.*?\]/gs, "");

		// Also remove any other sections that might contain the raw medicine data
		cleanedText = cleanedText.replace(/MEDICINES_LIST:[\s\S]*?}/gs, "");
		cleanedText = cleanedText.replace(/```json[\s\S]*?```/gs, "");
		cleanedText = cleanedText.replace(/```[\s\S]*?```/gs, "");

		// Remove any empty sections that might remain
		cleanedText = cleanedText.replace(/\n\s*\n\s*\n/g, "\n\n");

		res.json({
			description: cleanedText,
			medicines: medicines,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
});

app.post("/drug-interaction", upload.single("file"), async (req, res) => {
	const medicines = req.body.medicines?.trim();

	if (!medicines || medicines.length === 0) {
		return res.status(400).json({ error: "Please provide a list of medicines" });
	}

	try {
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			systemInstruction:
				"You are a helpful medical assistant that provides accurate information about drug interactions based on established medical knowledge. Always provide specific details about interactions when known medicines are mentioned, with evidence-based information. Never refuse to answer with generic disclaimers when legitimate medicines are provided.",
		});

		const prompt = `
        Provide a detailed analysis of potential Drug Drug interactions between the following medications: ${medicines}.
        
        For these specific medications:
        
        1. Explain in detail any known interactions between these exact medications using pharmaceutical databases
        2. Rate each interaction's severity (No interaction, mild, moderate, severe) with clinical significance
        3. Provide clear recommendations for patients regarding timing, dosing, or monitoring
        
        Important guidelines:
        - Do NOT reply with generic statements like "I cannot provide information" or "I am an AI chatbot"
        - If these are legitimate medications, provide specific interaction information
        - If you don't recognize a medication name, suggest possible corrections or similar medication names
        - If a true interaction exists, be specific about the mechanism and management
        - Format your response with clear headings and bullet points for readability
        
        End with a brief disclaimer reminding patients to consult healthcare providers about drug interactions.
        `;

		const result = await model.generateContent(prompt);
		const responseText = result.response.text();

		// Check if response contains generic disclaimers without useful information
		if (
			(responseText.includes("I am an AI") ||
				responseText.includes("I cannot provide") ||
				responseText.includes("cannot recognize") ||
				responseText.includes("don't have information")) &&
			responseText.length < 500
		) {
			// If we get a generic disclaimer, try a fallback approach
			const fallbackModel = genAI.getGenerativeModel({
				model: "gemini-2.5-flash",
				systemInstruction: "You are a medical database assistant with expertise in drug interactions.",
			});

			const fallbackPrompt = `
            Research question: What are the specific, known drug interactions between ${medicines}?
            
            Format your response as a detailed medical reference including:
            - Known interactions between these specific medications (pharmacokinetic, pharmacodynamic)
            - Clinical significance of each interaction
            - Specific recommendations for managing these interactions
            
            If one of the medicines isn't recognized, suggest possible alternatives it might be referring to.
            Always provide the best evidence-based information available about these medications.
            `;

			const fallbackResult = await fallbackModel.generateContent(fallbackPrompt);
			res.json({ description: fallbackResult.response.text() });
		} else {
			res.json({ description: responseText });
		}
	} catch (error) {
		console.error("Drug interaction error:", error);
		res.status(500).json({ error: error.message });
	}
});

app.post("/disease", async (req, res) => {
	const history = req.body.history;
	const msg = req.body.msg;

	try {
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			systemInstruction: "Only talk about medical and healthcare",
		});

		// Clean history data to remove MongoDB-specific fields
		const cleanedHistory = history.map((message) => ({
			role: message.role,
			parts: message.parts.map((part) => ({ text: part.text })),
		}));

		const chat = model.startChat({
			history: [
				{
					role: "user",
					parts: [{ text: "Tell me only about healthcare. if any question outside dont answer it." }],
				},
				...cleanedHistory,
			],
		});

		let result = await chat.sendMessage(msg);

		res.json({ description: result.response.text() });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
});

app.post("/summarize-symptoms", async (req, res) => {
	const chatHistory = req.body.chatHistory;

	if (!chatHistory || !Array.isArray(chatHistory)) {
		return res.status(400).json({ error: "Chat history is required and must be an array" });
	}

	try {
		// Extract all user messages
		const userMessages = chatHistory
			.filter((msg) => msg.role === "user")
			.map((msg) => msg.parts[0].text)
			.join("\n");

		// Check for non-healthcare related terms in user messages
		const nonMedicalKeywords = [
			"just doing time pass",
			"not related to healthcare",
			"not a medical",
			"not medical",
			"no symptoms",
		];

		// Check if any non-medical keyword is found
		const isNonMedical = nonMedicalKeywords.some((keyword) =>
			userMessages.toLowerCase().includes(keyword.toLowerCase())
		);

		if (isNonMedical) {
			return res.json({
				summary:
					'This user has not provided any medical information or described any symptoms. They stated they are "just doing time pass," indicating the conversation is not related to healthcare or medical concerns.',
				status: "non_medical",
			});
		}

		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			systemInstruction: "Only talk about medical and healthcare",
		});

		const prompt = `Based on the following patient's conversation, summarize their key symptoms and health concerns in a clear, concise paragraph that would help a doctor understand their condition. Focus only on medical information and symptoms.

If the conversation contains NO medical symptoms or health concerns, respond with EXACTLY: "This user has not provided any medical information or described any symptoms. The conversation is not related to healthcare or medical concerns."

Here's the conversation:\n\n${userMessages}`;

		const result = await model.generateContent(prompt);
		const summary = result.response.text();

		// Check if the AI identified this as non-medical content
		if (summary.includes("not provided any medical information") || summary.includes("not related to healthcare")) {
			return res.json({
				summary: summary,
				status: "non_medical",
			});
		}

		res.json({
			summary: summary,
			status: "success",
		});
	} catch (error) {
		console.error("Error summarizing symptoms:", error);
		res.status(500).json({ error: error.message });
	}
});

// New endpoint that uses LangChain-like semantic matching for symptoms to specialist mapping
app.post("/analyze-symptoms", async (req, res) => {
	const symptoms = req.body.symptoms;

	if (!symptoms || typeof symptoms !== "string") {
		return res.status(400).json({ error: "Symptoms description is required" });
	}

	// Check for non-healthcare related terms
	const nonMedicalKeywords = [
		"just doing time pass",
		"not related to healthcare",
		"not a medical",
		"not medical",
		"no symptoms",
	];

	// Check if any non-medical keyword is found
	const isNonMedical = nonMedicalKeywords.some((keyword) => symptoms.toLowerCase().includes(keyword.toLowerCase()));

	if (isNonMedical) {
		return res.json({
			categories: [],
			reasoning: "This conversation doesn't appear to be healthcare-related.",
		});
	}

	try {
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			systemInstruction:
				"You are a medical specialist classifier. Your task is to determine which medical specialists would be most appropriate for a patient based on their symptoms.",
		});

		// Create a structured prompt with the available categories
		const prompt = `
As a medical expert, analyze the following patient's symptoms and determine which medical specialists would be most appropriate for consultation.

Patient symptoms: "${symptoms}"

Available specialist categories:
- AYUSHHomoeopath (For homeopathic treatment, alternative medicine, natural remedies)
- Cosmetic_Aesthetic_Dentist (For teeth whitening, braces, smile correction)
- Dental_Surgeon (For tooth extractions, root canals, dental surgery)
- Dentist (For routine dental care, cavities)
- General_Physician (For common illnesses, fever, cough, general health issues)
- Gynecologist (For women's reproductive health, menstrual issues, PCOS)
- Obstetrician (For pregnancy care, childbirth, prenatal/postnatal care)
- Orthopedic_surgeon (For bone and joint issues, fractures, arthritis)
- Dermatologist (For skin conditions, hair and nail problems)
- Periodontist (For gum disease, gum health)
- Sexologist (For sexual health issues, fertility concerns)

Analyze the symptoms carefully and return a JSON object with ONLY the following structure:
{
  "categories": ["Category1", "Category2"],
  "reasoning": "Brief explanation of why these specialists are recommended"
}

List the categories in order of relevance (most relevant first). Include 1-3 categories that best match the symptoms.

If the text doesn't contain any medical symptoms or health-related concerns, return an empty categories array and indicate that no healthcare concerns were identified.
`;

		const result = await model.generateContent(prompt);
		const resultText = result.response.text();

		try {
			// Parse the JSON response
			const jsonStart = resultText.indexOf("{");
			const jsonEnd = resultText.lastIndexOf("}") + 1;

			if (jsonStart >= 0 && jsonEnd > jsonStart) {
				const jsonStr = resultText.substring(jsonStart, jsonEnd);
				const parsedResult = JSON.parse(jsonStr);

				// Validate the response format
				if (Array.isArray(parsedResult.categories)) {
					// If categories array is empty, it means no healthcare concerns were identified
					if (parsedResult.categories.length === 0) {
						return res.json({
							categories: [],
							reasoning: "No healthcare concerns were identified in the provided text.",
						});
					}
					return res.json(parsedResult);
				}
			}

			throw new Error("Invalid response format");
		} catch (parseError) {
			console.error("Error parsing AI response:", parseError);

			// Fallback: extract categories with regex if JSON parsing fails
			const categoryMatches = resultText.match(/["']categories["']\s*:\s*\[\s*["']([^"']+)["']/);
			if (categoryMatches && categoryMatches[1]) {
				const mainCategory = categoryMatches[1];
				return res.json({
					categories: [mainCategory],
					reasoning: "Extracted from response (fallback method)",
				});
			}

			throw new Error("Could not extract categories from response");
		}
	} catch (error) {
		console.error("Error analyzing symptoms:", error);
		res.status(500).json({ error: error.message });
	}
});

module.exports = app;

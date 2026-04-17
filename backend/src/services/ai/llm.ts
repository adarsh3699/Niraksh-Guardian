import axios from "axios";

interface PromptData {
  fullHistory?: Array<{ role: string; content: string }>;
  previousMessages?: string;
  currentMessage: string;
}

export async function generateWithGemma(prompt: PromptData | string) {
  try {
    // Handle both string and structured prompt formats
    const payload = typeof prompt === "string" ? prompt : formatPromptWithContext(prompt);

    const response = await axios.post("http://localhost:8000/generate", {
      prompt: payload,
    });

    return response.data.response;
  } catch (error) {
    console.error("Gemma API error:", error);
    throw new Error("Failed to generate response from local AI");
  }
}

function formatPromptWithContext(data: PromptData): string {
  const { previousMessages, currentMessage } = data;

  let contextSection = "";
  if (previousMessages && previousMessages.trim()) {
    contextSection = `\n=== RECENT CONVERSATION ===\n${previousMessages}\n=== END RECENT CONVERSATION ===`;
  }

  return `${contextSection}\n\nCURRENT PATIENT QUERY:\n${currentMessage}`;
}

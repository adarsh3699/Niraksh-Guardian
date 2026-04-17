import axios from "axios";

export async function generateWithGemma(prompt: string) {
  try {
    const response = await axios.post("http://localhost:8000/generate", {
      prompt: prompt,
    });

    return response.data.response;
  } catch (error) {
    console.error("Gemma API error:", error);
    throw new Error("Failed to generate response from local AI");
  }
}

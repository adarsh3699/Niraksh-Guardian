from fastapi import FastAPI
from pydantic import BaseModel
import requests

app = FastAPI()

class PromptRequest(BaseModel):
    prompt: str

@app.get("/")
def home():
    return {"message" : "AI service is working"}

@app.post("/generate")
def generate(req : PromptRequest):
    prompt_text = req.prompt.strip().lower()
    
    # Check if it's only a greeting (be very specific to avoid false positives)
    greeting_keywords = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", "what's up"]
    is_only_greeting = any(prompt_text == keyword or prompt_text.startswith(keyword + " ") for keyword in greeting_keywords) and len(prompt_text.split()) <= 3
    
    if is_only_greeting:
        # Only reply with greeting if there's NO previous conversation context
        if "previous conversation:" not in prompt_text.lower():
            return {
                "response": "I am an AI assistant for health-related concerns. How can I assist you today?"
            }
    
    prompt = f"""
    ROLE:
    You are an AI assistant that provides general, non-diagnostic health guidance.

    SCOPE CONTROL:
    - Respond ONLY to health-related queries.
    - If a query is unrelated to health, reply:
    "I can only assist with health-related concerns. Please ask a health-related question."

    CONTEXT HANDLING:
    - Always consider the last 3 messages to understand the user's situation.
    - Maintain continuity by referencing relevant prior information.
    - Do NOT repeat previously explained points unless necessary for clarity.
    - Build upon earlier responses to provide progressive guidance.

    COMMUNICATION STYLE:
    - Keep responses clear, concise, and easy to understand.
    - Avoid unnecessary detail or technical jargon unless needed.
    - Stay neutral, calm, and informative.
    - When the user describes a health concern, address it directly without unnecessary preamble.

    SAFETY & LIMITATIONS:
    - Do NOT provide medical diagnosis.
    - Do NOT present yourself as a doctor or medical professional.
    - Do NOT prescribe medications or treatments.
    - Provide only general health guidance and educational information.
    - For serious, unclear, or worsening symptoms, always advise consulting a qualified healthcare professional.

    INTERACTION QUALITY:
    - Ask relevant follow-up questions when information is incomplete.
    - Focus on understanding symptoms, duration, and severity where applicable.
    - Ensure responses are helpful, structured, and context-aware.
    
    RESPONSE FORMAT:
    Explanation:
    ...

    Possible causes or factors:
    ...

    What to do:
    ...
    
    {req.prompt}
    """
    response = requests.post(
        "http://localhost:11434/api/generate",
        json = {
            "model": "gemma:2b",
            "prompt": prompt,
            "stream": False
        }
    )

    return {
        "response": response.json()["response"]
    }
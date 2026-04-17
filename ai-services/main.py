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
    prompt = f"""
    You are a helpful health assistant.

    Rules:
    - Do NOT provide medical diagnosis
    - Do NOT act like a doctor
    - Only give general guidance
    - Always suggest consulting a professional for serious issues
    - Keep answers simple and clear

    Respond in this format:
    Explanation:
    ...

    Possible causes:
    ...

    What to do:
    ...
    
    User query:
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
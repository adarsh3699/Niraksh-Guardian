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
    response = requests.post(
        "http://localhost:11434/api/generate",
        json = {
            "model": "gemma:2b",
            "prompt": req.prompt,
            "stream": False
        }
    )

    return {
        "response": response.json()["response"]
    }
import json
from typing import Optional

import requests
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

app = FastAPI()

OLLAMA_API_URL = "http://localhost:11434/api/generate"
LOCAL_MODEL = "medgemma1.5"
REQUEST_TIMEOUT_SECONDS = 60
TEMPERATURE = 0.7
TOP_P = 0.9


class ImageData(BaseModel):
    base64: str
    mime_type: str


class PromptRequest(BaseModel):
    prompt: str
    language: Optional[str] = None
    image_data: Optional[ImageData] = None


def error_response(message: str, code: str, retryable: bool, status_code: int, retry_after_seconds: Optional[int] = None):
    payload = {
        "error": message,
        "code": code,
        "retryable": retryable,
    }

    if retry_after_seconds is not None:
        payload["retryAfterSeconds"] = retry_after_seconds

    return JSONResponse(content=payload, status_code=status_code)


def apply_greeting_guard(prompt: str):
    prompt_text = prompt.strip().lower()
    greeting_keywords = [
        "hello",
        "hi",
        "hey",
        "greetings",
        "good morning",
        "good afternoon",
        "good evening",
        "what's up",
    ]

    is_only_greeting = (
        any(prompt_text == keyword or prompt_text.startswith(keyword + " ") for keyword in greeting_keywords)
        and len(prompt_text.split()) <= 3
    )

    if is_only_greeting and "previous conversation:" not in prompt_text:
        return "I am an AI assistant for health-related concerns. How can I assist you today?"

    return None


def build_prompt(user_prompt: str, language: Optional[str]):
    language_instruction = f"Respond strictly in {language}." if language and language.strip() else ""
    return f"""You are Niraksh AI, an empathetic and highly knowledgeable Smart Healthcare Assistant. Your primary goal is to provide helpful health guidance.

GUIDELINES:
- Respond ONLY to health-related queries. Politely decline non-medical questions.
- Ask relevant follow-up questions when needed to understand the full situation.
- Ask only 1 targeted, solution-based question at a time (e.g., 'When did this start?', 'Does it worsen after eating?').
- Once you understand the issue, provide a helpful, easy-to-read guide with practical insights.
- Use clear, conversational language that patients can understand.
- Consider the last 10 messages for context and continuity.

SAFETY RULES:
- Never provide medical diagnosis or act as a doctor.
- Never prescribe medications.
- Always advise consulting a healthcare professional for serious, unclear, or worsening symptoms.
- Provide only general health guidance and educational information.

RESPONSE STYLE:
- Be empathetic, calm, and informative.
- Address concerns directly without unnecessary preamble.
- Format responses naturally (bullet points, paragraphs, or sections as needed).
- Avoid repetition of previously explained points unless necessary for clarity.

{language_instruction}

User Query:
{user_prompt}
"""


def build_ollama_payload(req: PromptRequest, stream: bool):
    payload = {
        "model": LOCAL_MODEL,
        "prompt": build_prompt(req.prompt, req.language),
        "stream": stream,
        "options": {
            "temperature": TEMPERATURE,
            "top_p": TOP_P,
        },
    }

    if req.image_data and req.image_data.base64:
        payload["images"] = [req.image_data.base64]

    return payload


@app.get("/")
def home():
    return {"message": "AI service is working"}


@app.post("/generate")
def generate(req: PromptRequest):
    greeting_response = apply_greeting_guard(req.prompt)
    if greeting_response:
        return {"response": greeting_response}

    try:
        response = requests.post(
            OLLAMA_API_URL,
            json=build_ollama_payload(req, stream=False),
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.exceptions.Timeout:
        return error_response("Local AI request timed out", "TIMEOUT", True, 504)
    except requests.exceptions.ConnectionError:
        return error_response("Local AI service is unavailable", "SERVICE_UNAVAILABLE", True, 503)
    except requests.exceptions.RequestException as exc:
        return error_response(f"Local AI request failed: {exc}", "GENERATION_ERROR", False, 500)

    if response.status_code >= 400:
        message = response.text or "Local AI generation failed"
        if "not found" in message.lower() and "model" in message.lower():
            return error_response("Configured local model not found", "MODEL_NOT_FOUND", True, 503)
        return error_response(message, "GENERATION_ERROR", response.status_code >= 500, response.status_code)

    payload = response.json()
    text = payload.get("response", "")
    if not text.strip():
        return error_response("Local AI returned an empty response", "GENERATION_ERROR", False, 500)

    return {"response": text}


@app.post("/generate/stream")
def generate_stream(req: PromptRequest):
    greeting_response = apply_greeting_guard(req.prompt)
    if greeting_response:
        def greeting_generator():
            yield f"data: {json.dumps({'type': 'chunk', 'delta': greeting_response})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(greeting_generator(), media_type="text/event-stream")

    try:
        upstream = requests.post(
            OLLAMA_API_URL,
            json=build_ollama_payload(req, stream=True),
            timeout=REQUEST_TIMEOUT_SECONDS,
            stream=True,
        )
    except requests.exceptions.Timeout:
        return error_response("Local AI request timed out", "TIMEOUT", True, 504)
    except requests.exceptions.ConnectionError:
        return error_response("Local AI service is unavailable", "SERVICE_UNAVAILABLE", True, 503)
    except requests.exceptions.RequestException as exc:
        return error_response(f"Local AI request failed: {exc}", "GENERATION_ERROR", False, 500)

    if upstream.status_code >= 400:
        message = upstream.text or "Local AI generation failed"
        if "not found" in message.lower() and "model" in message.lower():
            return error_response("Configured local model not found", "MODEL_NOT_FOUND", True, 503)
        return error_response(message, "GENERATION_ERROR", upstream.status_code >= 500, upstream.status_code)

    def event_generator():
        try:
            for line in upstream.iter_lines(decode_unicode=True):
                if not line:
                    continue

                event = json.loads(line)
                chunk = event.get("response", "")
                if chunk:
                    yield f"data: {json.dumps({'type': 'chunk', 'delta': chunk})}\n\n"

                if event.get("done"):
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    return
        except Exception as exc:  # noqa: BLE001
            error_payload = {
                "type": "error",
                "error": f"Local AI stream failed: {exc}",
                "code": "GENERATION_ERROR",
                "retryable": False,
            }
            yield f"data: {json.dumps(error_payload)}\n\n"
        finally:
            upstream.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
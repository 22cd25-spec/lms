from datetime import datetime, timedelta
from random import randint
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field


class OTPRequest(BaseModel):
    email: EmailStr
    mode: Literal["login", "register", "forgot_password"]


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(pattern=r"^\d{6}$")
    mode: Literal["login", "register", "forgot_password"]


class ChatRequest(BaseModel):
    user_message: str
    current_video_id: str
    current_module: str


class ChatResponse(BaseModel):
    reply: str


app = FastAPI(title="TutorialHub API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

otp_store: dict[str, tuple[str, datetime]] = {}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/request-otp")
def request_otp(payload: OTPRequest) -> dict[str, str]:
    otp = f"{randint(0, 999999):06d}"
    otp_store[payload.email] = (otp, datetime.utcnow() + timedelta(minutes=5))
    print(f"[OTP::{payload.mode.upper()}] {payload.email} -> {otp}", flush=True)
    return {"message": "OTP generated and sent to terminal"}


@app.post("/auth/verify-otp")
def verify_otp(payload: OTPVerify) -> dict[str, str]:
    if payload.email not in otp_store:
        raise HTTPException(status_code=400, detail="No OTP requested")

    expected_otp, expires_at = otp_store[payload.email]
    if datetime.utcnow() > expires_at:
        del otp_store[payload.email]
        raise HTTPException(status_code=400, detail="OTP expired")

    if payload.otp != expected_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    del otp_store[payload.email]
    return {"message": "authenticated"}


@app.post("/chat/respond", response_model=ChatResponse)
def chat_respond(payload: ChatRequest) -> ChatResponse:
    message = payload.user_message.lower().strip()
    module = payload.current_module.upper()

    if "hi" in message:
        return ChatResponse(reply=f"SYSTEM ACKNOWLEDGED. Active module: {module}. State your execution objective.")

    if payload.current_video_id == "unreal-5" and "lumen" in message:
        return ChatResponse(
            reply=(
                "UNREAL LUMEN TIPSET: enable Hardware Ray Tracing in Project Settings, keep Surface Cache coverage high, "
                "and profile with r.Lumen.Visualize to validate GI/reflection quality versus frame budget."
            )
        )

    if payload.current_video_id == "blender-4-1" and ("scale" in message or "optix" in message or "denois" in message):
        return ChatResponse(
            reply=(
                "BLENDER PROTOCOL: apply transforms with Ctrl+A > Scale before simulation/modifiers; "
                "for rendering, switch Cycles device to OptiX, enable OptiX denoiser in View Layer, "
                "and compare albedo/normal passes when preserving detail."
            )
        )

    if "prompt engineering" in message or payload.current_video_id == "prompt-engineering":
        return ChatResponse(
            reply=(
                "PROMPT ENGINEERING DIRECTIVE: use explicit delimiters (triple backticks or XML tags) to segment context, "
                "tasks, and constraints. For complex tasks, request concise Chain-of-Thought style decomposition internally "
                "by asking for numbered reasoning checkpoints and final answer separately."
            )
        )

    return ChatResponse(
        reply=(
            "CLINICAL RESPONSE: anchor your question to the current module, target engine/tool version, and failure symptom. "
            "I will return exact corrective steps."
        )
    )

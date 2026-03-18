from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2, max_length=60)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ServiceCreate(BaseModel):
    name: str
    url: str
    method: Literal["GET", "POST", "HEAD"] = "GET"
    check_interval: int = 30
    tag: str = "production"
    headers: Optional[dict] = None
    expected_status: int = 200

    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    check_interval: Optional[int] = None
    tag: Optional[str] = None
    headers: Optional[dict] = None


class LogIngest(BaseModel):
    service: str
    level: Literal["info", "warn", "error", "debug", "success"]
    message: str
    metadata: Optional[dict] = None


class IncidentCreate(BaseModel):
    title: str
    service_id: str
    severity: Literal["critical", "high", "medium", "low"] = "high"
    description: Optional[str] = None


class IncidentUpdate(BaseModel):
    text: str
    author: str = "operator"


class AlertConfig(BaseModel):
    type: Literal["email", "webhook", "discord", "slack"]
    enabled: bool = True
    email_to: Optional[str] = None
    webhook_url: Optional[str] = None

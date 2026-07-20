from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from app.schemas.workshop import WorkshopResponse

class RegistrationCreate(BaseModel):
    invitation_token: str = Field(..., description="Token único de la invitación")
    workshop_id: int = Field(..., description="ID del taller seleccionado")
    full_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=50)
    institution: Optional[str] = Field(None, max_length=150)
    age: Optional[int] = Field(None, ge=1, le=120)
    terms_accepted: bool = Field(..., json_schema_extra={"const": True})
    data_treatment_accepted: bool = Field(..., json_schema_extra={"const": True})
    comments: Optional[str] = None

class RegistrationCancel(BaseModel):
    reason: Optional[str] = None

class RegistrationUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    institution: Optional[str] = None
    age: Optional[int] = None
    status: Optional[str] = None # pending, confirmed, waiting, cancelled, rejected, attended
    workshop_id: Optional[int] = None

class RegistrationResponse(BaseModel):
    id: int
    code: str
    invitation_id: int
    workshop_id: int
    full_name: str
    email: EmailStr
    phone: str
    institution: Optional[str] = None
    age: Optional[int] = None
    status: str
    terms_accepted: bool
    data_treatment_accepted: bool
    comments: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    workshop: Optional[WorkshopResponse] = None

    class Config:
        from_attributes = True

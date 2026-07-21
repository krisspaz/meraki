from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

class InvitationBase(BaseModel):
    invited_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    max_uses: int = 1
    expiration_date: Optional[datetime] = None
    status: str = "active" # active, used, exhausted, expired, disabled

class InvitationCreate(InvitationBase):
    pass

class InvitationBulkCreate(BaseModel):
    prefix: str = "INV"
    quantity: int = 10
    max_uses_per_invitation: int = 1
    expiration_date: Optional[datetime] = None

class InvitationUpdate(BaseModel):
    invited_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    max_uses: Optional[int] = None
    expiration_date: Optional[datetime] = None
    status: Optional[str] = None

class InvitationResponse(InvitationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    code: str
    token: str
    used_count: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

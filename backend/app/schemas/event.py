from pydantic import BaseModel, EmailStr
from datetime import date, time, datetime
from typing import Optional

class EventBase(BaseModel):
    name: str
    organizer: str
    description: str
    banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    start_date: date
    start_time: time
    end_time: time
    location: str
    contact_email: EmailStr
    registration_deadline: datetime
    max_participants: int
    status: str # draft, active, closed, finished

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str] = None
    organizer: Optional[str] = None
    description: Optional[str] = None
    banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    start_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    registration_deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    status: Optional[str] = None

class EventResponse(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel, computed_field
from datetime import time, datetime
from typing import Optional

class WorkshopBase(BaseModel):
    name: str
    description: str
    image_url: Optional[str] = None
    speaker_name: str
    speaker_bio: str
    start_time: time
    end_time: time
    room: str
    capacity: int
    status: str # available, almost_full, full, closed_manually, cancelled

class WorkshopCreate(WorkshopBase):
    pass

class WorkshopUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    speaker_name: Optional[str] = None
    speaker_bio: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None

class WorkshopResponse(WorkshopBase):
    id: int
    confirmed_count: int
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def slots_available(self) -> int:
        return max(0, self.capacity - self.confirmed_count)

    class Config:
        from_attributes = True

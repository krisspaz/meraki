from sqlalchemy import Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base
import datetime

class WaitingList(Base):
    __tablename__ = "waiting_list"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    registration_id: Mapped[int] = mapped_column(Integer, ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False)
    workshop_id: Mapped[int] = mapped_column(Integer, ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False) # Posición en la lista de espera
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    registration = relationship("Registration")
    workshop = relationship("Workshop")

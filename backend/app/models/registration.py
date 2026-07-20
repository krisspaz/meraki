from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base
import datetime

class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    invitation_id: Mapped[int] = mapped_column(Integer, ForeignKey("invitations.id", ondelete="RESTRICT"), nullable=False)
    workshop_id: Mapped[int] = mapped_column(Integer, ForeignKey("workshops.id", ondelete="RESTRICT"), nullable=False)
    
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    institution: Mapped[str | None] = mapped_column(String(150), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False) # pending, confirmed, waiting, cancelled, rejected, attended
    terms_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data_treatment_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    confirmed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    invitation = relationship("Invitation")
    workshop = relationship("Workshop")

# Índice único parcial para evitar correos duplicados en inscripciones activas (excluyendo canceladas y rechazadas)
Index(
    "idx_unique_email_active_registration",
    Registration.email,
    unique=True,
    postgresql_where=(Registration.status != "cancelled") & (Registration.status != "rejected")
)

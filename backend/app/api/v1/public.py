from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api.deps import get_db
from app.models.event import Event
from app.models.invitation import Invitation
from app.models.workshop import Workshop
from app.schemas.event import EventResponse
from app.schemas.workshop import WorkshopResponse
from app.schemas.invitation import InvitationResponse
from app.schemas.registration import RegistrationCreate, RegistrationPublicResponse, RegistrationCancel
from app.services.registration_service import RegistrationService
from app.repositories.invitation import InvitationRepository
from app.repositories.registration import RegistrationRepository

router = APIRouter()

@router.get("/event", response_model=EventResponse)
async def get_active_event(db: AsyncSession = Depends(get_db)):
    """
    Obtiene la información general del evento activo.
    """
    query = select(Event).where(Event.status == "active").limit(1)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "EVENT_NOT_FOUND", "message": "No hay ningún evento activo actualmente."}
        )
    return event

@router.get("/workshops", response_model=List[WorkshopResponse])
async def get_public_workshops(db: AsyncSession = Depends(get_db)):
    """
    Obtiene los talleres disponibles para el evento público.
    """
    query = select(Workshop).order_by(Workshop.start_time)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/invitations/{token}", response_model=InvitationResponse)
async def validate_invitation(token: str, db: AsyncSession = Depends(get_db)):
    """
    Comprueba si un enlace/token de invitación es válido y devuelve sus datos básicos.
    """
    inv_repo = InvitationRepository(db)
    invitation = await inv_repo.get_by_token(token)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INVITATION_NOT_FOUND", "message": "La invitación especificada no existe."}
        )
    
    if invitation.status == "disabled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "INVITATION_DISABLED", "message": "Esta invitación ha sido deshabilitada."}
        )
        
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc)
    if invitation.expiration_date:
        exp_date = invitation.expiration_date
        if exp_date.tzinfo is None:
            exp_date = exp_date.replace(tzinfo=datetime.timezone.utc)
            
        if exp_date < now:
            invitation.status = "expired"
            await db.flush()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail={"code": "INVITATION_EXPIRED", "message": "Esta invitación ha vencido."}
            )

    if invitation.used_count >= invitation.max_uses or invitation.status in ["used", "exhausted"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "INVITATION_LIMIT_REACHED", "message": "Esta invitación ya alcanzó su número máximo de usos."}
        )

    return invitation

@router.post("/registrations", response_model=RegistrationPublicResponse, status_code=status.HTTP_201_CREATED)
async def register_participant(
    reg_in: RegistrationCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Registra a un participante usando un token de invitación y aplicando bloqueos concurrentes.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    reg_service = RegistrationService(db)
    registration = await reg_service.register_participant(
        reg_in=reg_in,
        ip_address=ip_address,
        user_agent=user_agent
    )
    # Confirmar cambios
    await db.commit()
    # Recargar relaciones
    reg_repo = RegistrationRepository(db)
    return await reg_repo.get_by_code(registration.code)

@router.get("/registrations/{registration_code}", response_model=RegistrationPublicResponse)
async def get_registration_by_code(
    registration_code: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene los detalles de una inscripción por su código de registro único.
    """
    reg_repo = RegistrationRepository(db)
    registration = await reg_repo.get_by_code(registration_code)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REGISTRATION_NOT_FOUND", "message": "El código de registro especificado no existe."}
        )
    return registration

@router.post("/registrations/{registration_code}/cancel", response_model=RegistrationPublicResponse)
async def cancel_registration_by_code(
    registration_code: str,
    cancel_in: RegistrationCancel,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancela un registro, devuelve el cupo al taller y promueve de lista de espera si corresponde.
    """
    reg_service = RegistrationService(db)
    registration = await reg_service.cancel_registration(
        code=registration_code,
        reason=cancel_in.reason
    )
    await db.commit()
    
    reg_repo = RegistrationRepository(db)
    return await reg_repo.get_by_code(registration.code)

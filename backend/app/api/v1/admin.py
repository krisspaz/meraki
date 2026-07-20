import csv
import io
import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.event import Event
from app.models.workshop import Workshop
from app.models.invitation import Invitation
from app.models.registration import Registration
from app.models.waiting_list import WaitingList
from app.models.audit_log import AuditLog
from app.models.setting import Setting

from app.schemas.event import EventResponse, EventUpdate
from app.schemas.workshop import WorkshopResponse, WorkshopCreate, WorkshopUpdate
from app.schemas.invitation import InvitationResponse, InvitationCreate, InvitationBulkCreate, InvitationUpdate
from app.schemas.registration import RegistrationResponse, RegistrationUpdateAdmin
from app.services.workshop_service import WorkshopService
from app.services.invitation_service import InvitationService
from app.services.registration_service import RegistrationService
from app.repositories.registration import RegistrationRepository
from app.repositories.invitation import InvitationRepository

router = APIRouter()

# Helper to log audit actions
async def log_audit(db: AsyncSession, user_id: int, action: str, target_type: str, target_id: str, details: dict = None):
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details) if details else None
    )
    db.add(log_entry)
    await db.flush()

@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene las métricas clave para el panel administrativo.
    """
    # 1. Obtener evento activo para capacidades generales
    event_res = await db.execute(select(Event).where(Event.status == "active").limit(1))
    event = event_res.scalar_one_or_none()
    max_event_participants = event.max_participants if event else 0

    # 2. Métricas de Invitaciones
    total_invs = await db.scalar(select(func.count(Invitation.id))) or 0
    used_invs = await db.scalar(select(func.sum(Invitation.used_count))) or 0
    available_invs = await db.scalar(select(func.count(Invitation.id)).where(Invitation.status == "active")) or 0
    expired_invs = await db.scalar(select(func.count(Invitation.id)).where(Invitation.status == "expired")) or 0

    # 3. Métricas de Participantes
    confirmed_regs = await db.scalar(select(func.count(Registration.id)).where(Registration.status == "confirmed")) or 0
    waiting_regs = await db.scalar(select(func.count(Registration.id)).where(Registration.status == "waiting")) or 0
    attended_regs = await db.scalar(select(func.count(Registration.id)).where(Registration.status == "attended")) or 0

    total_active_participants = confirmed_regs + attended_regs

    # Cupos generales disponibles
    general_slots_available = max(0, max_event_participants - total_active_participants)

    # 4. Participantes por taller y porcentajes
    workshops_res = await db.execute(select(Workshop).order_by(Workshop.start_time))
    workshops = workshops_res.scalars().all()
    workshops_stats = []
    
    for w in workshops:
        occupation_pct = (w.confirmed_count / w.capacity * 100) if w.capacity > 0 else 0
        workshops_stats.append({
            "id": w.id,
            "name": w.name,
            "capacity": w.capacity,
            "confirmed_count": w.confirmed_count,
            "slots_available": max(0, w.capacity - w.confirmed_count),
            "occupation_percentage": round(occupation_pct, 2),
            "status": w.status
        })

    # 5. Registros recientes (últimos 5)
    recent_res = await db.execute(
        select(Registration)
        .order_by(Registration.created_at.desc())
        .limit(5)
    )
    recent_regs = recent_res.scalars().all()
    recent_regs_data = [{
        "id": r.id,
        "code": r.code,
        "full_name": r.full_name,
        "email": r.email,
        "status": r.status,
        "created_at": r.created_at
    } for r in recent_regs]

    return {
        "invitations": {
            "total": total_invs,
            "used": used_invs,
            "available": available_invs,
            "expired": expired_invs
        },
        "participants": {
            "confirmed": confirmed_regs,
            "waiting": waiting_regs,
            "attended": attended_regs,
            "total_active": total_active_participants,
            "general_slots_available": general_slots_available,
            "max_participants_limit": max_event_participants
        },
        "workshops": workshops_stats,
        "recent_registrations": recent_regs_data
    }

# --- WORKSHOPS ---

@router.get("/workshops", response_model=List[WorkshopResponse])
async def list_workshops_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = WorkshopService(db)
    return await service.get_workshops()

@router.post("/workshops", response_model=WorkshopResponse, status_code=status.HTTP_201_CREATED)
async def create_workshop_admin(
    workshop_in: WorkshopCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = WorkshopService(db)
    workshop = await service.create_workshop(workshop_in)
    await log_audit(db, current_user.id, "create_workshop", "workshop", str(workshop.id), workshop_in.model_dump())
    await db.commit()
    return workshop

@router.put("/workshops/{id}", response_model=WorkshopResponse)
async def update_workshop_admin(
    id: int,
    workshop_in: WorkshopUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = WorkshopService(db)
    workshop = await service.update_workshop(id, workshop_in)
    await log_audit(db, current_user.id, "update_workshop", "workshop", str(id), workshop_in.model_dump(exclude_unset=True))
    await db.commit()
    return workshop

@router.delete("/workshops/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workshop_admin(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = WorkshopService(db)
    await service.delete_workshop(id)
    await log_audit(db, current_user.id, "delete_workshop", "workshop", str(id))
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/workshops/{id}/close", response_model=WorkshopResponse)
async def close_workshop_manually(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cierra un taller manualmente."""
    service = WorkshopService(db)
    workshop = await service.update_workshop(id, WorkshopUpdate(status="closed_manually"))
    await log_audit(db, current_user.id, "close_workshop_manually", "workshop", str(id))
    await db.commit()
    return workshop

@router.post("/workshops/{id}/open", response_model=WorkshopResponse)
async def open_workshop_manually(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reabre un taller manualmente (restableciendo su estado de acuerdo a la capacidad)."""
    service = WorkshopService(db)
    # Mandamos 'available' para que el servicio verifique y re-calcule si está lleno o casi lleno
    workshop = await service.update_workshop(id, WorkshopUpdate(status="available"))
    await log_audit(db, current_user.id, "open_workshop_manually", "workshop", str(id))
    await db.commit()
    return workshop

# --- INVITATIONS ---

@router.get("/invitations")
async def list_invitations_admin(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Invitation)
    count_query = select(func.count(Invitation.id))
    
    if search:
        search_pat = f"%{search}%"
        query = query.where(Invitation.invited_name.ilike(search_pat) | Invitation.code.ilike(search_pat))
        count_query = count_query.where(Invitation.invited_name.ilike(search_pat) | Invitation.code.ilike(search_pat))

    query = query.order_by(Invitation.created_at.desc()).offset(skip).limit(limit)
    res = await db.execute(query)
    invitations = res.scalars().all()
    
    total = await db.scalar(count_query) or 0
    return {"invitations": invitations, "total": total}

@router.post("/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation_admin(
    inv_in: InvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = InvitationService(db)
    invitation = await service.create_invitation(inv_in, creator_id=current_user.id)
    await log_audit(db, current_user.id, "create_invitation", "invitation", str(invitation.id), inv_in.model_dump())
    await db.commit()
    return invitation

@router.post("/invitations/bulk", response_model=List[InvitationResponse], status_code=status.HTTP_201_CREATED)
async def create_invitations_bulk_admin(
    bulk_in: InvitationBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = InvitationService(db)
    invitations = await service.create_bulk_invitations(bulk_in, creator_id=current_user.id)
    await log_audit(db, current_user.id, "create_invitations_bulk", "invitation", "bulk", bulk_in.model_dump())
    await db.commit()
    return invitations

@router.put("/invitations/{id}", response_model=InvitationResponse)
async def update_invitation_admin(
    id: int,
    inv_in: InvitationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    inv_repo = InvitationRepository(db)
    invitation = await inv_repo.get(id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitación no encontrada.")

    update_data = inv_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invitation, field, value)

    await log_audit(db, current_user.id, "update_invitation", "invitation", str(id), update_data)
    await db.commit()
    return invitation

@router.post("/invitations/{id}/toggle")
async def toggle_invitation_status(
    id: int,
    active: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deshabilita o rehabilita una invitación."""
    service = InvitationService(db)
    invitation = await service.toggle_invitation_status(id, active)
    await log_audit(db, current_user.id, "toggle_invitation", "invitation", str(id), {"active": active})
    await db.commit()
    return invitation

# --- REGISTRATIONS ---

@router.get("/registrations")
async def list_registrations_admin(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    workshop_id: Optional[int] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    repo = RegistrationRepository(db)
    regs, total = await repo.get_registrations_paginated(
        skip=skip,
        limit=limit,
        search=search,
        workshop_id=workshop_id,
        status=status
    )
    return {"registrations": regs, "total": total}

@router.put("/registrations/{id}", response_model=RegistrationResponse)
async def update_registration_admin(
    id: int,
    reg_in: RegistrationUpdateAdmin,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    repo = RegistrationRepository(db)
    registration = await repo.get_for_update(id)
    if not registration:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada.")

    update_data = reg_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field != "workshop_id": # El cambio de taller se maneja por su propio endpoint transaccional
            setattr(registration, field, value)

    await log_audit(db, current_user.id, "update_registration", "registration", str(id), update_data)
    await db.commit()
    
    return await repo.get_by_code(registration.code)

@router.post("/registrations/{id}/change-workshop", response_model=RegistrationResponse)
async def change_workshop_admin(
    id: int,
    new_workshop_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cambia a un participante de taller de forma segura aplicando transacciones concurrentes."""
    service = RegistrationService(db)
    registration = await service.change_workshop_admin(id, new_workshop_id)
    await log_audit(db, current_user.id, "change_workshop", "registration", str(id), {"new_workshop_id": new_workshop_id})
    await db.commit()

    repo = RegistrationRepository(db)
    return await repo.get_by_code(registration.code)

@router.post("/registrations/{id}/attendance", response_model=RegistrationResponse)
async def register_attendance_admin(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Registra la asistencia física del participante en el evento."""
    repo = RegistrationRepository(db)
    registration = await repo.get_for_update(id)
    if not registration:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada.")

    registration.status = "attended"
    await log_audit(db, current_user.id, "register_attendance", "registration", str(id))
    await db.commit()
    
    return await repo.get_by_code(registration.code)

# --- CSV EXPORT ---

@router.get("/exports/registrations.csv")
async def export_registrations_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Exporta el listado de participantes confirmados, en espera y que asistieron a formato CSV.
    """
    # Consulta de registros excluyendo cancelados y rechazados
    query = select(Registration).where(Registration.status.notin_(["cancelled", "rejected"])).order_by(Registration.created_at)
    res = await db.execute(query)
    registrations = res.scalars().all()

    # Generar CSV en memoria
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';') # delimitador ';' ideal para Excel en español

    # Encabezados
    writer.writerow([
        "Codigo Registro", "Nombre Completo", "Correo Electronico", "Telefono", 
        "Institucion", "Edad", "ID Taller", "Estado", "Fecha Registro", "Confirmado En"
    ])

    for r in registrations:
        writer.writerow([
            r.code,
            r.full_name,
            r.email,
            r.phone,
            r.institution or "",
            r.age or "",
            r.workshop_id,
            r.status,
            r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
            r.confirmed_at.strftime("%Y-%m-%d %H:%M:%S") if r.confirmed_at else ""
        ])

    # Convertir a bytes para la respuesta
    csv_data = output.getvalue().encode('utf-8-sig') # utf-8-sig añade el BOM para que Excel abra acentos correctamente
    output.close()

    # Streaming response
    return StreamingResponse(
        io.BytesIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=registros_expo360_meraki_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

# --- CONFIGURACIÓN GENERAL ---

from app.schemas.setting import SettingUpdate
from app.schemas.event import EventUpdate

@router.get("/settings")
async def get_all_settings_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene todas las configuraciones clave-valor."""
    query = select(Setting)
    res = await db.execute(query)
    return res.scalars().all()

@router.put("/settings/{key}")
async def update_setting_admin(
    key: str,
    setting_in: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Actualiza una clave de configuración del sistema."""
    repo = SettingRepository(db)
    setting = await repo.set_value(key, setting_in.value)
    await log_audit(db, current_user.id, "update_setting", "setting", key, {"value": setting_in.value})
    await db.commit()
    return setting

@router.get("/event", response_model=EventResponse)
async def get_event_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene el evento activo para ser editado en el panel."""
    query = select(Event).where(Event.status == "active").limit(1)
    res = await db.execute(query)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="No se encontró un evento activo.")
    return event

@router.put("/event", response_model=EventResponse)
async def update_event_admin(
    event_in: EventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Actualiza la información general de la actividad activa."""
    query = select(Event).where(Event.status == "active").limit(1)
    res = await db.execute(query)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="No se encontró un evento activo para actualizar.")
    
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
        
    await log_audit(db, current_user.id, "update_event", "event", str(event.id), update_data)
    await db.commit()
    return event


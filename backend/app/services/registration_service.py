import datetime
import random
import string
from typing import Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.event import Event
from app.models.workshop import Workshop
from app.models.invitation import Invitation
from app.models.registration import Registration
from app.models.waiting_list import WaitingList
from app.models.setting import Setting
from app.schemas.registration import RegistrationCreate, RegistrationUpdateAdmin
from app.repositories.registration import RegistrationRepository
from app.repositories.workshop import WorkshopRepository
from app.repositories.invitation import InvitationRepository
from app.repositories.setting import SettingRepository

def generate_unique_code(prefix: str = "REG", length: int = 6) -> str:
    """Genera un código aleatorio único para la confirmación de asistencia."""
    chars = string.ascii_uppercase + string.digits
    return f"{prefix}-{''.join(random.choices(chars, k=length))}"

class RegistrationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.reg_repo = RegistrationRepository(db)
        self.work_repo = WorkshopRepository(db)
        self.inv_repo = InvitationRepository(db)
        self.set_repo = SettingRepository(db)

    async def _update_workshop_status(self, workshop: Workshop, almost_pct: float) -> None:
        """Actualiza automáticamente el estado del taller según la ocupación."""
        if workshop.status in ["closed_manually", "cancelled"]:
            return # Mantener estados manuales del admin
        
        if workshop.confirmed_count >= workshop.capacity:
            workshop.status = "full"
        elif workshop.confirmed_count >= workshop.capacity * almost_pct:
            workshop.status = "almost_full"
        else:
            workshop.status = "available"

    async def register_participant(
        self,
        reg_in: RegistrationCreate,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Registration:
        """
        Registra a un participante aplicando bloqueo pesimista en PostgreSQL.
        El flujo completo corre en una única transacción de base de datos.
        """
        now = datetime.datetime.now(datetime.timezone.utc)

        # 1. BLOQUEAR y Obtener Invitación
        invitation = await self.inv_repo.get_by_token_for_update(reg_in.invitation_token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "INVITATION_NOT_FOUND", "message": "La invitación especificada no existe."}
            )

        # Validaciones de Invitación
        if invitation.status == "disabled":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "INVITATION_DISABLED", "message": "Esta invitación está deshabilitada."}
            )
        
        if invitation.expiration_date and invitation.expiration_date.tzinfo is None:
            # Asegurar timezone
            invitation.expiration_date = invitation.expiration_date.replace(tzinfo=datetime.timezone.utc)
            
        if invitation.expiration_date and invitation.expiration_date < now:
            invitation.status = "expired"
            await self.db.flush()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail={"code": "INVITATION_EXPIRED", "message": "Esta invitación ha vencido."}
            )

        if invitation.used_count >= invitation.max_uses or invitation.status in ["used", "exhausted"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "INVITATION_LIMIT_REACHED", "message": "Esta invitación ya alcanzó su número máximo de usos."}
            )

        # 2. BLOQUEAR y Obtener Taller seleccionado
        workshop = await self.work_repo.get_for_update(reg_in.workshop_id)
        if not workshop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "WORKSHOP_NOT_FOUND", "message": "El taller seleccionado no existe."}
            )

        if workshop.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "WORKSHOP_CANCELLED", "message": "El taller seleccionado ha sido cancelado."}
            )
        if workshop.status == "closed_manually":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "WORKSHOP_CLOSED", "message": "El taller seleccionado ha sido cerrado por el administrador."}
            )

        # 3. BLOQUEAR y Obtener Evento Activo
        # Para evitar sobrepasar el max_participantes_evento en registros paralelos
        event_query = select(Event).where(Event.status == "active").with_for_update()
        event_res = await self.db.execute(event_query)
        event = event_res.scalar_one_or_none()
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "EVENT_NOT_ACTIVE", "message": "El evento no se encuentra activo para inscripciones."}
            )

        if event.registration_deadline and event.registration_deadline.tzinfo is None:
            event.registration_deadline = event.registration_deadline.replace(tzinfo=datetime.timezone.utc)

        if event.registration_deadline and event.registration_deadline < now:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail={"code": "REGISTRATION_DEADLINE_PASSED", "message": "La fecha límite para confirmar asistencia ha finalizado."}
            )

        # 4. Comprobar registros duplicados por correo en esta transacción
        existing_active = await self.reg_repo.get_by_email_active(reg_in.email)
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "DUPLICATE_EMAIL", "message": "Este correo electrónico ya se encuentra registrado para esta actividad."}
            )

        # 5. Obtener Configuraciones dinámicas de la base de datos
        settings_dict = await self.set_repo.get_all_dict()
        almost_pct = float(settings_dict.get("almost_full_percentage", "0.80"))
        waitlist_enabled = settings_dict.get("waitlist_enabled", "false").lower() == "true"

        # Conteo total de confirmados para validar límite general del evento
        total_confirmed = await self.reg_repo.get_active_count_for_event()

        # 6. Evaluar capacidades
        event_full = total_confirmed >= event.max_participants
        workshop_full = workshop.confirmed_count >= workshop.capacity

        if event_full or workshop_full:
            if waitlist_enabled:
                # Registrar en lista de espera
                reg_code = generate_unique_code("WAIT")
                registration = Registration(
                    code=reg_code,
                    invitation_id=invitation.id,
                    workshop_id=workshop.id,
                    full_name=reg_in.full_name,
                    email=reg_in.email,
                    phone=reg_in.phone,
                    institution=reg_in.institution,
                    age=reg_in.age,
                    status="waiting",
                    terms_accepted=reg_in.terms_accepted,
                    data_treatment_accepted=reg_in.data_treatment_accepted,
                    comments=reg_in.comments,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                self.db.add(registration)
                await self.db.flush()

                # Obtener la posición de la lista de espera
                wait_count_query = select(func.count(WaitingList.id)).where(WaitingList.workshop_id == workshop.id)
                wait_count_res = await self.db.execute(wait_count_query)
                wait_position = (wait_count_res.scalar() or 0) + 1

                waiting_entry = WaitingList(
                    registration_id=registration.id,
                    workshop_id=workshop.id,
                    position=wait_position
                )
                self.db.add(waiting_entry)
                
                # Consumir un uso de la invitación si es grupal, o marcar como utilizada
                # Nota: si queda en lista de espera, el uso se descuenta ya que se asocia la invitación al cupo en espera.
                invitation.used_count += 1
                if invitation.used_count >= invitation.max_uses:
                    invitation.status = "exhausted"

                await self.db.flush()
                return registration
            else:
                # Si el evento está lleno
                if event_full:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={"code": "EVENT_FULL", "message": "Los cupos disponibles para esta actividad se han agotado. Gracias por tu interés."}
                    )
                # Si el taller está lleno
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "WORKSHOP_FULL",
                        "message": "El taller seleccionado acaba de alcanzar su capacidad máxima.",
                        "available_slots": 0
                    }
                )

        # 7. Si hay capacidad: Confirmar Registro
        reg_code = generate_unique_code("REG")
        registration = Registration(
            code=reg_code,
            invitation_id=invitation.id,
            workshop_id=workshop.id,
            full_name=reg_in.full_name,
            email=reg_in.email,
            phone=reg_in.phone,
            institution=reg_in.institution,
            age=reg_in.age,
            status="confirmed",
            terms_accepted=reg_in.terms_accepted,
            data_treatment_accepted=reg_in.data_treatment_accepted,
            comments=reg_in.comments,
            ip_address=ip_address,
            user_agent=user_agent,
            confirmed_at=datetime.datetime.now(datetime.timezone.utc)
        )
        self.db.add(registration)

        # Actualizar contadores y estados
        invitation.used_count += 1
        if invitation.used_count >= invitation.max_uses:
            invitation.status = "exhausted"

        workshop.confirmed_count += 1
        await self._update_workshop_status(workshop, almost_pct)

        await self.db.flush()
        return registration

    async def cancel_registration(self, code: str, reason: Optional[str] = None) -> Registration:
        """
        Cancela una inscripción y libera el cupo del taller correspondiente,
        promoviendo opcionalmente a la primera persona en la lista de espera.
        """
        # Obtener registro
        registration = await self.reg_repo.get_by_code(code)
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "REGISTRATION_NOT_FOUND", "message": "El código de registro no es válido."}
            )

        if registration.status in ["cancelled", "rejected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "ALREADY_CANCELLED", "message": "Esta inscripción ya fue cancelada previamente."}
            )

        # Bloquear taller para actualizar contadores
        workshop = await self.work_repo.get_for_update(registration.workshop_id)
        # Bloquear invitación
        invitation = await self.inv_repo.get_by_token_for_update(registration.invitation.token)

        old_status = registration.status
        registration.status = "cancelled"
        registration.cancelled_at = datetime.datetime.now(datetime.timezone.utc)
        registration.cancellation_reason = reason

        # Devolver el uso de la invitación
        if invitation and invitation.used_count > 0:
            invitation.used_count -= 1
            if invitation.status == "exhausted" and invitation.used_count < invitation.max_uses:
                invitation.status = "active"

        # Si estaba confirmado, liberar espacio y promover de la lista de espera
        if old_status == "confirmed":
            workshop.confirmed_count = max(0, workshop.confirmed_count - 1)
            
            # Obtener configuración
            settings_dict = await self.set_repo.get_all_dict()
            almost_pct = float(settings_dict.get("almost_full_percentage", "0.80"))
            waitlist_enabled = settings_dict.get("waitlist_enabled", "false").lower() == "true"

            await self._update_workshop_status(workshop, almost_pct)

            # Promoción automática si la lista de espera está activada
            if waitlist_enabled:
                # Obtener la primera persona de la lista de espera
                wait_query = select(WaitingList).where(
                    WaitingList.workshop_id == workshop.id
                ).order_by(WaitingList.position).limit(1)
                wait_res = await self.db.execute(wait_query)
                first_waiting = wait_res.scalar_one_or_none()

                if first_waiting:
                    # Bloquear y obtener la inscripción correspondiente
                    waiting_reg = await self.reg_repo.get_for_update(first_waiting.registration_id)
                    if waiting_reg and waiting_reg.status == "waiting":
                        # Promover a confirmado
                        waiting_reg.status = "confirmed"
                        waiting_reg.confirmed_at = datetime.datetime.now(datetime.timezone.utc)
                        
                        workshop.confirmed_count += 1
                        await self._update_workshop_status(workshop, almost_pct)

                        # Eliminar de la lista de espera
                        await self.db.delete(first_waiting)

                        # Reordenar las posiciones de los restantes
                        rem_query = select(WaitingList).where(
                            WaitingList.workshop_id == workshop.id
                        ).order_by(WaitingList.position)
                        rem_res = await self.db.execute(rem_query)
                        remaining = rem_res.scalars().all()
                        for idx, entry in enumerate(remaining):
                            entry.position = idx + 1

        elif old_status == "waiting":
            # Si estaba en lista de espera, quitar de la lista de espera y reordenar
            wait_query = select(WaitingList).where(
                WaitingList.registration_id == registration.id
            )
            wait_res = await self.db.execute(wait_query)
            waiting_entry = wait_res.scalar_one_or_none()
            if waiting_entry:
                await self.db.delete(waiting_entry)
                
                # Reordenar
                rem_query = select(WaitingList).where(
                    WaitingList.workshop_id == workshop.id
                ).order_by(WaitingList.position)
                rem_res = await self.db.execute(rem_query)
                remaining = rem_res.scalars().all()
                for idx, entry in enumerate(remaining):
                    entry.position = idx + 1

        await self.db.flush()
        return registration

    async def change_workshop_admin(self, reg_id: int, new_workshop_id: int) -> Registration:
        """
        Cambia administrativamente el taller de un participante de forma segura y transaccional,
        aplicando bloqueos FOR UPDATE.
        """
        # 1. Bloquear inscripción
        registration = await self.reg_repo.get_for_update(reg_id)
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "REGISTRATION_NOT_FOUND", "message": "Inscripción no encontrada."}
            )

        if registration.workshop_id == new_workshop_id:
            return registration # No hay cambios

        # 2. Bloquear ambos talleres (el anterior y el nuevo)
        old_workshop = await self.work_repo.get_for_update(registration.workshop_id)
        new_workshop = await self.work_repo.get_for_update(new_workshop_id)

        if not new_workshop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "WORKSHOP_NOT_FOUND", "message": "El taller de destino no existe."}
            )

        # Validaciones de estado del nuevo taller
        if new_workshop.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "WORKSHOP_CANCELLED", "message": "El taller de destino ha sido cancelado."}
            )

        # Comprobar configuraciones
        settings_dict = await self.set_repo.get_all_dict()
        almost_pct = float(settings_dict.get("almost_full_percentage", "0.80"))

        if registration.status == "confirmed":
            # Si el participante ya estaba confirmado, requerimos cupo en el nuevo taller
            if new_workshop.confirmed_count >= new_workshop.capacity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"code": "WORKSHOP_FULL", "message": "El taller de destino no tiene cupos disponibles."}
                )

            # Restar del taller anterior
            if old_workshop:
                old_workshop.confirmed_count = max(0, old_workshop.confirmed_count - 1)
                await self._update_workshop_status(old_workshop, almost_pct)

            # Sumar al nuevo taller
            new_workshop.confirmed_count += 1
            await self._update_workshop_status(new_workshop, almost_pct)

            registration.workshop_id = new_workshop_id

        elif registration.status == "waiting":
            # Si estaba en lista de espera del taller anterior, lo quitamos y agregamos a la lista de espera del nuevo
            # Quitar de la lista de espera anterior y reordenar
            wait_query = select(WaitingList).where(
                WaitingList.registration_id == registration.id
            )
            wait_res = await self.db.execute(wait_query)
            old_waiting_entry = wait_res.scalar_one_or_none()
            if old_waiting_entry:
                await self.db.delete(old_waiting_entry)
                
                # Reordenar anterior
                if old_workshop:
                    rem_query = select(WaitingList).where(
                        WaitingList.workshop_id == old_workshop.id
                    ).order_by(WaitingList.position)
                    rem_res = await self.db.execute(rem_query)
                    remaining = rem_res.scalars().all()
                    for idx, entry in enumerate(remaining):
                        entry.position = idx + 1

            # Agregar a la lista de espera del nuevo taller
            new_wait_count_query = select(func.count(WaitingList.id)).where(WaitingList.workshop_id == new_workshop_id)
            new_wait_count_res = await self.db.execute(new_wait_count_query)
            new_position = (new_wait_count_res.scalar() or 0) + 1

            new_waiting_entry = WaitingList(
                registration_id=registration.id,
                workshop_id=new_workshop_id,
                position=new_position
            )
            self.db.add(new_waiting_entry)
            registration.workshop_id = new_workshop_id

        await self.db.flush()
        return registration

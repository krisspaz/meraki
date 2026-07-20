import asyncio
import datetime
import pytest
from sqlalchemy import select
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.models.event import Event
from app.models.workshop import Workshop
from app.models.invitation import Invitation
from app.models.registration import Registration
from app.models.setting import Setting
from app.services.registration_service import RegistrationService
from app.services.workshop_service import WorkshopService
from app.schemas.registration import RegistrationCreate
from app.schemas.workshop import WorkshopUpdate, WorkshopCreate

# Helper to load seed-like elements in a specific test session
async def setup_test_base_data(db: AsyncSession):
    # Event
    event = Event(
        name="Test Event",
        organizer="Carrera Test",
        description="Event for testing",
        start_date=datetime.date(2026, 8, 16),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(18, 0),
        location="Salón de prueba",
        contact_email="test@meraki.com",
        registration_deadline=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=5),
        max_participants=5,
        status="active"
      )
    db.add(event)

    # Settings
    db.add(Setting(key="waitlist_enabled", value="false"))
    db.add(Setting(key="almost_full_percentage", value="0.80"))

    # Workshop
    workshop = Workshop(
        name="Test Workshop",
        description="Description",
        speaker_name="Speaker",
        speaker_bio="Bio",
        start_time=datetime.time(10, 0),
        end_time=datetime.time(12, 0),
        room="Salón A",
        capacity=2,
        confirmed_count=0,
        status="available"
    )
    db.add(workshop)

    # Invitation
    invitation = Invitation(
        code="INV-TEST",
        token="token_test",
        max_uses=2,
        used_count=0,
        status="active"
    )
    db.add(invitation)

    await db.flush()
    return event, workshop, invitation


@pytest.mark.asyncio
async def test_valid_registration(db_session: AsyncSession):
    _, _, invitation = await setup_test_base_data(db_session)
    
    service = RegistrationService(db_session)
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    registration = await service.register_participant(reg_in)
    
    assert registration.status == "confirmed"
    assert registration.full_name == "Juan Perez"
    assert invitation.used_count == 1


@pytest.mark.asyncio
async def test_invitation_not_found(db_session: AsyncSession):
    await setup_test_base_data(db_session)
    service = RegistrationService(db_session)
    
    reg_in = RegistrationCreate(
        invitation_token="invalid_token",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await service.register_participant(reg_in)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_invitation_expired(db_session: AsyncSession):
    _, _, invitation = await setup_test_base_data(db_session)
    invitation.expiration_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    await db_session.flush()
    
    service = RegistrationService(db_session)
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await service.register_participant(reg_in)
    assert exc_info.value.status_code == 410


@pytest.mark.asyncio
async def test_invitation_disabled(db_session: AsyncSession):
    _, _, invitation = await setup_test_base_data(db_session)
    invitation.status = "disabled"
    await db_session.flush()
    
    service = RegistrationService(db_session)
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await service.register_participant(reg_in)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_invitation_exhausted(db_session: AsyncSession):
    _, _, invitation = await setup_test_base_data(db_session)
    invitation.used_count = 2 # max_uses es 2
    invitation.status = "exhausted"
    await db_session.flush()
    
    service = RegistrationService(db_session)
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await service.register_participant(reg_in)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_workshop_full_no_waitlist(db_session: AsyncSession):
    _, workshop, _ = await setup_test_base_data(db_session)
    workshop.confirmed_count = 2 # capacidad es 2
    workshop.status = "full"
    await db_session.flush()
    
    service = RegistrationService(db_session)
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await service.register_participant(reg_in)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_event_full(db_session: AsyncSession):
    # setup base data
    event, _, _ = await setup_test_base_data(db_session)
    event.max_participants = 0 # Evento ya lleno
    await db_session.flush()

    service = RegistrationService(db_session)
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await service.register_participant(reg_in)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_duplicate_registration_email(db_session: AsyncSession):
    await setup_test_base_data(db_session)
    service = RegistrationService(db_session)
    
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    await service.register_participant(reg_in)
    
    # Intentar registrar de nuevo el mismo correo
    with pytest.raises(HTTPException) as exc_info:
        await service.register_participant(reg_in)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_concurrency_race_condition(test_engine):
    """
    PRUEBA DE CONCURRENCIA CLAVE:
    Simula múltiples solicitudes paralelas intentando registrarse al mismo tiempo
    cuando queda exactamente un cupo en el taller.
    Verifica que el bloqueo de filas (FOR UPDATE) previene condiciones de carrera.
    """
    # 1. Preparar datos limpios en la base de datos de prueba
    SessionMaker = async_sessionmaker(bind=test_engine, class_=AsyncSession)
    
    async with SessionMaker() as db:
        # Re-crear base limpia
        await setup_test_base_data(db)
        
        # Modificar capacidad del taller a 1
        workshop_res = await db.execute(select(Workshop).where(Workshop.id == 1))
        workshop = workshop_res.scalar_one()
        workshop.capacity = 1
        
        # Modificar usos máximos de invitación a 5
        inv_res = await db.execute(select(Invitation).where(Invitation.id == 1))
        inv = inv_res.scalar_one()
        inv.max_uses = 5
        
        await db.commit()

    # 2. Definir una tarea asíncrona para simular peticiones de participantes concurrentes
    async def concurrent_registration(participant_num: int):
        # Cada petición debe abrir su propia sesión de BD independiente para forzar transacciones paralelas reales
        async with SessionMaker() as db:
            service = RegistrationService(db)
            reg_in = RegistrationCreate(
                invitation_token="token_test",
                workshop_id=1,
                full_name=f"Participante Concurrente {participant_num}",
                email=f"concurrente_{participant_num}@test.com",
                phone="50680000000",
                terms_accepted=True,
                data_treatment_accepted=True
            )
            try:
                registration = await service.register_participant(reg_in)
                await db.commit()
                return "SUCCESS", registration
            except Exception as e:
                await db.rollback()
                return "FAILED", e

    # 3. Lanzar 5 peticiones concurrentemente
    tasks = [concurrent_registration(i) for i in range(5)]
    results = await asyncio.gather(*tasks)

    # 4. Analizar los resultados
    success_count = 0
    failed_count = 0
    
    for status_res, value in results:
        if status_res == "SUCCESS":
            success_count += 1
        else:
            failed_count += 1
            # Verificar que sea un error de capacidad o cupo agotado (409)
            assert isinstance(value, HTTPException)
            assert value.status_code == 409

    # 5. Afirmaciones críticas: exactamente una debe haber tenido éxito y las otras 4 fallaron
    assert success_count == 1
    assert failed_count == 4

    # Verificar que en la base de datos el contador no superó la capacidad de 1
    async with SessionMaker() as db:
        workshop_res = await db.execute(select(Workshop).where(Workshop.id == 1))
        w = workshop_res.scalar_one()
        assert w.confirmed_count == 1


@pytest.mark.asyncio
async def test_admin_change_workshop_limit(db_session: AsyncSession):
    await setup_test_base_data(db_session)
    
    # Crear un segundo taller lleno
    taller2 = Workshop(
        name="Workshop B",
        description="Desc",
        speaker_name="Speaker",
        speaker_bio="Bio",
        start_time=datetime.time(14, 0),
        end_time=datetime.time(16, 0),
        room="Salón B",
        capacity=1,
        confirmed_count=1,
        status="full"
    )
    db_session.add(taller2)
    await db_session.flush()

    service = RegistrationService(db_session)
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    
    registration = await service.register_participant(reg_in)
    await db_session.flush()

    # Intentar cambiar administrativamente al taller2 que está lleno (capacidad 1, ocupación 1)
    with pytest.raises(HTTPException) as exc_info:
        await service.change_workshop_admin(registration.id, 2)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_admin_invalid_capacity_reduction(db_session: AsyncSession):
    _, workshop, _ = await setup_test_base_data(db_session)
    
    service = RegistrationService(db_session)
    reg_in = RegistrationCreate(
        invitation_token="token_test",
        workshop_id=workshop.id,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    )
    # Registrar 1 participante. Capacidad actual es 2, confirmado es 1.
    await service.register_participant(reg_in)
    await db_session.flush()

    work_service = WorkshopService(db_session)
    # Intentar reducir capacidad a 0 (menor a los confirmados actuales = 1)
    with pytest.raises(HTTPException) as exc_info:
        await work_service.update_workshop(workshop.id, WorkshopUpdate(capacity=0))
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_cancellation_and_waitlist_promotion(db_session: AsyncSession):
    # Activar lista de espera en settings
    await setup_test_base_data(db_session)
    
    sett_res = await db_session.execute(select(Setting).where(Setting.key == "waitlist_enabled"))
    sett = sett_res.scalar_one()
    sett.value = "true"
    
    # Forzar capacidad del taller a 1
    work_res = await db_session.execute(select(Workshop).where(Workshop.id == 1))
    workshop = work_res.scalar_one()
    workshop.capacity = 1
    await db_session.flush()

    service = RegistrationService(db_session)
    
    # Registro 1: Confirma asistencia (consume el único cupo)
    reg1 = await service.register_participant(RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True
    ))
    
    # Registro 2: Entra en lista de espera (waiting)
    reg2 = await service.register_participant(RegistrationCreate(
        invitation_token="token_test",
        workshop_id=1,
        full_name="Maria Lopez",
        email="maria@lopez.com",
        phone="50677777777",
        terms_accepted=True,
        data_treatment_accepted=True
    ))
    
    await db_session.flush()

    assert reg1.status == "confirmed"
    assert reg2.status == "waiting"

    # Cancelar el Registro 1 (Libera cupo y promueve automáticamente al Registro 2)
    await service.cancel_registration(reg1.code, reason="No podré asistir")
    await db_session.flush()

    # Verificar que reg2 fue promovida a "confirmed"
    # Recargar el objeto
    await db_session.refresh(reg2)
    assert reg2.status == "confirmed"
    assert workshop.confirmed_count == 1

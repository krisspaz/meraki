import datetime
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from app.models.event import Event
from app.models.workshop import Workshop
from app.models.invitation import Invitation
from app.models.setting import Setting
from app.models.user import User
from app.core.security import get_password_hash
from app.services.registration_service import RegistrationService
from app.schemas.registration import RegistrationCreate

from app.api.v1 import auth as auth_module

ADMIN_USERNAME = "admin_test"
ADMIN_PASSWORD = "admin_test_password_123"


@pytest.fixture(autouse=True)
def _clear_login_rate_limit():
    """Evita que el rate limiter en memoria contamine el estado entre pruebas."""
    auth_module._login_failures.clear()
    yield
    auth_module._login_failures.clear()


async def _seed(db: AsyncSession) -> tuple[Workshop, Invitation]:
    """Crea el conjunto mínimo de datos (evento, taller, invitación, admin) para las pruebas."""
    db.add(Event(
        name="Test Event",
        organizer="Carrera Test",
        description="Event for testing",
        start_date=datetime.date(2026, 8, 16),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(18, 0),
        location="Salón de prueba",
        contact_email="test@meraki.com",
        registration_deadline=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=5),
        max_participants=50,
        status="active",
    ))
    db.add(Setting(key="waitlist_enabled", value="false"))
    db.add(Setting(key="almost_full_percentage", value="0.80"))

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
        status="available",
    )
    db.add(workshop)

    invitation = Invitation(code="INV-TEST", token="token_test", max_uses=5, used_count=0, status="active")
    db.add(invitation)

    db.add(User(
        username=ADMIN_USERNAME,
        email="admin_test@meraki.com",
        hashed_password=get_password_hash(ADMIN_PASSWORD),
        is_active=True,
    ))

    await db.flush()
    return workshop, invitation


async def _auth_headers(client: AsyncClient) -> dict:
    resp = await client.post(
        "/api/auth/login",
        data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
    )
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.mark.asyncio
async def test_update_setting_endpoint_works(client: AsyncClient, db_session: AsyncSession):
    """Regresión C2: PUT /admin/settings/{key} antes lanzaba NameError (SettingRepository sin importar)."""
    await _seed(db_session)
    headers = await _auth_headers(client)

    resp = await client.put(
        "/api/admin/settings/waitlist_enabled",
        json={"value": "true"},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text

    setting = (await db_session.execute(
        select(Setting).where(Setting.key == "waitlist_enabled")
    )).scalar_one()
    assert setting.value == "true"


@pytest.mark.asyncio
async def test_admin_status_change_keeps_workshop_counter_in_sync(client: AsyncClient, db_session: AsyncSession):
    """Regresión A1: cambiar el estado por PUT /admin/registrations/{id} debe ajustar confirmed_count."""
    workshop, _ = await _seed(db_session)

    # Registrar un participante confirmado -> confirmed_count = 1
    reg = await RegistrationService(db_session).register_participant(RegistrationCreate(
        invitation_token="token_test",
        workshop_id=workshop.id,
        full_name="Juan Perez",
        email="juan@perez.com",
        phone="50688888888",
        terms_accepted=True,
        data_treatment_accepted=True,
    ))
    await db_session.flush()
    assert workshop.confirmed_count == 1

    headers = await _auth_headers(client)

    # confirmed -> cancelled debe liberar el cupo
    resp = await client.put(f"/api/admin/registrations/{reg.id}", json={"status": "cancelled"}, headers=headers)
    assert resp.status_code == 200, resp.text
    await db_session.refresh(workshop)
    assert workshop.confirmed_count == 0

    # cancelled -> confirmed debe volver a ocupar el cupo
    resp = await client.put(f"/api/admin/registrations/{reg.id}", json={"status": "confirmed"}, headers=headers)
    assert resp.status_code == 200, resp.text
    await db_session.refresh(workshop)
    assert workshop.confirmed_count == 1


@pytest.mark.asyncio
async def test_public_registration_hides_tracking_pii(client: AsyncClient, db_session: AsyncSession):
    """A2: la respuesta pública no debe exponer ip_address ni user_agent."""
    workshop, _ = await _seed(db_session)

    resp = await client.post("/api/public/registrations", json={
        "invitation_token": "token_test",
        "workshop_id": workshop.id,
        "full_name": "Juan Perez",
        "email": "juan@perez.com",
        "phone": "50688888888",
        "terms_accepted": True,
        "data_treatment_accepted": True,
    })
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert "ip_address" not in body
    assert "user_agent" not in body
    assert body["workshop"] is not None


@pytest.mark.asyncio
async def test_login_rate_limit_blocks_brute_force(client: AsyncClient, db_session: AsyncSession):
    """A4: tras superar el umbral de intentos fallidos, el login responde 429."""
    await _seed(db_session)

    # Agotar el umbral con credenciales incorrectas
    for _ in range(auth_module._MAX_FAILED_ATTEMPTS):
        r = await client.post("/api/auth/login", data={"username": ADMIN_USERNAME, "password": "mal"})
        assert r.status_code == 401, r.text

    # El siguiente intento (aun con clave correcta) debe ser bloqueado
    blocked = await client.post("/api/auth/login", data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    assert blocked.status_code == 429, blocked.text

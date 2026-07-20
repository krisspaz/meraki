import asyncio
import datetime
from sqlalchemy import select
from app.core.database import SessionLocal, engine
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.event import Event
from app.models.workshop import Workshop
from app.models.invitation import Invitation
from app.models.setting import Setting

async def seed_data():
    async with SessionLocal() as db:
        print("Iniciando carga de datos semilla (Seed)...")

        # 1. Crear Administrador Inicial si no existe
        admin_username = settings.ADMIN_USERNAME
        admin_email = settings.ADMIN_EMAIL
        admin_password = settings.ADMIN_PASSWORD

        user_query = select(User).where(User.username == admin_username)
        res = await db.execute(user_query)
        admin_user = res.scalar_one_or_none()

        if not admin_user:
            admin_user = User(
                username=admin_username,
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                is_active=True
            )
            db.add(admin_user)
            print(f"-> Administrador creado: {admin_username}")
        else:
            print("-> El Administrador ya existe.")

        # 2. Crear Evento Expo 360 Meraki si no existe
        event_query = select(Event).where(Event.status == "active").limit(1)
        res = await db.execute(event_query)
        event = res.scalar_one_or_none()

        if not event:
            event = Event(
                name=settings.EVENT_NAME,
                organizer=settings.EVENT_ORGANIZER,
                description=(
                    "La Carrera de Diseño Gráfico tiene el gusto de invitarte a Expo 360 Meraki, "
                    "una actividad creada para compartir conocimientos, creatividad y nuevas "
                    "experiencias por medio de dos talleres especiales. Acompáñanos el domingo 16 "
                    "de agosto de 2026, a partir de las 10:00 a. m. Durante el registro podrás "
                    "conocer los talleres disponibles, elegir el que más te interese y confirmar "
                    "tu participación. Los cupos son limitados."
                ),
                banner_url="/banner-default.jpg",
                logo_url="/logo.png",
                start_date=datetime.datetime.strptime(settings.EVENT_DATE, "%Y-%m-%d").date(),
                start_time=datetime.time(10, 0, 0),
                end_time=datetime.time(18, 0, 0),
                location=settings.EVENT_LOCATION,
                contact_email=settings.EVENT_CONTACT_EMAIL,
                registration_deadline=datetime.datetime.fromisoformat(settings.EVENT_REGISTRATION_DEADLINE).replace(tzinfo=datetime.timezone.utc),
                max_participants=settings.EVENT_MAX_PARTICIPANTS,
                status="active"
            )
            db.add(event)
            print("-> Evento Expo 360 Meraki creado.")
        else:
            print("-> El Evento ya existe.")

        # 3. Crear Configuraciones del Sistema
        settings_data = {
            "waitlist_enabled": ("false", "Habilita o deshabilita la lista de espera cuando un taller se llena."),
            "almost_full_percentage": ("0.80", "Porcentaje de capacidad del taller a partir del cual el estado cambia a 'Casi lleno'.")
        }

        for key, (val, desc) in settings_data.items():
            sett_res = await db.execute(select(Setting).where(Setting.key == key))
            sett = sett_res.scalar_one_or_none()
            if not sett:
                sett = Setting(key=key, value=val, description=desc)
                db.add(sett)
                print(f"-> Configuración '{key}' creada.")

        # 4. Crear Talleres Iniciales si no existen
        workshops_query = select(Workshop)
        res = await db.execute(workshops_query)
        workshops = res.scalars().all()

        if not workshops:
            taller1 = Workshop(
                name="Taller 1: Nombre pendiente de confirmar",
                description=(
                    "Descripción provisional del primer taller. La información de los temas, "
                    "los objetivos y los materiales del taller serán actualizados próximamente por la organización. "
                    "¡Reserva tu espacio!"
                ),
                image_url="/workshop-1.jpg",
                speaker_name="Expositor pendiente",
                speaker_bio="Biografía pendiente de confirmar. La información sobre la trayectoria del expositor estará disponible pronto.",
                start_time=datetime.time(10, 30, 0),
                end_time=datetime.time(12, 30, 0),
                room="Salón Multiusos A",
                capacity=15, # capacidad baja para facilitar pruebas de llenado
                confirmed_count=0,
                status="available"
            )
            taller2 = Workshop(
                name="Taller 2: Nombre pendiente de confirmar",
                description=(
                    "Descripción provisional del segundo taller. La información de los temas, "
                    "los objetivos y los materiales del taller serán actualizados próximamente por la organización. "
                    "¡Reserva tu espacio!"
                ),
                image_url="/workshop-2.jpg",
                speaker_name="Expositor pendiente",
                speaker_bio="Biografía pendiente de confirmar. La información sobre la trayectoria del expositor estará disponible pronto.",
                start_time=datetime.time(14, 0, 0),
                end_time=datetime.time(16, 0, 0),
                room="Salón de Conferencias B",
                capacity=20,
                confirmed_count=0,
                status="available"
            )
            db.add(taller1)
            db.add(taller2)
            print("-> Talleres de prueba creados.")
        else:
            print("-> Los Talleres ya existen.")

        # 5. Crear Invitaciones de Prueba si no existen
        inv_query = select(Invitation).limit(1)
        res = await db.execute(inv_query)
        existing_inv = res.scalar_one_or_none()

        # Asegurarse de que exista al menos la invitación "general"
        general_query = select(Invitation).where(Invitation.token == "general")
        general_res = await db.execute(general_query)
        has_general = general_res.scalar_one_or_none()

        if not has_general:
            general_inv = Invitation(
                code="GENERAL",
                token="general",
                invited_name="Invitación Pública",
                max_uses=2000,
                used_count=0,
                status="active"
            )
            db.add(general_inv)
            print("-> Invitación general creada.")

        if not existing_inv:
            invs = [
                Invitation(
                    code="INV-INDIVIDUAL1",
                    token="token_individual_1",
                    invited_name="Juan Perez",
                    email="juan.perez@gmail.com",
                    max_uses=1,
                    used_count=0,
                    status="active"
                ),
                Invitation(
                    code="GRP-GRUPO1",
                    token="token_grupal_1",
                    invited_name="Estudiantes Invitados",
                    max_uses=10,
                    used_count=0,
                    status="active"
                ),
                Invitation(
                    code="INV-VENCIDA",
                    token="token_expired",
                    invited_name="Invitado Tarde",
                    max_uses=1,
                    used_count=0,
                    expiration_date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
                    status="expired"
                ),
                Invitation(
                    code="INV-DESHABILITADA",
                    token="token_disabled",
                    invited_name="Invitación Suspendida",
                    max_uses=1,
                    used_count=0,
                    status="disabled"
                )
            ]
            db.add_all(invs)
            print("-> Invitaciones de prueba creadas.")
        else:
            print("-> Las Invitaciones ya existen.")

        await db.commit()
        print("¡Datos semilla (Seed) cargados con éxito!")

async def main():
    await seed_data()

if __name__ == "__main__":
    asyncio.run(main())

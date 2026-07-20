import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, EmailStr

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Base de Datos
    DATABASE_URL: str = Field(default="postgresql+asyncpg://meraki_user:meraki_secure_password_2026@database:5432/meraki_db")
    DATABASE_SYNC_URL: str = Field(default="postgresql+psycopg2://meraki_user:meraki_secure_password_2026@database:5432/meraki_db")

    # Seguridad JWT
    JWT_SECRET: str = Field(default="super_secret_key_for_jwt_token_generation_expo_360_meraki_2026_design")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # Administrador Semilla
    ADMIN_USERNAME: str = Field(default="admin")
    ADMIN_EMAIL: EmailStr = Field(default="expo360.meraki@gmail.com")
    ADMIN_PASSWORD: str = Field(default="admin_meraki_2026!")

    # Configuración de Actividad Semilla
    EVENT_NAME: str = Field(default="Expo 360 Meraki")
    EVENT_ORGANIZER: str = Field(default="Carrera de Diseño Gráfico")
    EVENT_CONTACT_EMAIL: str = Field(default="expo360.meraki@gmail.com")
    EVENT_DATE: str = Field(default="2026-08-16")
    EVENT_START_TIME: str = Field(default="10:00:00")
    EVENT_END_TIME: str = Field(default="18:00:00")
    EVENT_LOCATION: str = Field(default="Centro de Convenciones, Salón de Exposiciones")
    EVENT_MAX_PARTICIPANTS: int = Field(default=200)
    EVENT_REGISTRATION_DEADLINE: str = Field(default="2026-08-15T23:59:59")
    EVENT_STATUS: str = Field(default="active")

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

settings = Settings()

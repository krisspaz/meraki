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
    # Sin valor por defecto a propósito: la app debe fallar si no se define un secreto real.
    JWT_SECRET: str
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # Administrador Semilla
    ADMIN_USERNAME: str = Field(default="admin")
    ADMIN_EMAIL: EmailStr = Field(default="expo360.meraki@gmail.com")
    # Sin valor por defecto a propósito: debe definirse en el entorno/.env.
    ADMIN_PASSWORD: str

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

    # Entorno de ejecución: "development" | "production"
    ENVIRONMENT: str = Field(default="development")

    # CORS. En producción conviene fijar orígenes explícitos vía env
    # (BACKEND_CORS_ORIGINS='["https://tu-dominio"]') en lugar de "*".
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

settings = Settings()

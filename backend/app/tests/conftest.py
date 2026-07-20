import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import AsyncClient

from app.core.config import settings
from app.core.database import get_db
from app.models.base import Base
from app.main import app

# Utilizar una base de datos de pruebas dedicada
TEST_DATABASE_URL = settings.DATABASE_URL.replace("meraki_db", "meraki_test_db")

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Crea una instancia del bucle de eventos asíncronos para la sesión de pruebas."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture
async def test_engine():
    """Inicializa el motor de base de datos de pruebas y crea las tablas."""
    # 1. Crear la base de datos de pruebas si no existe
    from sqlalchemy import text
    admin_db_url = settings.DATABASE_URL.replace("meraki_db", "postgres")
    admin_engine = create_async_engine(admin_db_url, isolation_level="AUTOCOMMIT")
    
    async with admin_engine.connect() as conn:
        result = await conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname='meraki_test_db'")
        )
        if not result.scalar():
            await conn.execute(text("CREATE DATABASE meraki_test_db"))
    await admin_engine.dispose()

    # 2. Conectarse y recrear tablas
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Crea una sesión de base de datos limpia para cada caso de prueba."""
    connection = await test_engine.connect()
    transaction = await connection.begin()
    
    Session = async_sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with Session() as session:
        yield session
        
    await transaction.rollback()
    await connection.close()

@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Crea un cliente HTTPX asíncrono para consumir los endpoints de la API de pruebas."""
    # Sobreescribir la dependencia get_db de FastAPI con la sesión de pruebas limpia
    async def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
        
    app.dependency_overrides.clear()

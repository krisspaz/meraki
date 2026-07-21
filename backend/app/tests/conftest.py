import os
os.environ.setdefault("JWT_SECRET", "test_jwt_secret_not_for_production")
os.environ.setdefault("ADMIN_PASSWORD", "test_admin_password")

import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from httpx import AsyncClient, ASGITransport

from app.core.config import settings
from app.core.database import get_db
from app.models.base import Base
from app.main import app

TEST_DATABASE_URL = settings.DATABASE_URL.replace("meraki_db", "meraki_test_db")

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Crea una única instancia del bucle de eventos para toda la sesión de pruebas."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Inicializa el motor de base de datos de pruebas para toda la sesión."""
    from sqlalchemy import text
    admin_db_url = settings.DATABASE_URL.replace("meraki_db", "postgres")
    admin_engine = create_async_engine(admin_db_url, isolation_level="AUTOCOMMIT", poolclass=NullPool)
    
    async with admin_engine.connect() as conn:
        result = await conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname='meraki_test_db'")
        )
        if not result.scalar():
            await conn.execute(text("CREATE DATABASE meraki_test_db"))
    await admin_engine.dispose()

    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Crea una sesión de base de datos limpia con rollback/limpieza en cada test."""
    async_session = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session
        # Limpiar datos insertados entre pruebas
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()

@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Crea un cliente HTTPX asíncrono sobreescribiendo get_db."""
    async def override_get_db():
        yield db_session
            
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
        
    app.dependency_overrides.clear()

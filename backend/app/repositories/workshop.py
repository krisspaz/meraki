from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.workshop import Workshop
from app.repositories.base import BaseRepository

class WorkshopRepository(BaseRepository[Workshop]):
    def __init__(self, db: AsyncSession):
        super().__init__(Workshop, db)

    async def get_for_update(self, id: int) -> Optional[Workshop]:
        """Obtiene un taller aplicando bloqueo de fila (FOR UPDATE) en PostgreSQL."""
        query = select(self.model).where(self.model.id == id).with_for_update()
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_active_workshops(self) -> Sequence[Workshop]:
        """Obtiene todos los talleres ordenados por hora de inicio."""
        query = select(self.model).order_by(self.model.start_time)
        result = await self.db.execute(query)
        return result.scalars().all()

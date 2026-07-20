from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.invitation import Invitation
from app.repositories.base import BaseRepository

class InvitationRepository(BaseRepository[Invitation]):
    def __init__(self, db: AsyncSession):
        super().__init__(Invitation, db)

    async def get_by_token(self, token: str) -> Optional[Invitation]:
        """Obtiene una invitación por su token único."""
        query = select(self.model).where(self.model.token == token)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_token_for_update(self, token: str) -> Optional[Invitation]:
        """Obtiene una invitación bloqueando la fila (FOR UPDATE) usando su token."""
        query = select(self.model).where(self.model.token == token).with_for_update()
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[Invitation]:
        """Obtiene una invitación por su código."""
        query = select(self.model).where(self.model.code == code)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

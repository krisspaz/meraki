from typing import Optional, Sequence, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.registration import Registration
from app.repositories.base import BaseRepository

class RegistrationRepository(BaseRepository[Registration]):
    def __init__(self, db: AsyncSession):
        super().__init__(Registration, db)

    async def get_by_code(self, code: str) -> Optional[Registration]:
        """Obtiene un registro con relaciones cargadas por su código único."""
        query = select(self.model).where(self.model.code == code).options(
            selectinload(self.model.workshop),
            selectinload(self.model.invitation)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_for_update(self, id: int) -> Optional[Registration]:
        """Obtiene una inscripción bloqueando la fila (FOR UPDATE) en PostgreSQL."""
        query = select(self.model).where(self.model.id == id).with_for_update()
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email_active(self, email: str) -> Optional[Registration]:
        """Obtiene un registro activo (no cancelado ni rechazado) por correo electrónico."""
        query = select(self.model).where(
            self.model.email == email,
            self.model.status.notin_(["cancelled", "rejected"])
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_active_count_for_event(self) -> int:
        """Obtiene la cantidad total de participantes confirmados en el evento."""
        query = select(func.count(self.model.id)).where(self.model.status == "confirmed")
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_registrations_paginated(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        workshop_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> Tuple[Sequence[Registration], int]:
        """Obtiene inscripciones filtradas, ordenadas y paginadas junto con el conteo total."""
        query = select(self.model).options(selectinload(self.model.workshop))
        count_query = select(func.count(self.model.id))

        filters = []
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    self.model.full_name.ilike(search_pattern),
                    self.model.email.ilike(search_pattern),
                    self.model.phone.ilike(search_pattern),
                    self.model.code.ilike(search_pattern)
                )
            )
        if workshop_id:
            filters.append(self.model.workshop_id == workshop_id)
        if status:
            filters.append(self.model.status == status)

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        # Ordenar por fecha de creación descendente por defecto
        query = query.order_by(self.model.created_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(query)
        registrations = result.scalars().all()

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        return registrations, total

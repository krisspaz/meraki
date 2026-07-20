from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.workshop import Workshop
from app.repositories.workshop import WorkshopRepository
from app.repositories.setting import SettingRepository
from app.schemas.workshop import WorkshopCreate, WorkshopUpdate

class WorkshopService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.work_repo = WorkshopRepository(db)
        self.set_repo = SettingRepository(db)

    async def get_workshops(self):
        """Obtiene la lista de talleres ordenada por hora de inicio."""
        return await self.work_repo.get_active_workshops()

    async def create_workshop(self, workshop_in: WorkshopCreate) -> Workshop:
        """Crea un nuevo taller."""
        workshop = Workshop(**workshop_in.model_dump())
        await self.work_repo.create(workshop)
        await self.db.flush()
        return workshop

    async def update_workshop(self, id: int, workshop_in: WorkshopUpdate) -> Workshop:
        """
        Actualiza un taller, bloqueando la fila para evitar condiciones de carrera,
        y validando que la capacidad no sea menor a los confirmados actuales.
        """
        workshop = await self.work_repo.get_for_update(id)
        if not workshop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Taller no encontrado."
            )

        update_data = workshop_in.model_dump(exclude_unset=True)

        if "capacity" in update_data:
            new_capacity = update_data["capacity"]
            if new_capacity < workshop.confirmed_count:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "CAPACITY_UNDER_CONFIRMED",
                        "message": "No es posible reducir la capacidad del taller por debajo de los participantes ya confirmados."
                    }
                )

        # Aplicar actualizaciones
        for field, value in update_data.items():
            setattr(workshop, field, value)

        # Recalcular estado de ocupación según la capacidad nueva o actual
        settings_dict = await self.set_repo.get_all_dict()
        almost_pct = float(settings_dict.get("almost_full_percentage", "0.80"))
        
        if workshop.status not in ["closed_manually", "cancelled"]:
            if workshop.confirmed_count >= workshop.capacity:
                workshop.status = "full"
            elif workshop.confirmed_count >= workshop.capacity * almost_pct:
                workshop.status = "almost_full"
            else:
                workshop.status = "available"

        await self.db.flush()
        return workshop

    async def delete_workshop(self, id: int) -> None:
        """Elimina un taller si no tiene participantes confirmados o en espera."""
        workshop = await self.work_repo.get(id)
        if not workshop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Taller no encontrado."
            )

        if workshop.confirmed_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "WORKSHOP_HAS_PARTICIPANTS",
                    "message": "No se puede eliminar el taller porque contiene participantes registrados."
                }
            )

        await self.work_repo.delete(id)
        await self.db.flush()

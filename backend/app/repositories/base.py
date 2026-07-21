from typing import Generic, TypeVar, Type, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: Any) -> Optional[ModelType]:
        """Obtiene un registro por su ID."""
        return await self.db.get(self.model, id)

    async def create(self, obj_in: Any) -> ModelType:
        """Crea un nuevo registro en la base de datos."""
        self.db.add(obj_in)
        await self.db.flush() # flush para obtener el ID sin confirmar transacción aún
        return obj_in

    async def delete(self, id: Any) -> Optional[ModelType]:
        """Elimina un registro de la base de datos."""
        obj = await self.get(id)
        if obj:
            await self.db.delete(obj)
            await self.db.flush()
        return obj

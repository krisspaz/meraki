from typing import Optional, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.setting import Setting
from app.repositories.base import BaseRepository

class SettingRepository(BaseRepository[Setting]):
    def __init__(self, db: AsyncSession):
        super().__init__(Setting, db)

    async def set_value(self, key: str, value: str, description: Optional[str] = None) -> Setting:
        """Crea o actualiza una clave de configuración."""
        setting = await self.get(key)
        if setting:
            setting.value = value
            if description:
                setting.description = description
        else:
            setting = Setting(key=key, value=value, description=description)
            self.db.add(setting)
        await self.db.flush()
        return setting

    async def get_all_dict(self) -> Dict[str, str]:
        """Obtiene todas las configuraciones en un diccionario de clave-valor."""
        query = select(self.model)
        result = await self.db.execute(query)
        settings_list = result.scalars().all()
        return {s.key: s.value for s in settings_list}

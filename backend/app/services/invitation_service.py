import secrets
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.invitation import Invitation
from app.repositories.invitation import InvitationRepository
from app.schemas.invitation import InvitationCreate, InvitationBulkCreate

def generate_invitation_token() -> str:
    """Genera un token de invitación seguro y difícil de adivinar."""
    return secrets.token_urlsafe(24)

def generate_invitation_code(prefix: str = "INV") -> str:
    """Genera un código de invitación aleatorio corto de 8 caracteres hexadecimales."""
    return f"{prefix}-{secrets.token_hex(4).upper()}"

class InvitationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.inv_repo = InvitationRepository(db)

    async def create_invitation(self, inv_in: InvitationCreate, creator_id: Optional[int] = None) -> Invitation:
        """Crea una invitación individual o grupal con token y código único."""
        code = generate_invitation_code("INV" if inv_in.max_uses == 1 else "GRP")
        token = generate_invitation_token()
        
        invitation = Invitation(
            code=code,
            token=token,
            invited_name=inv_in.invited_name,
            email=inv_in.email,
            phone=inv_in.phone,
            max_uses=inv_in.max_uses,
            expiration_date=inv_in.expiration_date,
            status=inv_in.status,
            created_by=creator_id
        )
        await self.inv_repo.create(invitation)
        await self.db.flush()
        return invitation

    async def create_bulk_invitations(self, bulk_in: InvitationBulkCreate, creator_id: Optional[int] = None) -> List[Invitation]:
        """Crea un lote de invitaciones de una sola vez."""
        invitations = []
        for _ in range(bulk_in.quantity):
            code = generate_invitation_code(bulk_in.prefix)
            token = generate_invitation_token()
            invitation = Invitation(
                code=code,
                token=token,
                max_uses=bulk_in.max_uses_per_invitation,
                expiration_date=bulk_in.expiration_date,
                status="active",
                created_by=creator_id
            )
            self.db.add(invitation)
            invitations.append(invitation)
            
        await self.db.flush()
        return invitations

    async def toggle_invitation_status(self, id: int, active: bool) -> Invitation:
        """Habilita o deshabilita una invitación."""
        invitation = await self.inv_repo.get(id)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitación no encontrada."
            )
        
        if active:
            # Si se reactiva, verificar usos
            if invitation.used_count >= invitation.max_uses:
                invitation.status = "exhausted"
            else:
                invitation.status = "active"
        else:
            invitation.status = "disabled"

        await self.db.flush()
        return invitation

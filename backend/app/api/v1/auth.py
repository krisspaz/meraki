import time
from collections import defaultdict
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import verify_password, create_access_token, create_refresh_token, verify_token
from app.core.config import settings
from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.auth import TokenResponse, RefreshRequest, UserMeResponse

router = APIRouter()

# Rate limiting best-effort contra fuerza bruta en el login.
# NOTA: es en memoria y por proceso; en despliegues con múltiples workers/instancias
# no es un límite global. Para un límite fuerte usar un store compartido (Redis) o slowapi.
_MAX_FAILED_ATTEMPTS = 10
_ATTEMPT_WINDOW_SECONDS = 300
_login_failures: dict[str, list[float]] = defaultdict(list)

def _recent_failures(key: str, now: float) -> list[float]:
    return [t for t in _login_failures[key] if now - t < _ATTEMPT_WINDOW_SECONDS]

def _enforce_login_rate_limit(key: str) -> None:
    now = time.time()
    failures = _recent_failures(key, now)
    _login_failures[key] = failures
    if len(failures) >= _MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos fallidos de inicio de sesión. Intenta de nuevo en unos minutos.",
        )

def _record_login_failure(key: str) -> None:
    _login_failures[key].append(time.time())

def _reset_login_failures(key: str) -> None:
    _login_failures.pop(key, None)

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Ruta de inicio de sesión administrativa.
    Soporta x-www-form-urlencoded para compatibilidad con Swagger UI.
    """
    rate_key = request.client.host if request.client else "unknown"
    _enforce_login_rate_limit(rate_key)

    query = select(User).where(User.username == form_data.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        _record_login_failure(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario administrador está inactivo."
        )

    # Login correcto: limpiar el contador de intentos fallidos de esta IP
    _reset_login_failures(rate_key)

    # Generar Tokens
    access_token = create_access_token(subject=user.username)
    refresh_token = create_refresh_token(subject=user.username)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    refresh_in: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Renueva el access token a partir de un refresh token válido.
    """
    username = verify_token(refresh_in.refresh_token, token_type="refresh")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado."
        )
    
    query = select(User).where(User.username == username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El usuario administrador está inactivo o no existe."
        )

    access_token = create_access_token(subject=user.username)
    new_refresh_token = create_refresh_token(subject=user.username)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token
    )

@router.get("/me", response_model=UserMeResponse)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene la información del usuario administrador actual.
    """
    return current_user

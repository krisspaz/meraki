from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, public, admin

app = FastAPI(
    title="Expo 360 Meraki - API",
    description="Backend de invitaciones y registro de talleres para la Expo 360 Meraki (Carrera de Diseño Gráfico).",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    redoc_url="/redoc"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar Endpoints
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(public.router, prefix="/api/public", tags=["Público"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administración"])

@app.get("/health", tags=["Salud"])
async def health_check():
    """Endpoint de comprobación de salud para Docker Compose."""
    return {"status": "ok", "message": "Expo 360 Meraki API is running fine."}

@app.get("/", tags=["Inicio"])
async def root():
    return {
        "title": "Expo 360 Meraki API",
        "description": "API operativa. Accede a la documentación en /docs"
    }

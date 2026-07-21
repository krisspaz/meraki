FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY . .

# Ejecutar como usuario sin privilegios (no root) por seguridad
RUN useradd --create-home --uid 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# El comando por defecto se sobreescribe en docker-compose, pero se especifica uno funcional para producción
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

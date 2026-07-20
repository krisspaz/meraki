# --- Base Stage ---
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# --- Builder Stage for Prod ---
FROM base AS builder
COPY . .
# Permite pasar variables en tiempo de compilación si es necesario, o usar configuración relativa
ENV VITE_API_URL=/api
# El comando por defecto para producción es construir los recursos
CMD ["npm", "run", "build"]

# --- Dev Stage ---
FROM base AS dev
COPY . .
EXPOSE 5175

CMD ["npm", "run", "dev", "--", "--host"]

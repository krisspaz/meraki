# --- Base Stage ---
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install

# --- Dev Stage ---
FROM base AS dev
COPY . .
EXPOSE 5175
CMD ["npm", "run", "dev", "--", "--host"]

# --- Builder Stage for Prod ---
FROM base AS builder
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

# --- Production Stage (Nginx) ---
FROM nginx:alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

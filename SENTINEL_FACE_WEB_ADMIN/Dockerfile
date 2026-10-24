# ── Stage 1: Build de la aplicacion React con Vite ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Servidor Web Nginx ligero para produccion ──
FROM nginx:alpine

# Copiar build estatico
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuracion de proxy y SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

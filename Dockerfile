# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Build frontend y backend
RUN npm run build

# Production stage - Node.js server
FROM node:20-alpine
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias (esbuild se necesita en runtime)
RUN npm ci --production

# Copiar archivos builded del frontend
COPY --from=builder /app/dist ./dist

# Copiar servidor backend compilado
COPY --from=builder /app/dist-server ./dist-server

# Puerto
EXPOSE 8080

# Variables de entorno
ENV PORT=8080
ENV NODE_ENV=production

# Ejecutar servidor
CMD ["node", "dist-server/server.js"]

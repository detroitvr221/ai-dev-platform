# Multi-stage build: build frontend, then run backend + serve static
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend ./frontend
COPY shared ./shared
RUN cd frontend && npm ci --legacy-peer-deps && npm run build

FROM node:18-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV WEBSOCKET_PORT=8080

# Install dependencies for production
RUN apk add --no-cache git openssh
COPY backend ./backend
COPY shared ./shared
COPY --from=builder /app/frontend/dist ./backend/public

# Set working directory and install production dependencies
WORKDIR /app/backend
RUN npm ci --omit=dev --ignore-scripts

# Create data directory for projects
RUN mkdir -p /data/projects

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["node", "server.js"]


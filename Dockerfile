# Multi-stage build: build frontend, then run backend + serve static
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend ./frontend
COPY shared ./shared
RUN cd frontend && npm ci && npm run build

FROM node:18-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
COPY backend ./backend
COPY shared ./shared
COPY --from=builder /app/frontend/dist ./backend/public
WORKDIR /app/backend
RUN npm ci --omit=dev
EXPOSE 8080
CMD ["node", "server.js"]


# Multi-stage Dockerfile for AWS EC2 / ECS Deployment
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files and install production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy application backend source code
COPY backend/ .

EXPOSE 5000
ENV NODE_ENV=production

CMD ["node", "index.js"]

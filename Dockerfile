FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# The CMD is overridden per-service in railway.toml
# Event worker:  node -r tsx/cjs src/workers/event-worker.ts
# Alert worker:  node -r tsx/cjs src/workers/alert-worker.ts
CMD ["npm", "start"]

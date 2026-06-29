FROM node:22-alpine AS builder

# Build tools for native packages (swisseph requires Python + gcc)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm@9.1.4

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy all package.json files first (layer caching)
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install all dependencies (native packages compiled here)
RUN pnpm install --frozen-lockfile

# Copy API source
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @tsp/api exec prisma generate

# Build API
RUN pnpm --filter @tsp/api run build

# ---- Production image ----
FROM node:22-alpine

# Runtime deps for swisseph (compiled .node binary needs these)
RUN apk add --no-cache libstdc++ libgcc

RUN npm install -g pnpm@9.1.4

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Copy built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
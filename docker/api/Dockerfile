FROM node:22-alpine AS builder

# Build tools — setuptools provides 'distutils' removed in Python 3.12+
RUN apk add --no-cache python3 make g++ py3-setuptools

# Install pnpm
RUN npm install -g pnpm@9.1.4

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy package.json files for all workspaces
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Upgrade node-gyp before install to fix distutils issue
RUN npm install -g node-gyp@10

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy API source
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @tsp/api exec prisma generate

# Build
RUN pnpm --filter @tsp/api run build

# ---- Production image ----
FROM node:22-alpine

RUN apk add --no-cache libstdc++ libgcc

RUN npm install -g pnpm@9.1.4

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
# ---------------- Build Stage ----------------
FROM node:22-bookworm AS builder

# Install build dependencies for native C/C++ module compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.1.4

WORKDIR /app

# Copy configuration files and optional lockfile
COPY package.json tsconfig.json tsconfig.build.json tsconfig.base.json nest-cli.json prisma.config.ts ./
COPY pnpm-lock.yam[l] ./

# Install dependencies (compiles native modules like swisseph)
RUN pnpm install

# Copy source and prisma configuration
COPY prisma ./prisma/
COPY src ./src/

# Run prisma generate (requires dummy database URL at build time)
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" pnpm exec prisma generate

# Build TypeScript output
RUN pnpm run build

# ---------------- Production Stage ----------------
FROM node:22-bookworm-slim

# Install standard runtime libraries
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.1.4

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yam[l] ./

# Copy compiled files and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

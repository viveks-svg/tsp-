FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y python3 make g++

RUN npm install -g pnpm@9.1.4 node-gyp@10

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/

# Dummy DATABASE_URL only needed for prisma generate at build time
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" pnpm --filter @tsp/api exec prisma generate

RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter @tsp/api run build

# ---------------- Production ----------------

FROM node:22-slim

# No need for libstdc++ separately since slim includes it

RUN npm install -g pnpm@9.1.4

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

EXPOSE 3001

CMD ["sh", "-c", "cd /app/apps/api && npx prisma migrate deploy && node dist/main"]
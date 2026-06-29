FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ py3-setuptools

RUN npm install -g pnpm@9.1.4 node-gyp@10

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/

# Dummy DATABASE_URL only needed for prisma generate at build time
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" pnpm --filter @tsp/api exec prisma generate

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
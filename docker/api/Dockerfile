FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN pnpm install
COPY apps/api/ ./apps/api/
RUN pnpm --filter @tsp/api exec prisma generate 
RUN pnpm --filter @tsp/api build
RUN pnpm prune --prod

FROM node:20-alpine
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
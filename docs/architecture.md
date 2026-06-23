# TSP Monorepo Architecture Documentation

Welcome to the Astro Space (TSP) production-ready monorepo! This architecture is built using Turborepo to orchestrate a high-performance, modular, and type-safe development environment.

## Monorepo Layout

```
.
├── apps/
│   ├── web/                     # Next.js 16 (React 19) Web Application
│   └── api/                     # NestJS 11 Backend (Modular Monolith)
├── packages/
│   ├── types/                   # Shared TypeScript models and interfaces
│   ├── constants/               # Shared constants and domain enums
│   ├── zod-schemas/             # Shared Zod validation schemas
│   ├── eslint-config/           # Shared ESLint setups
│   └── ts-config/               # Shared tsconfig extensions (Next.js, NestJS, Base)
├── docker/                      # Production Docker files
└── docker-compose.yml           # Multi-container local/production composer
```

## Tech Stack & Tooling

- **Orchestrator**: Turborepo
- **Package Manager**: pnpm
- **Frontend**: Next.js 16 + React 19 + TailwindCSS + Zustand + Framer Motion
- **Backend**: NestJS 11 + Prisma ORM + Socket.IO + BullMQ + Redis + PostgreSQL
- **CI/CD**: GitHub Actions

## Data Sharing Flow

To maintain absolute type-safety between the frontend (`apps/web`) and backend (`apps/api`), all domain entities, enums, and validations are co-located in the `packages/` directory:

1. **Validation**: API inputs and form states use schemas imported from `@tsp/zod-schemas`.
2. **DTO Types**: Next.js HTTP clients use DTO types imported from `@tsp/types` which match the NestJS controller payloads.
3. **Enums/Constants**: Centralized lists like roles and status enums are shared from `@tsp/constants`.

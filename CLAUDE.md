# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # watch mode
npm run start:prod       # production (requires build first)
npm run build            # compile to dist/

# Code quality
npm run lint             # ESLint with auto-fix
npm run format           # Prettier

# Testing
npm run test             # all unit tests
npm run test:watch       # watch mode
npm run test:cov         # with coverage
npm run test:e2e         # E2E tests
# Run a single test file:
npx jest src/modules/auth/services/auth.service.spec.ts

# Database
npx prisma generate      # regenerate Prisma client after schema changes
npx prisma migrate dev   # apply migrations in development
npx prisma studio        # GUI for the database
npm run seed:categories  # seed default categories
```

## Architecture

### Module Structure

Every feature follows a strict layered pattern:

```
src/modules/<feature>/
  controllers/    # HTTP layer — route params, body parsing, response wrapping
  services/       # Business logic
  repositories/   # All Prisma queries (no raw DB access in services)
  dto/            # Validation (class-validator) and transformation (class-transformer)
  guards/         # Route-level authorization
  decorators/     # Custom decorators (@Public, @CurrentUser, etc.)
```

### Request Lifecycle

`Request → JwtAuthGuard (global) → ThrottlerGuard → Controller → Service → Repository → Prisma → PostgreSQL`

- All routes are **protected by JWT by default**. Mark public routes with `@Public()` from `src/modules/auth/decorators/auth.decorator.ts`.
- Global `ValidationPipe` (transform: true) is applied in `main.ts` — DTOs are automatically validated and class-transformed.
- All responses are wrapped in `NormalResponseDto<T>` (`src/common/dto/normal-response.dto.ts`).
- All exceptions are caught by `HttpExceptionFilter` (`src/common/filters/http-exception.filter.ts`) which normalizes error shape.

### Key Cross-Module Patterns

**Repository pattern:** Services never import PrismaService directly — they go through a module-specific repository. `PrismaService` lives in `src/prisma/`.

**Unit of Work:** `PrismaUnitOfWorkService` (exported from `PrismaModule`) wraps multi-step operations in a Prisma transaction. Used in auth, transaction, and budget modules.

**Auth module exports:** `JwtAuthGuard` and `JwtStrategy` are set up as `APP_GUARD` providers in `AppModule`, making JWT protection automatic globally.

### Chat / AI Module

`src/modules/chat/services/chat.service.ts` calls Google Gemini (`@google/genai`). The model is prompted to parse natural language into structured JSON with fields: `action` (ADD_EXPENSE | ADD_INCOME), `amount`, `note`, `date`. Rate-limited via `ChatThrottlerGuard`.

### Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (Supabase pooler) |
| `JWT_SECRET` | JWT signing key |
| `GEMINI_API_KEY` | Google Gemini API |
| `PORT` | Server port (default 3080) |
| `DEFAULT_VERSION` | URI API version default |

### API Conventions

- Global prefix: `/api` (except `/health`)
- Versioning: URI-based — e.g., `/api/v1/transactions`
- Auth routes: `/api/auth/register`, `/api/auth/login` (public)
- Health check: `GET /health` (public, runs `SELECT 1` to keep DB warm)

### Database Schema Notes

- All IDs are UUIDs.
- Financial amounts use `Decimal(18, 2)`.
- `Category` → `SubCategory` → `Transaction` hierarchy (all scoped to `userId`).
- `BudCategory` and `SubBudCategory` have unique constraints on `(userId, categoryId/subCategoryId, month)`.
- Cascade deletes on all user-owned data.
- Schema: `src/prisma/schema.prisma`

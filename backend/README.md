# DL Tickets — Backend

NestJS API for a ticket system: **authentication** (JWT + refresh rotation), users, tickets, caching, background notifications, and optional load testing.

## Stack

- **NestJS** — HTTP API and modules
- **Prisma** + **PostgreSQL** — persistence
- **Redis** — cache (ioredis) and **BullMQ** job queues
- **Zod** — request validation

## Why this project uses queues (BullMQ)

When a ticket is created, the API must stay **fast and predictable** for the client. Sending email (or any slow or flaky outbound work) inside the same HTTP request would:

- Increase latency for every create
- Tie success of the HTTP response to third-party or network failures
- Make retries and backoff harder to reason about

Instead, the flow is:

1. Persist the ticket and related **notification** row (e.g. `PENDING`).
2. **Enqueue** a small job in Redis (producer).
3. Return the HTTP response immediately.
4. A **worker** (consumer) picks up the job later, performs the side effect (here: log as a stand-in for email), and updates notification status to `SENT` or `FAILED`.

Queues give **decoupling**, **retries** (configured on the job), and a clear place to swap the log for a real email provider later—without changing the core use case more than necessary.

## Validation (Zod)

HTTP **body** and **query** inputs are validated with **Zod** schemas (see `src/modules/**/application/dto`).

A global **`ZodValidationPipe`** (`src/common/pipes/zod-validation.pipe.ts`) runs `safeParse` on incoming data. Invalid requests receive **400** with structured error details instead of failing deep inside the app with obscure errors.

Benefits:

- Single source of truth for shape and rules (types inferred from schemas)
- Coercion where appropriate (e.g. query strings to numbers)
- Consistent API error responses for clients

## Architecture (short)

The codebase follows a **ports-and-adapters** style: domain and application layers depend on **ports** (abstract classes and TypeScript types), and infrastructure supplies **adapters** (Prisma repositories, BullMQ queue adapter, Redis cache, JWT provider).

### Dependency injection tokens (`src/di/tokens/`)

Bindings use **shared injection tokens** (typed `Symbol` / `InjectionToken`). Use cases and guards inject with `@Inject(TOKEN)`; modules register `provide` + `useClass` or `useExisting` (e.g. `CACHE_PORT` → `CacheService`, `RATE_LIMIT_STORE` → `RateLimitRedisStore`). Files are grouped by concern:

| File | Tokens (examples) |
| ---- | ----------------- |
| `repositories.tokens.ts` | `USER_REPOSITORY`, `TICKET_REPOSITORY`, `NOTIFICATION_REPOSITORY`, `REFRESH_TOKEN_REPOSITORY`, `PASSWORD_RESET_REPOSITORY` |
| `security.tokens.ts` | `PASSWORD_HASHER`, `TOKEN_PROVIDER` (JWT sign/verify/hash helpers) |
| `cache.tokens.ts` | `CACHE_PORT` — wired in `CacheModule` with `useExisting: CacheService` |
| `queue.tokens.ts` | `NOTIFICATION_QUEUE_PORT` |
| `rate-limit.tokens.ts` | `RATE_LIMIT_STORE` — wired in `RateLimitModule` with `useExisting: RateLimitRedisStore` |

Feature modules **export** the tokens other modules need (e.g. `UsersModule` exports `USER_REPOSITORY` and `PASSWORD_HASHER` for `AuthModule`). `QueueModule` only configures BullMQ; `DbModule` registers global Prisma (`nestjs-prisma`) — no extra tokens there.

## Authentication

- **Access token:** JWT (default ~15 min), header `Authorization: Bearer <token>`. Payload includes `sub` (user **uuid**, never a numeric id) and `email`.
- **Refresh token:** opaque value in an **httpOnly** cookie (`Path=/api/v1/auth`). Use `POST /api/v1/auth/refresh` with `credentials: 'include'` from browsers; response sets a new cookie and returns a new `accessToken`.
- **Logout:** `POST /api/v1/auth/logout` clears the refresh cookie and revokes the session server-side.
- **Password reset:** `POST /api/v1/auth/password-reset/request` (always same success message) enqueues email; `POST /api/v1/auth/password-reset/confirm` with `token` + `newPassword`. Successful reset revokes all refresh tokens for that user.
- **Protected routes:** global `JwtAuthGuard`; routes marked `@Public()` skip JWT (e.g. `POST /users`, `POST /auth/*`, password-reset).
- **Tickets:** `GET/POST /tickets` and `PATCH /tickets/:uuid` require a valid access token. The ticket **owner** is taken from the token — do **not** send `userId` in the body. Updates by a non-owner return **403**.

Rate limits for auth endpoints are configured in `src/config/rate-limit.config.ts` (login, refresh, password reset).

Interactive API docs (when enabled): `/docs` — **Authorize** with a Bearer token from login.

## Identifiers (uuid vs internal id)

Public API responses use **uuid** strings as resource ids (users, tickets). PostgreSQL uses an internal integer primary key for joins; it is **not** exposed in JSON.

## Getting started

```bash
npm install
```

Set environment variables (see `.env.example`): at minimum `DATABASE_URL`, **`JWT_SECRET`**, Redis settings (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, etc.), optional `JWT_ACCESS_EXPIRATION_SECONDS` / `JWT_REFRESH_EXPIRATION_DAYS`, then run migrations:

```bash
npx prisma migrate dev
npm run start:dev
```

API prefix: **`/api/v1`** (e.g. `POST /api/v1/auth/login`, `GET /api/v1/tickets` with Bearer token).

If you use Docker Compose in this repo, start Postgres and Redis so the app and queues can connect.

## Load testing (k6)

Optional scripts (requires [k6](https://k6.io/) installed):

```bash
npm run load:tickets
npm run load:tickets:smoke
npm run load:race
```

- **`load:tickets`** — many `POST /api/v1/tickets` (throughput); scripts should obtain a JWT (e.g. login) and send `Authorization: Bearer …` plus cookie if needed.
- **`load:race`** — **optimistic-lock race**: `setup` creates one ticket (authenticated), then `PARALLEL` VUs send **`PATCH /api/v1/tickets/:uuid`** with the **same** `updatedAt`. Exactly **one** request should win (**200**); the rest should get **409 Conflict** (`ConcurrencyError`). k6’s `http_req_failed` rate will look high because **409 counts as failed** in k6; use the custom counters `race_patch_200` / `race_patch_409` for the real outcome.

Configure with env vars: `BASE_URL`, and either **`ACCESS_TOKEN`** (JWT from login) or **`LOGIN_EMAIL`** + **`LOGIN_PASSWORD`**. Optional: `VUS`, `DURATION`, `PARALLEL`. See `load-testing/create-tickets.k6.js` and `load-testing/race-ticket-update.k6.js`.

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run start:dev` | Dev server + watch |
| `npm run build` | Compile TypeScript → `dist` |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | E2E tests (`test/*.e2e-spec.ts`) |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run migrate:dev` | Run migrations (dev) |

## License

UNLICENSED (private project).

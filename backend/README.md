# DL System — Backend

NestJS API for **DL System**: **authentication** (JWT + refresh rotation), users, tickets, **clients**, **client contracts**, caching, background notifications, and optional load testing.

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

Failed validation responses include a stable optional **`code`** (e.g. `COMMON_VALIDATION_FAILED`) alongside `message` / `details`; see *API errors* below.

## API errors (envelope and stable codes)

Error JSON follows a single envelope (`success: false`, `timestamp`, `statusCode`, `error`, `message`, optional **`code`**, optional `details`). **`code`** is optional for backward compatibility; clients should prefer it over parsing English `message` for branching logic.

- **Application / domain:** use cases throw **`ApplicationException`** (`src/common/errors/application/`) with a namespaced string id (`AUTH_*`, `USER_*`, `CLIENT_*`, `TICKET_*`, `CONTRACT_*`, `LOCATION_*`). Per-module definitions live under **`src/modules/<feature>/application/errors/`** (codes + HTTP status map). Unknown codes are logged and mapped to **500** by the global filter.
- **Cross-cutting:** JWT rejection, rate limit, Zod validation, optimistic-lock conflicts, and unhandled **`DomainError`** use **`COMMON_*`** codes (e.g. `COMMON_UNAUTHORIZED`, `COMMON_CONFLICT`).
- **OpenAPI:** `StandardErrorResponseDto` documents the optional `code` field.

## Architecture (short)

The codebase follows a **ports-and-adapters** style: domain and application layers depend on **ports** (abstract classes and TypeScript types), and infrastructure supplies **adapters** (Prisma repositories, BullMQ queue adapter, Redis cache, JWT provider).

### Dependency injection tokens (`di.tokens.ts` per module)

Bindings use **typed injection tokens** (`Symbol` / `InjectionToken`). Use cases and guards inject with `@Inject(TOKEN)`; modules register `provide` + `useClass` or `useExisting` (e.g. `CACHE_PORT` → `CacheService`, `RATE_LIMIT_STORE` → `RateLimitRedisStore`). Each feature owns its tokens next to the module:

| Location | Tokens (examples) |
| -------- | ----------------- |
| `src/modules/users/di.tokens.ts` | `USER_REPOSITORY`, `PASSWORD_HASHER`, `EMAIL_VERIFICATION_CHALLENGE_REPOSITORY`, `EMAIL_VERIFICATION_CODE_HASHER` |
| `src/modules/auth/di.tokens.ts` | `REFRESH_TOKEN_REPOSITORY`, `PASSWORD_RESET_REPOSITORY`, `TOKEN_PROVIDER` |
| `src/modules/tickets/di.tokens.ts` | `TICKET_REPOSITORY` |
| `src/modules/clients/di.tokens.ts` | `CLIENT_REPOSITORY` |
| `src/modules/client-contracts/di.tokens.ts` | `CLIENT_CONTRACT_REPOSITORY` |
| `src/modules/notifications/di.tokens.ts` | `NOTIFICATION_REPOSITORY`, `NOTIFICATION_QUEUE_PORT`, `EMAIL_SENDER_PORT` |
| `src/modules/cache/di.tokens.ts` | `CACHE_PORT` — wired in `CacheModule` with `useExisting: CacheService` |
| `src/common/rate-limit/di.tokens.ts` | `RATE_LIMIT_STORE` — wired in `RateLimitModule` with `useExisting: RateLimitRedisStore` |

Consumers import tokens from the **owning** module (e.g. auth use cases import `USER_REPOSITORY` from `users/di.tokens`). Feature modules **export** what others need (e.g. `UsersModule` exports `USER_REPOSITORY` and `PASSWORD_HASHER` for `AuthModule`). `QueueModule` only configures BullMQ; `DbModule` registers global Prisma (`nestjs-prisma`) — no extra tokens there.

## HTTP routes (summary)

All paths below use the **`/api/v1`** prefix.

| Scope | Methods and paths |
| ----- | ----------------- |
| **Public** | `POST /users` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `POST /auth/password-reset/request` · `POST /auth/password-reset/confirm` · `POST /auth/email/verify` · `POST /auth/email/resend` |
| **JWT (Bearer)** | `GET`, `POST /tickets` · `GET`, `PATCH /tickets/:id` |
| **JWT (Bearer)** | `GET`, `POST /clients` · `GET /clients/:id` |
| **JWT (Bearer)** | `GET`, `POST /client-contracts` · `GET`, `PATCH /client-contracts/:id` |

`:id` is a **UUID v4** in the URL.

## Authentication

- **Access token:** JWT (default ~15 min), header `Authorization: Bearer <token>`. Payload includes `sub` (user **uuid**, never a numeric id) and `email`.
- **Refresh token:** opaque value in an **httpOnly** cookie (`Path=/api/v1/auth`). Use `POST /api/v1/auth/refresh` with `credentials: 'include'` from browsers; response sets a new cookie and returns a new `accessToken`.
- **Logout:** `POST /api/v1/auth/logout` clears the refresh cookie and revokes the session server-side.
- **Password reset:** `POST /api/v1/auth/password-reset/request` (always same success message) enqueues email; `POST /api/v1/auth/password-reset/confirm` with `token` + `newPassword`. Successful reset revokes all refresh tokens for that user.
- **Email verification:** `POST /api/v1/users` creates an unverified user and enqueues a **6-digit OTP** (HTML email template + plain-text part; welcome + code in one message). `POST /api/v1/auth/email/verify` with `email` + `code` sets `emailVerifiedAt`. `POST /api/v1/auth/email/resend` always returns the same success-style message; it only sends when the account exists and is still unverified. **Login** returns **403** if the password is correct but the email is not verified yet (error body **`code`**: `AUTH_EMAIL_NOT_VERIFIED`).
- **Transactional email (Resend):** set **`RESEND_API_KEY`** in production (see `.env.example`). Use **`EMAIL_FROM`** or **`RESEND_FROM_EMAIL`** for a verified sender; if unset, the app falls back to Resend’s onboarding address (fine for sandbox only). Without an API key in non-production, sends are skipped with a log warning (no HTTP call). Optional `OTP_PEPPER` strengthens stored OTP hashes. Outbound sends run in the **BullMQ** worker, not in the HTTP request.
- **Protected routes:** global `JwtAuthGuard`; routes marked `@Public()` skip JWT (e.g. `POST /users`, `POST /auth/*`, password-reset, email verify/resend).
- **Tickets, clients, client contracts:** `GET`/`POST` (and `PATCH` where applicable) under `/tickets`, `/clients`, and `/client-contracts` require a valid access token.
- **Tickets:** the ticket **owner** is taken from the token — do **not** send `userId` in the body. Updates by a non-owner return **403**.

Per-domain rate limits live in each module under `src/modules/<domain>/config/rate-limit.config.ts`; they are merged in `src/config/rate-limit.config.ts`. Shared env helpers: `src/common/rate-limit/rate-limit-env.ts`.

Rate limits key clients by **`req.ip`** (then socket). The app does **not** trust `X-Forwarded-For` unless you enable Express **trust proxy**: set **`TRUST_PROXY=1`** (or `true`, or a hop count) when the API runs behind a **trusted** reverse proxy so `req.ip` reflects the real client. Leave `TRUST_PROXY` unset when clients hit Nest directly (avoids spoofed headers bypassing limits).

Interactive API docs at **`/docs`**: set **`ENABLE_OPENAPI_DOCS=true`** to enable in any environment, or **`false`** to disable. If unset, docs default to **on** only when `NODE_ENV` is empty or **`development`** (so staging with `NODE_ENV=staging` stays off until you opt in). **Authorize** in the UI with a Bearer token from login.

## Identifiers (uuid vs internal id)

Public API responses use **uuid** strings as resource ids (users, tickets, clients, client contracts). PostgreSQL uses an internal integer primary key for joins; it is **not** exposed in JSON.

## Getting started

```bash
npm install
```

Set environment variables (see `.env.example`): at minimum `DATABASE_URL`, **`JWT_SECRET`**, Redis settings (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, etc.), optional `JWT_ACCESS_EXPIRATION_SECONDS` / `JWT_REFRESH_EXPIRATION_DAYS`. For real emails in production, set **`RESEND_API_KEY`** (and preferably **`EMAIL_FROM`** or **`RESEND_FROM_EMAIL`** for your domain). Then run migrations and seed geography (or your own import pipeline):

```bash
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

**`npm run prisma:seed`** loads minimal `countries` / `states` / `cities` for development. The default seed uses **stable UUIDs only for local DX**; swap for bulk imports when you own the dataset. CI or integration tests that hit the DB should run the same migrate + seed (or equivalent) so location endpoints and client address flows have rows to resolve.

API prefix: **`/api/v1`** (e.g. `POST /api/v1/auth/login`, `GET /api/v1/tickets` or `GET /api/v1/clients` with Bearer token).

If you use Docker Compose in this repo, start Postgres and Redis so the app and queues can connect.

## Load testing (k6)

Optional scripts (requires [k6](https://k6.io/) installed):

```bash
npm run load:tickets
npm run load:tickets:smoke
npm run load:race
```

- **`load:tickets`** — many `POST /api/v1/tickets` (throughput); scripts should obtain a JWT (e.g. login) and send `Authorization: Bearer …` plus cookie if needed.
- **`load:race`** — **optimistic-lock race**: `setup` creates one ticket (authenticated), then `PARALLEL` VUs send **`PATCH /api/v1/tickets/:id`** with the **same** `updatedAt`. Exactly **one** request should win (**200**); the rest should get **409 Conflict** (body may include **`code`: `COMMON_CONFLICT`**). k6’s `http_req_failed` rate will look high because **409 counts as failed** in k6; use the custom counters `race_patch_200` / `race_patch_409` for the real outcome.

Configure with env vars: `BASE_URL`, and either **`ACCESS_TOKEN`** (JWT from login) or **`LOGIN_EMAIL`** + **`LOGIN_PASSWORD`**. Optional: `VUS`, `DURATION`, `PARALLEL`. See `load-testing/create-tickets.k6.js` and `load-testing/race-ticket-update.k6.js`.

## Dependências, lockfile e auditoria

- **Sempre commitar** `package-lock.json` junto com alterações a `package.json`. O CI e os deploys devem usar **`npm ci`** (instalação reprodutível a partir do lockfile; falha se lock e manifest estiverem dessincronizados).
- **Auditoria local:** `npm audit` (árvore completa, inclui dev) e `npm audit --omit=dev` (foco no que acompanha dependências de produção). No CI corre-se `npm audit --omit=dev --audit-level=high` após `npm ci`.
- **Triage (resumo):** alertas ligados ao **CLI Prisma** (`prisma` em dev), **Jest**, **Nest CLI** / **schematics** e **nestjs-prisma** (geração de código) são sobretudo **ferramentas de desenvolvimento** — não entram no bundle de runtime da API, mas convém mantê-los atualizados. Cadeias em **`@nestjs/core`**, **`@nestjs/platform-express`**, **`@nestjs/config`**, **`@nestjs/swagger`** / **`nestjs-zod`** podem afetar o **processo da API** em produção; corrigir com updates patch/minor dos pacotes Nest ou `overrides` pontuais (`lodash`, `path-to-regexp`, `picomatch` onde aplicável), evitando `npm audit fix --force` sem revisão. **Nota:** `ajv` em cadeia **nestjs-prisma** / **@schematics/angular** permanece com advisory **moderate** (ReDoS com `$data`); um override global de `ajv` quebra o **ESLint**; o gate do CI usa `--audit-level=high`, por isso moderate não bloqueia até haver correção upstream segura.
- **Novas integrações:** quando possível, preferir **APIs nativas do Node** (por exemplo `fetch` em Node 18+) em vez de acrescentar pacotes só por conveniência.

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run start:dev` | Dev server + watch |
| `npm run build` | Compile TypeScript → `dist` |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | E2E tests (`test/*.e2e-spec.ts`) |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run migrate:dev` | Run migrations (dev) |
| `npm run audit:prod` | `npm audit --omit=dev` (dependências de produção) |
| `npm run audit:ci` | Igual ao gate do CI: `--omit=dev --audit-level=high` |

## License

UNLICENSED (private project).

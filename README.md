# DL Tickets — Backend

NestJS API for a ticket system: users, tickets, caching, background notifications, and optional load testing.

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

The codebase follows a **ports-and-adapters** style: domain/application depend on **ports** (abstract classes), and infrastructure provides **adapters** (Prisma repositories, BullMQ queue adapter, Redis cache).

## Getting started

```bash
npm install
```

Set environment variables (see `.env` in your environment): at minimum `DATABASE_URL`, Redis settings (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, etc.), and run migrations:

```bash
npx prisma migrate dev
npm run start:dev
```

API prefix: **`/api/v1`** (e.g. `POST /api/v1/tickets`).

If you use Docker Compose in this repo, start Postgres and Redis so the app and queues can connect.

## Load testing (k6)

Optional scripts (requires [k6](https://k6.io/) installed):

```bash
npm run load:tickets
npm run load:tickets:smoke
npm run load:race
```

- **`load:tickets`** — many `POST /api/v1/tickets` (throughput).
- **`load:race`** — **optimistic-lock race**: `setup` creates one ticket, then `PARALLEL` VUs (default 50) send **`PATCH /api/v1/tickets/:id`** with the **same** `updatedAt`. Exactly **one** request should win (**200**); the rest should get **409 Conflict** (`ConcurrencyError`). k6’s `http_req_failed` rate will look high because **409 counts as failed** in k6; use the custom counters `race_patch_200` / `race_patch_409` for the real outcome.

Configure with env vars such as `BASE_URL`, `USER_ID`, `VUS`, `DURATION`, `PARALLEL`. See `load-testing/create-tickets.k6.js` and `load-testing/race-ticket-update.k6.js`.

## Scripts

| Script            | Description        |
| ----------------- | ------------------ |
| `npm run start:dev` | Dev server + watch |
| `npm run build`     | Compile            |
| `npm run prisma:generate` | Prisma client |
| `npm run migrate:dev` | Run migrations |

## License

UNLICENSED (private project).

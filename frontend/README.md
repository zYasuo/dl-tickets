# DL System — Frontend

[Next.js](https://nextjs.org/) (App Router) app for **DL System** with [TanStack Query](https://tanstack.com/query), [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/), [shadcn/ui](https://ui.shadcn.com/), and **TypeScript types** generated from the backend OpenAPI via [openapi-typescript](https://github.com/drwpow/openapi-typescript).

As chamadas HTTP autenticadas usam **`fetch`** nas **server actions** ([`src/lib/api/backend-request.ts`](src/lib/api/backend-request.ts)) com `Authorization: Bearer …` a partir do cookie httpOnly do access token — não há `openapi-fetch` no `package.json`.

## Requirements

- Node 20+
- Nest backend from this repo (default `http://localhost:3000`, prefix `/api/v1`)

## Dependências e CI

- **Commitar** `package-lock.json` com qualquer alteração a `package.json`. Em CI/CD usar **`npm ci`** com este lockfile (instalação reprodutível; não usar `npm install` em pipelines).
- Auditoria: `npm audit`; o CI corre `npm audit --audit-level=high` após `npm ci`.

## Setup

```bash
cp .env.example .env.local
```

| Variável | Função |
|----------|--------|
| **`BACKEND_INTERNAL_URL`** | URL base do Nest usada pelas server actions e por `next.config.ts` nos rewrites (`/api/v1/*` → backend). Predefinição típica: `http://localhost:3000`. |
| **`NEXT_PUBLIC_API_BASE_PATH`** | Documentada para chamadas no browser via proxy; o fluxo atual do painel passa sobretudo por server actions e rewrites — não é referenciada em `src/` neste momento. |

**Authentication:** `POST /api/v1/auth/login`. O access token vai no header **`Authorization: Bearer …`** nas rotas protegidas (tickets, **clients**, **client-contracts**). O refresh token fica em cookie **httpOnly** em `/api/v1/auth`; `refresh` / `logout` com `credentials: 'include'`. Ao criar um ticket, **não** envies `userId` no body.

## Development

Terminal 1 — backend (Redis/Postgres conforme o projeto):

```bash
cd ../backend
npm run start:dev
```

Terminal 2 — frontend na porta **3001**:

```bash
npm install
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001). Após login, a rota por omissão é **`/dashboard`**.

### Rotas autenticadas (UI)

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Visão geral: KPIs de clientes e contratos, gráficos, pesquisa de clientes, listas recentes |
| `/dashboard/clients` | Lista paginada de clientes |
| `/dashboard/clients/[id]` | Detalhe do cliente e contratos com `clientId` |
| `/dashboard/tickets` | Lista de chamados |
| `/dashboard/tickets/new` | Novo chamado |
| `/dashboard/tickets/[id]/edit` | Editar chamado |

### Fluxo do dashboard (clientes / contratos)

1. **Métricas:** total de clientes (`GET /api/v1/clients?page=1&limit=1` → `meta.total`) e totais de contratos por estado com `GET /api/v1/client-contracts?status=ACTIVE|EXPIRED|CANCELLED&limit=1` (uma chamada por estado).
2. **Gráficos:** amostra até 100 clientes (agregação por dia) e até 100 contratos (agregação por mês); cartões semicirculares usam a mesma amostra para indicar criações nos últimos 30 dias (percentagem dentro da amostra).
3. **Pesquisa:** campo com debounce (~300 ms) que chama **`GET /api/v1/clients/search?q=…`** (`page`, `limit` opcionais). Resultados navegam para `/dashboard/clients/[id]`.
4. **Detalhe:** `GET /api/v1/clients/:id` e contratos com `GET /api/v1/client-contracts?clientId=:id`.

A UI do painel usa **cartões com cabeçalho destacado** (`DashboardInputCard`) e uma grelha de widgets (donut, barras horizontais, linhas, radiais, listas), sem alterar o tema global — só tokens existentes (`bg-card`, `bg-muted`, `--chart-*`).

### Endpoints usados pelo frontend (integração)

**Clients**

| Método | Path | Query / notas |
|--------|------|----------------|
| GET | `/api/v1/clients/search` | `q` (obrigatório), `page`, `limit` |
| GET | `/api/v1/clients` | `page`, `limit`, `cursor`, `sortBy` (`name` \| `createdAt` \| `updatedAt`), `sortOrder`, `name` (filtro) |
| GET | `/api/v1/clients/:id` | — |
| POST | `/api/v1/clients` | Corpo: ver schema `CreateClientBodyDto` no OpenAPI |

**Client contracts**

| Método | Path | Query / notas |
|--------|------|----------------|
| GET | `/api/v1/client-contracts` | `page`, `limit`, `cursor`, `sortBy`, `sortOrder`, `clientId`, `status` (`ACTIVE` \| `EXPIRED` \| `CANCELLED`) |
| GET | `/api/v1/client-contracts/:id` | — |
| POST | `/api/v1/client-contracts` | Corpo: `CreateClientContractBodyDto` |
| PATCH | `/api/v1/client-contracts/:id` | Corpo: `UpdateClientContractBodyDto` |

Respostas de sucesso seguem o envelope Nest: `{ success, timestamp, data }`; listas paginadas trazem `data: { data: [...], meta }`.

### Modelos principais (UI)

- **Cliente (`ClientPublicHttpOpenApiDto`):** `id`, `name`, `cpf`, `cnpj`, `address` (morada estruturada), `createdAt`, `updatedAt`.
- **Linha de pesquisa (`ClientSearchRowOpenApiDto`):** `client` + `match` (`kind`: `cpf` \| `id` \| `address`, `confidence`: `exact` \| `partial`).
- **Contrato (`ClientContractPublicHttpOpenApiDto`):** `id`, `contractNumber`, `clientId`, `useClientAddress`, `address`, `startDate`, `endDate`, `status`, `createdAt`, `updatedAt`.

## OpenAPI / types

Tipos em [`src/lib/api/v1.d.ts`](src/lib/api/v1.d.ts) gerados a partir de [`openapi/openapi.snapshot.json`](openapi/openapi.snapshot.json). O schema de erro (`StandardErrorResponseDto`) inclui **`code?: string`** (código estável da API, alinhado ao backend).

```bash
npm run openapi:generate   # a partir do snapshot local
npm run openapi:pull       # com o Nest a correr (default http://localhost:3000/docs-json)
npm run openapi:generate
```

Opcional: `OPENAPI_URL` ao correr `openapi:pull`.

**Erros na UI:** [`ApiError`](src/lib/api/api-error.ts) expõe **`code`** quando o backend envia. Constantes por feature (ex.: [`features/auth/lib/auth-api-error-codes.ts`](src/features/auth/lib/auth-api-error-codes.ts)) devem manter os **mesmos valores string** que `src/modules/<módulo>/application/errors/*-api-error-codes.ts` no backend.

## Architecture (short)

- **`src/features/dashboard`**: `DashboardShell`, sidebar, `useDashboardBusinessStats`, `DashboardInputCard`, `DashboardClientSearch`, donut/barras/linhas/radiais e listas recentes.
- **`src/features/clients`**: server actions (`actions.ts`), hooks (`useClientsList`, `useClientDetail`, `useClientsSearch`), vistas de lista e detalhe.
- **`src/features/client-contracts`**: actions e hooks (`useClientContractsList`, `useClientContractsByClient`, …).
- **`src/features/tickets`**: hooks, schemas Zod, UI de chamados.
- **`src/lib/api`**: `backendRequest`, `ApiError` (incl. `code` opcional), tipos OpenAPI.
- **`src/shared`**: UI partilhada (`PageHeader`, `EmptyState`, `ErrorAlert`, `useDebouncedValue`).

**Nota:** não existe `GET /tickets/:id` dedicado no backend. A página de edição localiza o ticket na lista paginada (MVP).

# DL Tickets — Frontend

App [Next.js](https://nextjs.org/) (App Router) com [TanStack Query](https://tanstack.com/query), [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/), [shadcn/ui](https://ui.shadcn.com/) e cliente HTTP tipado com [openapi-fetch](https://github.com/drwpow/openapi-fetch) / [openapi-typescript](https://github.com/drwpow/openapi-typescript).

## Requisitos

- Node 20+
- Backend Nest do repositório (por defeito `http://localhost:3000`, prefixo `/api/v1`)

## Configuração

```bash
cp .env.example .env.local
```

- **`BACKEND_INTERNAL_URL`**: destino dos *rewrites* em `next.config.ts` (`/api/v1/*` → Nest). Evita CORS no browser.
- **`NEXT_PUBLIC_API_BASE_PATH`**: base usada pelo cliente no browser (deve ser `/api/v1` para coincidir com o proxy).

**Autenticação:** o utilizador inicia sessão no backend (`POST /api/v1/auth/login`). O access token JWT vai no header `Authorization: Bearer …` nas rotas protegidas (tickets). O refresh token fica em cookie **httpOnly** no path `/api/v1/auth`; pedidos ao Nest para `refresh` / `logout` devem usar `credentials: 'include'` para enviar o cookie. O dono do ticket é inferido do token — **não** envies `userId` no body ao criar ticket.

## Desenvolvimento

Terminal 1 — backend (com Redis/Postgres conforme o projeto):

```bash
cd ../backend
npm run start:dev
```

Terminal 2 — frontend na porta **3001** (para não colidir com o Nest na 3000):

```bash
npm install
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001). Fluxos: `/tickets`, `/tickets/new`, `/tickets/[id]/edit`.

## OpenAPI / tipos

Tipos gerados em `src/lib/api/v1.d.ts` a partir do snapshot em `openapi/openapi.snapshot.json`.

- Regenerar a partir do snapshot atual:

  ```bash
  npm run openapi:generate
  ```

- Atualizar o snapshot com o backend a correr:

  ```bash
  npm run openapi:pull
  npm run openapi:generate
  ```

## Arquitetura (resumo)

- **`src/features/tickets`**: hooks (`useTicketsList`, `useCreateTicket`, …), schemas Zod, componentes de ticket.
- **`src/lib/api`**: cliente OpenAPI, funções de adaptação e `ApiError` alinhado ao envelope de erro do Nest (`success: false`, `message`, …).
- **`src/shared`**: UI shadcn e componentes genéricos (`PageHeader`, `EmptyState`, `ErrorAlert`).

**Nota:** não existe `GET /tickets/:id` no backend. A página de edição localiza o ticket percorrendo a listagem paginada (MVP).

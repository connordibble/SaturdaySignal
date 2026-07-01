# Saturday Signal

Saturday Signal is an independent fan intelligence platform for college football coverage. MVP1 ships with a Texas football reference deployment and keeps the platform boundaries ready for future teams.

## Local Development

```bash
pnpm install
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The root route loads the MVP Texas football deployment. The canonical team route is `/teams/texas-football`.

## Quality Gates

```bash
pnpm check
pnpm eval
pnpm build
pnpm ingest
pnpm test:e2e
pnpm release:check
```

## Local Data Services

```bash
docker compose up -d
pnpm db:migrate
pnpm ingest
pnpm db:seed
```

`pnpm ingest` works offline from committed fixtures. `pnpm db:seed` requires `DATABASE_URL` and persists the team, 2026 schedule, and source documents.

## API Surface

- `GET /api/health` reports service status, database configuration, and enabled team slugs.
- `POST /api/ingest` returns the normalized source corpus for a team.
- `POST /api/chat` returns grounded answers with citations; set `Accept: text/event-stream` for SSE events.

## Product Posture

- Open-source platform core with one polished Texas football demo.
- Team identity, source policy, and voice should live in typed configuration.
- No official marks, Bevo branding, or affiliation language.
- SaaS concerns such as auth, billing, and tenant admin stay out of MVP1.

## Current Limits

- CFBD live ingestion is optional and skipped unless `CFBD_API_KEY` is configured.
- Chat uses deterministic, source-grounded retrieval over the current source set. MVP1 makes no external LLM calls.
- Multi-tenant auth, billing, admin source management, and hosted SaaS operations are intentionally out of MVP1.

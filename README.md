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

- `GET /api/health` reports service status, database configuration, the active LLM provider, per-team source readiness, and enabled team slugs.
- `POST /api/ingest` returns the normalized source corpus for a team.
- `POST /api/chat` accepts `{ message, teamSlug?, history?, sessionId? }` and returns a grounded answer with citations, confidence, freshness, and the provider that produced it. Set `Accept: text/event-stream` to receive `citations`, incremental `delta`, and `done` SSE events. When `DATABASE_URL` is configured, exchanges persist to `chat_sessions` / `chat_messages` and the response carries a `sessionId` for conversation continuity.

## LLM Providers

Chat generation is provider-agnostic behind a single `LlmProvider` interface (`src/server/llm`).

- **mock** (default): deterministic offline composer grounded in the fixture corpus. No keys required; also the automatic fallback if a live provider fails.
- **anthropic**: set `ANTHROPIC_API_KEY` (model defaults to `claude-opus-4-8`, override with `ANTHROPIC_MODEL`).
- **openai**: set `OPENAI_API_KEY` (model defaults to `gpt-4o`, override with `OPENAI_MODEL`).

Provider selection is automatic from whichever key is present (Anthropic wins when both are set); set `LLM_PROVIDER=mock|anthropic|openai` to force a choice. `GET /api/health` reports which provider is live. Adding a new provider means implementing the `LlmProvider` interface and registering it in `src/server/llm/registry.ts`.

## Product Posture

- Open-source platform core with one polished Texas football demo.
- Team identity, source policy, and voice should live in typed configuration.
- No official marks, Bevo branding, or affiliation language.
- SaaS concerns such as auth, billing, and tenant admin stay out of MVP1.

## Current Limits

- CFBD live ingestion is optional and skipped unless `CFBD_API_KEY` is configured.
- Team notes ship as clearly-labeled sample fixture data; swap `src/server/sources/notes.ts` for a licensed provider before production use.
- Without an LLM API key, chat uses the deterministic offline composer over the source corpus; retrieval is lexical (term frequency + phrase matching), with the schema ready for pgvector embeddings.
- Multi-tenant auth, billing, admin source management, and hosted SaaS operations are intentionally out of MVP1.

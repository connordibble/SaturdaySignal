# Saturday Signal

Saturday Signal is an independent fan intelligence platform for college football coverage. MVP1 ships with a Texas football reference deployment and keeps the platform boundaries ready for future teams.

## Local Development

```bash
pnpm install
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Quality Gates

```bash
pnpm check
pnpm build
pnpm test:e2e
```

## Product Posture

- Open-source platform core with one polished Texas football demo.
- Team identity, source policy, and voice should live in typed configuration.
- No official marks, Bevo branding, or affiliation language.
- SaaS concerns such as auth, billing, and tenant admin stay out of MVP1.

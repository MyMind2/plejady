# Plejády

Bezpečná registrace pro jednodenní školní přednáškový den: Next.js, Supabase (PostgreSQL/Auth/Storage), Vercel a volitelně Resend. Databázové RPC je autoritou pro kapacity; stránka nepoužívá Realtime.

## Lokální spuštění

1. `cp .env.example .env.local` a doplňte Supabase URL a publishable key.
2. `npm install`, `npx supabase start`, `npx supabase db reset` a `npm run dev`.
3. Po propojení projektu spusťte `npm run db:types` (vygenerovaný soubor se má commitnout).

Kontroly: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Databázové testy potřebují Docker a lokální Supabase: `npm run db:test`.

Podrobné návody: [Supabase](docs/setup-supabase.md), [Google OAuth](docs/setup-google-oauth.md), [e-mail](docs/setup-email.md), [Vercel](docs/setup-vercel.md), [zálohy](docs/backup.md), [zátěž](docs/load-testing.md), [spuštění](docs/launch-checklist.md) a [plán pro den akce](docs/event-day-fallback.md).

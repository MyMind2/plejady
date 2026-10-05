# Plejády

Jednoduchá a bezpečná registrace pro jednodenní školní přednáškový den. Aplikace používá Next.js, Supabase (PostgreSQL a Auth) a Vercel. Databázové RPC je autoritou pro kapacity; stránka nepoužívá Realtime.

Studenti se přihlašují osmimístným e-mailovým OTP, které odesílá Supabase Auth přes SMTP nakonfigurované v Supabase Dashboardu. Obě metody používají stejnou Supabase session, RLS a databázovou kontrolu přesné domény `student.alej.cz`.

Google Auth nefunguje a s Horálkem jsme to nespustili.

Každá z 20 sessions má před otevřením registrace přidělenou jednu z pěti místností. Kapacita přidělené místnosti je pevnou kapacitou session.

## Lokální spuštění

1. `cp .env.example .env.local` a doplňte Supabase URL a publishable key.
2. `npm install`, `npx supabase start`, `npx supabase db reset` a `npm run dev`.
3. Po propojení projektu spusťte `npm run db:types` (vygenerovaný soubor se má commitnout).

Kontroly: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Databázové testy potřebují Docker a lokální Supabase: `npm run db:test`.

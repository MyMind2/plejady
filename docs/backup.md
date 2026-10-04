# Zálohy

Free plán vyžaduje vlastní pravidelné exporty. Po `supabase link` uložte mimo repozitář a bezpečně zašifrujte: `supabase db dump --linked -f schema.sql`, `supabase db dump --linked --data-only --use-copy -f data.sql` a podle potřeby `supabase db dump --linked --role-only -f roles.sql`. Fotografie přednášejících jsou ve verzovaném adresáři `public/lecturers/`; databázový dump je proto nepotřebuje. Nikdy necommitujte dump se studenty.

Zálohu udělejte před otevřením registrace a bezprostředně po jejím uzavření. Aktuální syntax ověřte v dokumentaci Supabase CLI.

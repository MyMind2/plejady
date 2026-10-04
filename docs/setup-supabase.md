# Supabase Free

V Supabase vytvořte Free organizaci a projekt; pokud rozhraní nabídne region zdarma, zvolte Evropu. Uložte silné heslo databáze. V **Connect** zkopírujte Project URL a aktuální publishable key do `.env.local`; tento klíč je určený pro prohlížeč. Secret/service-role klíč do prohlížeče nikdy nepatří.

Nainstalujte CLI (`npm install -D supabase`), přihlaste se `npx supabase login`, propojte `npx supabase link --project-ref VASE_ID` a před každým vzdáleným zápisem si nechte zobrazit plán migrací. Až po kontrole spusťte `npx supabase db push`. Přesný typ vygenerujete `npm run db:types`.

Lokální Docker Supabase je jediný testovací prostor pro `npx supabase db reset`, pgTAP, RLS a souběžné testy. Cloudový projekt je jeden společný projekt pro nasazenou aplikaci a skutečná data; nikdy na něm nespouštějte `db reset` ani zátěžové testy. Fotografie přednášejících jsou malé optimalizované soubory v `public/lecturers/`, nikoli Storage bucket.

Prvního ownera vytvořte v SQL Editoru až po prvním přihlášení: vložte jeho `auth.users.id` do `public.user_roles` s rolí `owner`. Nezakládejte admina podle domény. Ověřte RLS pomocí testů a běžného studentského účtu.

`supabase/seed.sql` slouží pouze pro lokální reset a testy. `db push` jej do cloudu nespouští; skutečné údaje se doplní až v samostatném kontrolovaném kroku.

Každá session musí mít před otevřením registrace přiřazenou aktivní místnost. Kapacita této místnosti je autoritativní kapacitou session; stejná místnost nesmí být v jednom bloku použita dvakrát.

Free projekty mohou být při neaktivitě pozastaveny. Několik dní před akcí ověřte stav, projekt případně obnovte, proveďte reálné přihlášení a výběr; ověřte znovu ráno před otevřením registrace. Aktuální limity a regiony vždy zkontrolujte v oficiální dokumentaci Supabase.

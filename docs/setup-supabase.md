# Supabase Free

V Supabase vytvořte Free organizaci a projekt; pokud rozhraní nabídne region zdarma, zvolte Evropu. Uložte silné heslo databáze. V **Connect** zkopírujte Project URL a aktuální publishable key do `.env.local`; tento klíč je určený pro prohlížeč. Secret/service-role klíč do prohlížeče nikdy nepatří.

Nainstalujte CLI (`npm install -D supabase`), přihlaste se `npx supabase login`, propojte `npx supabase link --project-ref VASE_ID` a nasaďte migrace `npx supabase db push`. Přesný typ vygenerujete `npm run db:types`. V Storage vytvořte bucket `lecturer-photos`; před nasazením doplňte jeho RLS tak, aby čtení veřejných profilových fotek bylo omezeno jen na očekávané objekty a zápis jen administrátorům.

Prvního ownera vytvořte v SQL Editoru až po prvním přihlášení: vložte jeho `auth.users.id` do `public.user_roles` s rolí `owner`. Nezakládejte admina podle domény. Ověřte RLS pomocí testů a běžného studentského účtu.

Free projekty mohou být při neaktivitě pozastaveny. Několik dní před akcí ověřte stav, projekt případně obnovte, proveďte reálné přihlášení a výběr; ověřte znovu ráno před otevřením registrace. Aktuální limity a regiony vždy zkontrolujte v oficiální dokumentaci Supabase.

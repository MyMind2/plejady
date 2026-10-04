# Supabase Free

V Supabase vytvořte Free organizaci a projekt; pokud rozhraní nabídne region zdarma, zvolte Evropu. Uložte silné heslo databáze. V **Connect** zkopírujte Project URL a aktuální publishable key do `.env.local`; tento klíč je určený pro prohlížeč. Secret/service-role klíč do prohlížeče nikdy nepatří.

Nainstalujte CLI (`npm install -D supabase`), přihlaste se `npx supabase login`, propojte `npx supabase link --project-ref VASE_ID` a před každým vzdáleným zápisem si nechte zobrazit plán migrací. Až po kontrole spusťte `npx supabase db push`. Přesný typ vygenerujete `npm run db:types`.

Lokální Docker Supabase je jediný testovací prostor pro `npx supabase db reset`, pgTAP, RLS a souběžné testy. Cloudový projekt je jeden společný projekt pro nasazenou aplikaci a skutečná data; nikdy na něm nespouštějte `db reset` ani zátěžové testy. Fotografie přednášejících jsou malé optimalizované soubory v `public/lecturers/`, nikoli Storage bucket.

Prvního ownera vytvořte v SQL Editoru až po prvním přihlášení: vložte jeho `auth.users.id` do `public.user_roles` s rolí `owner`. Nezakládejte admina podle domény. Ověřte RLS pomocí testů a běžného studentského účtu.

`supabase/seed.sql` slouží pouze pro lokální reset a testy. `db push` jej do cloudu nespouští; skutečné údaje se doplní až v samostatném kontrolovaném kroku.

Každá session musí mít před otevřením registrace přiřazenou aktivní místnost. Kapacita této místnosti je autoritativní kapacitou session; stejná místnost nesmí být v jednom bloku použita dvakrát.

## Přihlášení e-mailovým kódem a SMTP

Vedle Google OAuth zapněte v Supabase **Authentication → Sign In / Providers → Email**. Aplikace nepoužívá hesla ani vlastní odesílání e-mailů. Volá pouze Supabase Auth `signInWithOtp()` a `verifyOtp()`.

V **Authentication → Email Templates** upravte šablonu pro magic link tak, aby obsahovala osmimístný kód `{{ .Token }}` místo odkazu `{{ .ConfirmationURL }}`. Bez této změny by Supabase posílal magic link a formulář pro zadání kódu by nefungoval. Délka musí odpovídat nastavení OTP v projektu. Podrobnosti jsou v [dokumentaci e-mailových šablon Supabase](https://supabase.com/docs/guides/auth/auth-email-templates).

Brevo nastavte výhradně v **Authentication → Emails → SMTP Settings** pomocí SMTP údajů získaných v Brevo. SMTP heslo patří jen do Supabase Dashboardu; neukládejte je do `.env.local`, Vercelu ani repozitáře. Ověřte odesílatele/doménu, SPF, DKIM a doručení do skutečné schránky `@student.alej.cz`. Postup a důvody pro vlastní SMTP popisuje [dokumentace Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

V **Authentication → Rate Limits** zkontrolujte limity pro odesílání a ověřování OTP. Aplikace respektuje [výchozí 60sekundový interval Supabase](https://supabase.com/docs/guides/auth/rate-limits) pro opětovné odeslání; Supabase limit vynucuje i na serveru. Limit odesílaných e-mailů nastavte tak, aby zvládl špičku registrace.

Brevo Free má v současnosti limit 300 odeslaných e-mailů denně. To samo o sobě nestačí pro garantované přihlášení všech přibližně 360 studentů v jednom dni, zvlášť při opakovaném odesílání kódu. Před spuštěním proto ověřte aktuální [limit Brevo](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan) a zajistěte dostatečnou kvótu nebo rozložte první OTP přihlášení do více dnů. Google OAuth ponechte zapnutý jako druhou přihlašovací cestu.

Free projekty mohou být při neaktivitě pozastaveny. Několik dní před akcí ověřte stav, projekt případně obnovte, proveďte reálné přihlášení a výběr; ověřte znovu ráno před otevřením registrace. Aktuální limity a regiony vždy zkontrolujte v oficiální dokumentaci Supabase.

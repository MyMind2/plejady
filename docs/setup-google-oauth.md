# Google Workspace OAuth

V Google Cloud vytvořte nebo vyberte projekt, otevřete Google Auth Platform, nastavte audience/consent screen pro školu a vytvořte **Web application** OAuth client. Client ID je veřejný identifikátor aplikace; Client Secret je heslo aplikace a patří jen do Supabase Dashboardu. Redirect URI je přesná adresa, kam Google vrací přihlášeného uživatele.

V Supabase Dashboard → Authentication → Providers → Google zapněte Google, vložte Client ID a Secret a zkopírujte zde zobrazený callback URL do **Authorized redirect URIs** v Googlu. Přidejte `http://localhost:3000` a produkční `https://vas-projekt.vercel.app` mezi povolené origins/redirect URLs dle zobrazených polí. V Supabase Redirect URLs přidejte `http://localhost:3000/auth/callback` a produkční `/auth/callback`.

Otestujte školní účet `@student.alej.cz` i Gmail. Google hint `hd` pouze zjednodušuje přihlášení; aplikace a databázová funkce porovnávají doménu přesně. Chyba `redirect_uri_mismatch` znamená, že URL v Google Cloud přesně neodpovídá callbacku z Supabase (protokol, doména, cesta i lomítko).

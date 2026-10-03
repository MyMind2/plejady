# Resend

Vytvořte Resend účet a před akcí ověřte aktuální Free limity v oficiální dokumentaci. Pokud škola spravuje DNS, ověřte například subdoménu `plejady.alej.cz` přidáním DNS záznamů, které Resend ukáže, vytvořte API key a vložte jej pouze jako `RESEND_API_KEY` na Vercelu. Nastavte `RESEND_FROM` na ověřenou adresu a odešlete test.

Bez přístupu k DNS aplikace stále registruje hosty a ukáže potvrzení na stránce. Registrace se při chybě e-mailu nikdy nemaže. Produkční implementaci e-mailového workeru doplňte před aktivací Resend; klíč se nikdy nesmí dostat do prohlížeče.

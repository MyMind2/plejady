# Bezpečné zátěžové testování

Testujte jen lokální nebo oddělený staging projekt, nikdy slepě produkci zdarma. Nástroj (k6/Artillery) musí používat předem vytvořené testovací účty. Použijte postupně 50, 100, 200 a nanejvýš 400 souběžných uživatelů; mezi stupni zkontrolujte chybovost a latenci a při výrazných chybách zastavte.

Po každém běhu ověřte SQL dotazy: žádná session nemá více registrací než efektivní kapacitu, `student_selections` nemá duplicitní `(student_id, block_id)`, každý blok má nanejvýš jednu `winning_session_id` a aktivních hostů není více než limit. Zvlášť spusťte současné pokusy na pět bloků s 30/60, zaplnění 29/30 a více než 30 jedinečných hostů.

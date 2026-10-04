# Bezpečné zátěžové testování

Testujte jen lokální Docker Supabase, nikdy cloudový projekt. Nástroj (k6/Artillery) musí používat předem vytvořené testovací účty. Použijte postupně 50, 100, 200 a nanejvýš 400 souběžných uživatelů; mezi stupni zkontrolujte chybovost a latenci a při výrazných chybách zastavte.

Po každém běhu ověřte SQL dotazy: žádná session nemá více registrací než kapacitu své přiřazené místnosti, `student_selections` nemá duplicitní `(student_id, block_id)` a aktivních hostů není více než limit. Zvlášť spusťte současné pokusy o poslední volné místo, větší dávku pokusů na téměř plnou session a více než 30 jedinečných hostů.

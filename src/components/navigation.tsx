'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Navigation() {
  const router = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <nav aria-label="Hlavní navigace" className="border-b border-slate-200/80 bg-white/95 shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-2 px-5 py-3 text-sm sm:gap-x-2">
        <Link className="mr-auto rounded-lg px-2 py-1 font-bold tracking-tight text-ink" href="/vyber">
          <span aria-hidden="true" className="mr-1 text-sun">✦</span>Plejády
        </Link>
        <Link className="rounded-lg px-2 py-2 font-medium text-muted hover:bg-slate-50 hover:text-ink" href="/vyber">Výběr přednášek</Link>
        <Link className="rounded-lg px-2 py-2 font-medium text-muted hover:bg-slate-50 hover:text-ink" href="/prednasky">Přednášky</Link>
        <Link className="rounded-lg px-2 py-2 font-medium text-muted hover:bg-slate-50 hover:text-ink" href="/muj-program">Můj program</Link>
        <button className="rounded-lg px-2 py-2 font-medium text-muted underline-offset-4 hover:text-ink hover:underline" onClick={logout}>Odhlásit se</button>
      </div>
    </nav>
  )
}

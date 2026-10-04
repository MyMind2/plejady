import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Lectures() {
  const db = await createClient()
  const { data } = await db.from('lectures').select('id,title,annotation,lecturers(name,short_bio,photo_path)').order('title')

  return (
    <main className="mx-auto max-w-6xl px-5 py-9 sm:py-12">
      <Link href="/vyber" className="inline-flex rounded-lg px-2 py-2 text-sm font-semibold text-muted hover:bg-white hover:text-ink">← Zpět na výběr</Link>
      <div className="mt-5 max-w-2xl">
        <p className="text-sm font-semibold tracking-wide text-sun">SEZNAM PŘEDNÁŠEK</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Přednášky</h1>
        <p className="mt-3 leading-7 text-muted">Projděte si témata a přednášející ještě před sestavením svého programu.</p>
      </div>
      {(data ?? []).length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((lecture: any) => (
            <article key={lecture.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm font-semibold text-sun">Přednáška</p>
              <h2 className="mt-2 text-xl font-bold leading-snug">{lecture.title}</h2>
              <p className="mt-2 font-semibold text-ink">{lecture.lecturers.name}</p>
              <p className="mt-4 leading-6 text-muted">{lecture.annotation}</p>
              <p className="mt-auto border-t border-slate-100 pt-4 text-sm leading-6 text-muted">{lecture.lecturers.short_bio}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-6 text-muted shadow-sm">Informace o přednáškách budou brzy doplněny.</p>
      )}
    </main>
  )
}

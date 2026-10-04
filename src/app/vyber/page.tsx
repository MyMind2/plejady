import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isStudentEmail } from '@/lib/validation'
import { Navigation } from '@/components/navigation'
import SelectionBoard from './selection-board'

export default async function SelectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')
  if (!isStudentEmail(user.email ?? '')) redirect('/prihlaseni?chyba=domena')
  const { error } = await supabase.rpc('ensure_student_profile')
  if (error) redirect('/prihlaseni?chyba=domena')

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-6xl px-5 py-9 sm:py-12">
        <p className="text-sm font-semibold tracking-wide text-sun">VÁŠ DEN PLEJÁD</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Výběr přednášek</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Výběr se ukládá automaticky. V každém ze čtyř bloků si vyberte jednu přednášku.</p>
        <SelectionBoard />
      </main>
    </>
  )
}

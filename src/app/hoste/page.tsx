'use client'

import { useState } from 'react'
import { guestEmailSchema } from '@/lib/validation'

export default function Guests() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const parsedEmail = guestEmailSchema.safeParse(email)
    if (!parsedEmail.success) {
      setMessage('Zadejte prosím platnou e-mailovou adresu.')
      return
    }
    const response = await fetch('/api/guest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName, email: parsedEmail.data, website }) })
    const json = await response.json()
    setMessage(json.message)
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-12 sm:py-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-wide text-sun">PLEJÁDY</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Registrace hostů</h1>
        <p className="mt-3 leading-7 text-muted">Hosté nevybírají přednášky. Pro evidenci potřebujeme celé jméno a e-mail.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold" htmlFor="full-name">
            Celé jméno
            <input id="full-name" name="fullName" required minLength={2} maxLength={160} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm outline-none placeholder:text-slate-400 focus:border-ink focus:ring-2 focus:ring-ink/20" />
          </label>
          <label className="block text-sm font-semibold" htmlFor="email">
            E-mail
            <input id="email" name="email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm outline-none placeholder:text-slate-400 focus:border-ink focus:ring-2 focus:ring-ink/20" />
          </label>
          <label className="hidden" aria-hidden htmlFor="website">Web<input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          <button className="min-h-12 w-full rounded-xl bg-ink px-6 py-3 font-semibold text-white shadow-sm hover:bg-ink/90">Registrovat</button>
          {message && <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-ink">{message}</p>}
        </form>
      </div>
    </main>
  )
}

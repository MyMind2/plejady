'use client'

import { FormEvent, useEffect, useReducer, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isStudentEmail, normalizeStudentEmail } from '@/lib/validation'
import { initialLoginState, loginReducer, normalizeOtpCode, OTP_CODE_LENGTH } from './state'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [state, dispatch] = useReducer(loginReducer, initialLoginState)
  const requestInFlight = useRef(false)
  const busy = state.pending !== null

  useEffect(() => {
    if (state.cooldown === 0) return
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => window.clearInterval(timer)
  }, [state.cooldown])

  function failRequest(message: string) {
    requestInFlight.current = false
    dispatch({ type: 'ERROR', message })
  }

  async function signInWithGoogle() {
    if (requestInFlight.current) return
    requestInFlight.current = true
    dispatch({ type: 'START', operation: 'google' })
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          queryParams: { hd: 'student.alej.cz' },
        },
      })
      if (error) failRequest('Přihlášení přes Google se nepodařilo. Zkuste to prosím znovu.')
    } catch {
      failRequest('Přihlášení přes Google se nepodařilo. Zkuste to prosím znovu.')
    }
  }

  async function sendOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (requestInFlight.current || (state.step === 'code' && state.cooldown > 0)) return

    const normalizedEmail = normalizeStudentEmail(email)
    if (!isStudentEmail(normalizedEmail)) {
      dispatch({
        type: 'ERROR',
        message: 'Zadejte školní e-mail ve tvaru jmeno@student.alej.cz.',
      })
      return
    }

    const isResend = state.step === 'code'
    requestInFlight.current = true
    dispatch({ type: 'START', operation: isResend ? 'resend' : 'send' })
    try {
      const { error } = await createClient().auth.signInWithOtp({ email: normalizedEmail })

      if (error) {
        failRequest(
          error.status === 429
            ? 'Další kód zatím nelze odeslat. Počkejte prosím a zkuste to znovu.'
            : 'Přihlašovací kód se nepodařilo odeslat. Zkuste to prosím znovu.',
        )
        return
      }

      setEmail(normalizedEmail)
      requestInFlight.current = false
      dispatch({ type: 'OTP_SENT', email: normalizedEmail, resent: isResend })
    } catch {
      failRequest('Přihlašovací kód se nepodařilo odeslat. Zkuste to prosím znovu.')
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requestInFlight.current) return

    if (!new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`).test(code)) {
      dispatch({ type: 'ERROR', message: 'Zadejte osmimístný přihlašovací kód.' })
      return
    }

    requestInFlight.current = true
    dispatch({ type: 'START', operation: 'verify' })
    try {
      const { error } = await createClient().auth.verifyOtp({
        email: state.requestedEmail,
        token: code,
        type: 'email',
      })

      if (error) {
        failRequest('Kód není platný nebo jeho platnost vypršela. Zkontrolujte ho nebo si pošlete nový.')
        return
      }

      dispatch({ type: 'VERIFIED' })
      router.replace('/vyber')
      router.refresh()
    } catch {
      failRequest('Ověření kódu se nepodařilo. Zkuste to prosím znovu.')
    }
  }

  function changeEmail() {
    setCode('')
    dispatch({ type: 'EDIT_EMAIL' })
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-12 sm:py-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold tracking-wide text-sun">PLEJÁDY</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Přihlášení</h1>
      <p className="mt-3 leading-7 text-muted">Použijte svůj školní účet @student.alej.cz a sestavte si svůj program.</p>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy}
        className="mt-8 min-h-12 w-full rounded-xl bg-ink px-6 py-3 font-semibold text-white shadow-sm hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.pending === 'google' ? 'Přesměrovávám…' : 'Přihlásit přes Google'}
      </button>

      <div className="my-7 flex items-center gap-4">
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
        <span className="text-sm font-medium text-muted">nebo</span>
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
      </div>

      {state.step === 'email' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label htmlFor="school-email" className="block text-sm font-semibold">
              Školní e-mail
            </label>
            <input
              id="school-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jmeno@student.alej.cz"
              disabled={busy}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm outline-none placeholder:text-slate-400 focus:border-ink focus:ring-2 focus:ring-ink/20 disabled:bg-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl border border-ink bg-white px-6 py-3 font-semibold text-ink shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.pending === 'send' ? 'Odesílám kód…' : 'Poslat přihlašovací kód'}
          </button>
        </form>
      ) : (
        <div>
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-muted">
            Zkontrolujte svůj e-mail. Osmimístný kód jsme poslali na{' '}
            <strong className="text-ink">{state.requestedEmail}</strong>.
          </p>
          <form onSubmit={verifyOtp} className="mt-4 space-y-4">
            <div>
              <label htmlFor="otp-code" className="block text-sm font-semibold">
                Osmimístný přihlašovací kód
              </label>
              <input
                id="otp-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern={`[0-9]{${OTP_CODE_LENGTH}}`}
                maxLength={OTP_CODE_LENGTH}
                required
                autoFocus
                value={code}
                onChange={(event) => setCode(normalizeOtpCode(event.target.value))}
                disabled={busy || state.step === 'success'}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-center text-xl tracking-[0.3em] shadow-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 disabled:bg-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={busy || state.step === 'success'}
              className="min-h-12 w-full rounded-xl border border-ink bg-white px-6 py-3 font-semibold text-ink shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.pending === 'verify' ? 'Ověřuji kód…' : 'Přihlásit se'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button type="button" onClick={changeEmail} disabled={busy} className="underline disabled:opacity-60">
              Změnit e-mail
            </button>
            <button
              type="button"
              onClick={() => void sendOtp()}
              disabled={busy || state.cooldown > 0}
              className="underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
            >
              {state.pending === 'resend'
                ? 'Odesílám nový kód…'
                : state.cooldown > 0
                  ? `Poslat znovu za ${state.cooldown} s`
                  : 'Poslat kód znovu'}
            </button>
          </div>
        </div>
      )}

      {state.status && (
        <p role="status" className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-ink">
          {state.status}
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      </div>
    </main>
  )
}

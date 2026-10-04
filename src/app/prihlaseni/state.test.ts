import { describe, expect, it } from 'vitest'
import {
  initialLoginState,
  loginReducer,
  normalizeOtpCode,
  OTP_CODE_LENGTH,
  OTP_RESEND_COOLDOWN_SECONDS,
} from './state'

describe('OTP login UI state', () => {
  it('moves from the email form to the code form after sending an OTP', () => {
    const pending = loginReducer(initialLoginState, { type: 'START', operation: 'send' })
    expect(pending.pending).toBe('send')

    const sent = loginReducer(pending, {
      type: 'OTP_SENT',
      email: 'student@student.alej.cz',
      resent: false,
    })
    expect(sent).toMatchObject({
      step: 'code',
      pending: null,
      requestedEmail: 'student@student.alej.cz',
      cooldown: OTP_RESEND_COOLDOWN_SECONDS,
      error: '',
    })

    const oneSecondLater = loginReducer(sent, { type: 'TICK' })
    expect(oneSecondLater.cooldown).toBe(OTP_RESEND_COOLDOWN_SECONDS - 1)
  })

  it('exposes verification success and errors without leaving a request pending', () => {
    const failed = loginReducer(
      { ...initialLoginState, step: 'code', pending: 'verify' },
      { type: 'ERROR', message: 'Neplatný kód.' },
    )
    expect(failed).toMatchObject({ step: 'code', pending: null, error: 'Neplatný kód.' })

    const verified = loginReducer(failed, { type: 'VERIFIED' })
    expect(verified).toMatchObject({ step: 'success', pending: null, error: '' })
  })

  it('normalizes pasted OTP values to exactly the supported maximum length', () => {
    expect(OTP_CODE_LENGTH).toBe(8)
    expect(normalizeOtpCode(' 12a34-56789 ')).toBe('12345678')
  })
})

export const OTP_RESEND_COOLDOWN_SECONDS = 60
export const OTP_CODE_LENGTH = 8

export type LoginStep = 'email' | 'code' | 'success'
export type LoginOperation = 'google' | 'send' | 'resend' | 'verify'

export type LoginState = {
  step: LoginStep
  pending: LoginOperation | null
  requestedEmail: string
  cooldown: number
  status: string
  error: string
}

export type LoginAction =
  | { type: 'START'; operation: LoginOperation }
  | { type: 'OTP_SENT'; email: string; resent: boolean }
  | { type: 'ERROR'; message: string }
  | { type: 'VERIFIED' }
  | { type: 'TICK' }
  | { type: 'EDIT_EMAIL' }

export const initialLoginState: LoginState = {
  step: 'email',
  pending: null,
  requestedEmail: '',
  cooldown: 0,
  status: '',
  error: '',
}

export function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'START':
      return { ...state, pending: action.operation, status: '', error: '' }
    case 'OTP_SENT':
      return {
        ...state,
        step: 'code',
        pending: null,
        requestedEmail: action.email,
        cooldown: OTP_RESEND_COOLDOWN_SECONDS,
        status: action.resent ? 'Nový přihlašovací kód byl odeslán.' : 'Přihlašovací kód byl odeslán.',
        error: '',
      }
    case 'ERROR':
      return { ...state, pending: null, status: '', error: action.message }
    case 'VERIFIED':
      return {
        ...state,
        step: 'success',
        pending: null,
        status: 'Přihlášení bylo úspěšné. Přesměrovávám…',
        error: '',
      }
    case 'TICK':
      return { ...state, cooldown: Math.max(0, state.cooldown - 1) }
    case 'EDIT_EMAIL':
      return initialLoginState
  }
}

export function normalizeOtpCode(value: string) {
  return value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH)
}

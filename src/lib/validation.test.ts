import { describe, expect, it } from 'vitest'
import { guestEmailSchema, guestSchema, isStudentEmail, normalizeStudentEmail } from './validation'

describe('school e-mail validation', () => {
  it('normalizes a valid school address', () => {
    expect(normalizeStudentEmail(' Martin@STUDENT.ALEJ.CZ ')).toBe('martin@student.alej.cz')
  })

  it('requires the exact parsed student domain', () => {
    expect(isStudentEmail('martin@student.alej.cz')).toBe(true)
    expect(isStudentEmail(' Martin@STUDENT.ALEJ.CZ ')).toBe(true)
    expect(isStudentEmail('martin@student.alej.cz.example.com')).toBe(false)
    expect(isStudentEmail('martin@gmail.com')).toBe(false)
    expect(isStudentEmail('martin@alej.cz')).toBe(false)
    expect(isStudentEmail('martin@student.alej.cz@gmail.com')).toBe(false)
    expect(isStudentEmail('@student.alej.cz')).toBe(false)
  })
})

describe('guest registration validation', () => {
  it.each(['test@example.com', 'name.surname@gmail.com', 'person+tag@example.org'])(
    'accepts the ordinary guest address %s',
    (email) => {
      expect(guestEmailSchema.parse(email)).toBe(email)
    },
  )

  it('trims surrounding email whitespace', () => {
    expect(guestEmailSchema.parse('  test@example.com  ')).toBe('test@example.com')
  })

  it('rejects a malformed guest email', () => {
    expect(guestEmailSchema.safeParse('not-an-email').success).toBe(false)
  })

  it('requires and trims one full name while accepting any valid email domain', () => {
    const guest = guestSchema.parse({
      fullName: '  Jana Nováková  ',
      email: 'jana@example.com',
    })
    expect(guest.fullName).toBe('Jana Nováková')
    expect(guest.email).toBe('jana@example.com')
  })

  it('rejects a blank full name', () => {
    expect(guestSchema.safeParse({ fullName: '   ', email: 'jana@example.com' }).success).toBe(false)
  })
})

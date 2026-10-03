import { z } from 'zod'
export const guestSchema=z.object({eventId:z.string().uuid(),email:z.string().trim().email().max(254),website:z.string().max(0).optional().default('')})
export const studentDomain='student.alej.cz'
export function normalizeStudentEmail(email:string){return email.trim().toLowerCase()}
export function isStudentEmail(email:string){const normalized=normalizeStudentEmail(email); const [local,domain,...rest]=normalized.split('@'); return Boolean(local)&&domain===studentDomain&&rest.length===0}
export const messages:Record<string,string>={REGISTRATION_NOT_OPEN:'Registrace zatím není otevřená.',REGISTRATION_CLOSED:'Registrace již byla uzavřena.',SESSION_FULL:'Tato přednáška je již obsazená.',SWITCH_TARGET_FULL:'Kapacita se právě naplnila. Původní výběr jsme ponechali.',INVALID_STUDENT_DOMAIN:'Pro přihlášení použijte školní účet @student.alej.cz.',GUEST_LIMIT_REACHED:'Kapacita pro hosty je již naplněna.',GUEST_DUPLICATE:'Tento e-mail je již registrován.',INVALID_EMAIL:'Zadejte prosím platnou e-mailovou adresu.',GENERIC:'Něco se nepodařilo. Zkuste to prosím znovu.'}
export function friendlyError(code?:string){return messages[code??'']??messages.GENERIC}

import { z } from 'zod'
export const guestEmailSchema=z.string().trim().email().max(254)
export const guestSchema=z.object({fullName:z.string().trim().min(2).max(160),email:guestEmailSchema,website:z.string().max(0).optional().default('')})
export const studentDomain='student.alej.cz'
export function normalizeStudentEmail(email:string){return email.trim().toLowerCase()}
export function isStudentEmail(email:string){const normalized=normalizeStudentEmail(email); const [local,domain,...rest]=normalized.split('@'); return Boolean(local)&&domain===studentDomain&&rest.length===0}
export const messages:Record<string,string>={REGISTRATION_NOT_OPEN:'Registrace zatím není otevřená.',REGISTRATION_CLOSED:'Registrace již byla uzavřena.',SESSION_FULL:'Tato přednáška je již obsazená.',SWITCH_TARGET_FULL:'Kapacita se právě naplnila. Původní výběr jsme ponechali.',INVALID_STUDENT_DOMAIN:'Pro přihlášení použijte školní účet @student.alej.cz.',CLASS_REQUIRED:'Nejdříve vyberte svou třídu.',INVALID_CLASS:'Vyberte prosím platnou třídu.',GUEST_LIMIT_REACHED:'Kapacita pro hosty je již naplněna.',GUEST_DUPLICATE:'Tento e-mail je již registrován.',GUEST_REGISTRATION_NOT_OPEN:'Registrace hostů nyní není otevřená.',GUEST_EVENT_AMBIGUOUS:'Registraci hostů nyní nelze spustit. Obraťte se prosím na organizátory.',INVALID_GUEST_NAME:'Zadejte prosím celé jméno.',INVALID_EMAIL:'Zadejte prosím platnou e-mailovou adresu.',GENERIC:'Něco se nepodařilo. Zkuste to prosím znovu.'}
export function friendlyError(code?:string){return messages[code??'']??messages.GENERIC}

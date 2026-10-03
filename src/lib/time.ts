export const blocks=[['08:30','09:30'],['10:00','11:00'],['11:30','12:30'],['13:00','14:00']] as const
export function formatBlock(start:string,end:string){return `${start.slice(0,5)}–${end.slice(0,5)}`}

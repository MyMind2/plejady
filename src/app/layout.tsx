import type { Metadata } from 'next'; import './globals.css'
export const metadata:Metadata={title:'Plejády',description:'Jednodenní přednáškový den pro studenty Aleje'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="cs"><body>{children}</body></html>}

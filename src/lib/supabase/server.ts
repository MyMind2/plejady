import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
export async function createClient() { const jar=await cookies(); return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll(){return jar.getAll()},setAll(items){try{items.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}}}}) }

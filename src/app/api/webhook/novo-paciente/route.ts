import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  )

  const { data, error } = await supabase.from('pacientes').insert({
    nome: body.nome,
    whatsapp: body.whatsapp,
    email: body.email,
    data_nascimento: body.data_nascimento,
    cpf: body.cpf,
    origem: body.origem || 'whatsapp',
    observacoes: body.observacoes,
    status: 'lead',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

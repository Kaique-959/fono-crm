import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  )

  const { data, error } = await supabase.from('atendimentos').insert({
    paciente_id: body.paciente_id,
    tipo_exame: body.tipo_exame,
    status: body.status || 'agendado',
    data_agendamento: body.data_agendamento,
    valor: body.valor,
    origem: body.origem || 'whatsapp',
    observacoes: body.observacoes,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

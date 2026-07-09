import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { validateWebhookToken } from '@/lib/webhook-auth'

export async function POST(request: Request) {
  const authError = validateWebhookToken(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase.from('pacientes').insert({
      nome: body.nome,
      whatsapp: body.whatsapp,
      email: body.email,
      data_nascimento: body.data_nascimento,
      cpf: body.cpf,
      responsavel: body.responsavel,
      origem: body.origem || 'whatsapp',
      observacoes: body.observacoes,
      status: 'lead',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

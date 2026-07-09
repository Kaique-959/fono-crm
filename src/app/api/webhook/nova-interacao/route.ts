import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { validateWebhookToken } from '@/lib/webhook-auth'

export async function POST(request: Request) {
  const authError = validateWebhookToken(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase.from('interacoes').insert({
      paciente_id: body.paciente_id,
      tipo: body.tipo || 'mensagem',
      descricao: body.descricao,
      canal: body.canal || 'whatsapp',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

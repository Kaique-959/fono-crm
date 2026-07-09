import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { validateWebhookToken } from '@/lib/webhook-auth'
import { createGoogleEventAdmin } from '@/lib/google-calendar'

export async function POST(request: Request) {
  const authError = validateWebhookToken(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const supabase = createAdminClient()

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

    if (data) {
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('nome')
        .eq('id', body.paciente_id)
        .single()

      const googleEventId = await createGoogleEventAdmin(data, paciente?.nome || body.tipo_exame)

      if (googleEventId) {
        await supabase.from('atendimentos').update({ google_event_id: googleEventId }).eq('id', data.id)
        data.google_event_id = googleEventId
      }
    }

    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

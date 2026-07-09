import { NextResponse } from 'next/server'
import { createGoogleEvent, deleteGoogleEvent, listGoogleEvents } from '@/lib/google-calendar'

export async function GET() {
  try {
    const events = await listGoogleEvents()
    return NextResponse.json({ events })
  } catch (e: any) {
    if (e.message?.includes('invalid_grant') || e.message?.includes('unauthorized_client')) {
      return NextResponse.json({ error: 'not_authorized' }, { status: 200 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.atendimento) {
      const eventId = await createGoogleEvent(body.atendimento, body.atendimento.pacientes?.nome || body.atendimento.tipo_exame)
      if (!eventId) return NextResponse.json({ error: 'not_authorized' }, { status: 200 })
      return NextResponse.json({ event_id: eventId })
    }

    if (body.deleteEventId) {
      await deleteGoogleEvent(body.deleteEventId)
      return NextResponse.json({ ok: true })
    }

    const events = await listGoogleEvents()
    return NextResponse.json({ events })
  } catch (e: any) {
    if (e.message?.includes('invalid_grant') || e.message?.includes('unauthorized_client')) {
      return NextResponse.json({ error: 'not_authorized' }, { status: 200 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

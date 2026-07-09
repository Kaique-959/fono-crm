import { NextResponse } from 'next/server'

export function validateWebhookToken(request: Request): NextResponse | null {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    console.warn('WEBHOOK_SECRET nao configurado - webhooks sem autenticacao!')
    return null
  }

  const token = request.headers.get('x-webhook-token')
  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

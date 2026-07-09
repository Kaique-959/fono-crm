import { google } from 'googleapis'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from './supabase-admin'

const CONFIG_ID = '00000000-0000-0000-0000-000000000001'

function getRedirectUri() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return new URL('/api/google/callback', process.env.NEXT_PUBLIC_APP_URL).toString()
  }
  return 'http://localhost:3000/api/google/callback'
}

async function buildGoogleClient(supabase: any) {
  const { data } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('id', CONFIG_ID)
    .single()

  if (!data?.google_refresh_token) {
    return null
  }

  const oauth2 = new google.auth.OAuth2(
    data.google_client_id,
    data.google_client_secret,
    getRedirectUri()
  )
  oauth2.setCredentials({ refresh_token: data.google_refresh_token })

  return google.calendar({ version: 'v3', auth: oauth2 })
}

async function fetchCalendarId(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('configuracoes')
    .select('google_calendar_id')
    .eq('id', CONFIG_ID)
    .single()

  return data?.google_calendar_id || 'kaiquecalefi2@gmail.com'
}

export async function getGoogleClient() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  return buildGoogleClient(supabase)
}

export async function getGoogleClientAdmin() {
  const supabase = createAdminClient()
  return buildGoogleClient(supabase)
}

export async function getCalendarId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  return fetchCalendarId(supabase)
}

export async function getCalendarIdAdmin(): Promise<string> {
  const supabase = createAdminClient()
  return fetchCalendarId(supabase)
}

export async function createGoogleEvent(atendimento: any, pacienteNome: string) {
  const gcal = await getGoogleClient()
  if (!gcal) return null

  const calendarId = await getCalendarId()

  try {
    const event = await gcal.events.insert({
      calendarId,
      requestBody: {
        summary: `${pacienteNome} - ${atendimento.tipo_exame}`,
        description: atendimento.observacoes || '',
        start: { dateTime: atendimento.data_agendamento, timeZone: 'America/Sao_Paulo' },
        end: {
          dateTime: new Date(new Date(atendimento.data_agendamento).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      },
    })
    return event.data.id
  } catch (e) {
    console.error('Erro ao criar evento no Google Calendar:', e)
    return null
  }
}

export async function createGoogleEventAdmin(atendimento: any, pacienteNome: string) {
  const gcal = await getGoogleClientAdmin()
  if (!gcal) return null

  const calendarId = await getCalendarIdAdmin()

  try {
    const event = await gcal.events.insert({
      calendarId,
      requestBody: {
        summary: `${pacienteNome} - ${atendimento.tipo_exame}`,
        description: atendimento.observacoes || '',
        start: { dateTime: atendimento.data_agendamento, timeZone: 'America/Sao_Paulo' },
        end: {
          dateTime: new Date(new Date(atendimento.data_agendamento).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      },
    })
    return event.data.id
  } catch (e) {
    console.error('Erro ao criar evento no Google Calendar (admin):', e)
    return null
  }
}

export async function deleteGoogleEvent(eventId: string) {
  const gcal = await getGoogleClient()
  if (!gcal) return

  const calendarId = await getCalendarId()
  try {
    await gcal.events.delete({ calendarId, eventId })
  } catch (e) {
    console.error('Erro ao deletar evento no Google Calendar:', e)
  }
}

export async function listGoogleEvents(timeMin?: Date, timeMax?: Date) {
  const gcal = await getGoogleClient()
  if (!gcal) return []

  const calendarId = await getCalendarId()
  const now = new Date()
  const min = (timeMin || now).toISOString()
  const max = (timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)).toISOString()

  const res = await gcal.events.list({
    calendarId,
    timeMin: min,
    timeMax: max,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  })

  return res.data.items || []
}

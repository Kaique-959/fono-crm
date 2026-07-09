import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { exame_nome, data_iso } = body

    if (!exame_nome || !data_iso) {
      return NextResponse.json({ error: 'Faltou exame_nome ou data_iso' }, { status: 400 })
    }

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

    const data = new Date(data_iso + 'T12:00:00')
    const diaSemana = data.getDay()

    const { data: horarios, error: horariosErr } = await supabase
      .from('horarios_exames')
      .select('horario')
      .eq('exame_nome', exame_nome)
      .eq('dia_semana', diaSemana)
      .order('horario')

    if (horariosErr) return NextResponse.json({ error: horariosErr.message }, { status: 500 })

    const { data: ocupados, error: ocupErr } = await supabase
      .from('atendimentos')
      .select('data_agendamento')
      .not('status', 'eq', 'cancelado')
      .gte('data_agendamento', data_iso + 'T00:00:00')
      .lte('data_agendamento', data_iso + 'T23:59:59')

    if (ocupErr) return NextResponse.json({ error: ocupErr.message }, { status: 500 })

    const horariosOcupados = new Set(
      (ocupados || []).map((a: any) => {
        const d = new Date(a.data_agendamento)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      })
    )

    const nomesDia = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
    const todosHorarios = (horarios || [])
      .map((h: any) => {
        const v = h.horario
        if (typeof v === 'string') return v.slice(0, 5)
        return `${String(v.getHours ? v.getHours() : 0).padStart(2, '0')}:${String(v.getMinutes ? v.getMinutes() : 0).padStart(2, '0')}`
      })
      .filter(Boolean)
    const disponiveis = todosHorarios.filter((h: string) => !horariosOcupados.has(h))

    return NextResponse.json({
      exame: exame_nome,
      data: data_iso,
      dia_semana: nomesDia[diaSemana],
      todos: todosHorarios,
      ocupados: Array.from(horariosOcupados),
      disponiveis,
      disponivel: disponiveis.length > 0,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

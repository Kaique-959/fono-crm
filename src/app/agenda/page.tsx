'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [atendimentos, setAtendimentos] = useState<any[]>([])

  useEffect(() => { loadAtendimentos() }, [currentDate])

  async function loadAtendimentos() {
    const supabase = getSupabaseBrowser()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0).toISOString()
    const { data } = await supabase.from('atendimentos').select('*').gte('data_agendamento', start).lte('data_agendamento', end).order('data_agendamento')
    setAtendimentos(data || [])
  }

  function renderCalendar() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date().toISOString().split('T')[0]

    const atendimentosPorDia: Record<string, any[]> = {}
    atendimentos.forEach(a => {
      if (a.data_agendamento) {
        const dia = a.data_agendamento.split('T')[0]
        if (!atendimentosPorDia[dia]) atendimentosPorDia[dia] = []
        atendimentosPorDia[dia].push(a)
      }
    })

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    let cells = dayNames.map(d => `<div class="text-center text-xs font-mono uppercase py-2" style="color:var(--muted)">${d}</div>`).join('')

    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      cells += `<div class="text-center py-2 text-xs rounded-sm" style="color:var(--muted);opacity:0.4">${prevDate.getDate()}</div>`
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const isToday = dateStr === today
      const isSelected = dateStr === selectedDate
      const hasEvent = atendimentosPorDia[dateStr]
      cells += `<div class="text-center py-2 text-sm rounded-sm cursor-pointer transition-colors hover:bg-surface-2 relative ${isToday ? 'border' : ''} ${isSelected ? 'font-bold' : ''}" style="${isSelected ? 'background:var(--accent-soft);color:var(--accent)' : ''}${isToday ? 'border-color:var(--accent)' : ''}" onclick="document.getElementById('date-${dateStr}').click()">${d}${hasEvent ? '<div class="w-1 h-1 rounded-full mx-auto mt-0.5" style="background:var(--accent)"></div>' : ''}<button id="date-${dateStr}" style="display:none" data-date="${dateStr}"></button></div>`
    }

    document.getElementById('calendarGrid')!.innerHTML = cells
    document.querySelectorAll('[data-date]').forEach(el => {
      el.addEventListener('click', () => {
        setSelectedDate(el.getAttribute('data-date')!)
      })
    })
  }

  useEffect(() => { renderCalendar() }, [atendimentos, selectedDate])

  const dayAtendimentos = atendimentos.filter(a => a.data_agendamento?.split('T')[0] === selectedDate)

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-6">Agenda</h1>

      <div className="flex items-center gap-4 mb-5">
        <button className="btn-sec p-2" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold flex-1 font-display">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <button className="btn-sec p-2" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
          <ChevronRight size={18} />
        </button>
        <button className="btn-sec" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]) }}>
          Hoje
        </button>
      </div>

      <div id="calendarGrid" className="grid grid-cols-7 gap-1 mb-6"></div>

      <div className="bg-surface border border-border rounded-md p-5 hover:border-accent transition-colors">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--fg-2)' }}>
          Programação de {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        {dayAtendimentos.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum agendamento para este dia.</p>
        ) : dayAtendimentos.map(a => (
          <div key={a.id} className="flex items-center gap-3 py-3 border-b last:border-b-0 text-sm" style={{ borderColor: 'var(--border)' }}>
            <span className="font-mono text-xs min-w-[60px]" style={{ color: 'var(--muted)' }}>
              {a.data_agendamento ? new Date(a.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
            <div className="flex-1">
              <strong>{a.tipo_exame}</strong>
              <span className="block text-xs" style={{ color: 'var(--muted)' }}>
                {a.status}{a.valor ? ` · R$ ${Number(a.valor).toFixed(2)}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { EXAMES } from '@/lib/types'
import toast from 'react-hot-toast'

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [atendimentos, setAtendimentos] = useState<any[]>([])
  const [pacientes, setPacientes] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ paciente_id: '', tipo_exame: '', valor: '', observacoes: '', hora: '08:00' })

  useEffect(() => { loadData() }, [currentDate])

  async function loadData() {
    const supabase = getSupabaseBrowser()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0).toISOString()
    const { data: a } = await supabase.from('atendimentos').select('*, pacientes!inner(nome)').gte('data_agendamento', start).lte('data_agendamento', end).order('data_agendamento')
    setAtendimentos(a || [])
    const { data: p } = await supabase.from('pacientes').select('id, nome').order('nome')
    setPacientes(p || [])
  }

  async function handleCreate() {
    if (!form.paciente_id || !form.tipo_exame) return toast.error('Preencha todos os campos')
    const supabase = getSupabaseBrowser()
    const dataAgendamento = `${selectedDate}T${form.hora}:00`
    const { error } = await supabase.from('atendimentos').insert({
      paciente_id: form.paciente_id,
      tipo_exame: form.tipo_exame,
      status: 'agendado',
      data_agendamento: dataAgendamento,
      valor: form.valor ? parseFloat(form.valor) : null,
      observacoes: form.observacoes,
    })
    if (error) return toast.error(error.message)
    toast.success('Agendamento criado!')
    setShowModal(false)
    setForm({ paciente_id: '', tipo_exame: '', valor: '', observacoes: '', hora: '08:00' })
    loadData()
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
      cells += `<div class="text-center py-2 text-sm rounded-sm cursor-pointer transition-colors relative ${isToday ? 'border' : ''} ${isSelected ? 'bg-accent-soft text-accent font-bold' : 'hover:bg-surface-2'}" style="${isToday ? 'border-color:var(--accent)' : ''}" onclick="window.handleDayClick('${dateStr}')">${d}${hasEvent ? '<div class="w-1 h-1 rounded-full mx-auto mt-0.5" style="background:var(--accent)"></div>' : ''}</div>`
    }
    const totalCells = firstDay + daysInMonth
    const remaining = (7 - (totalCells % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      cells += `<div class="text-center py-2 text-xs rounded-sm" style="color:var(--muted);opacity:0.4">${d}</div>`
    }
    document.getElementById('calendarGrid')!.innerHTML = cells
  }

  useEffect(() => { (window as any).handleDayClick = (dateStr: string) => setSelectedDate(dateStr); renderCalendar() }, [atendimentos, selectedDate])

  const dayAtendimentos = atendimentos.filter(a => a.data_agendamento?.split('T')[0] === selectedDate)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display">Agenda</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Novo Agendamento
        </button>
      </div>

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
              <strong>{a.pacientes?.nome || a.tipo_exame}</strong>
              <span className="block text-xs" style={{ color: 'var(--muted)' }}>
                {a.tipo_exame} · {a.status}{a.valor ? ` · R$ ${Number(a.valor).toFixed(2)}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 grid place-items-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-surface border border-border rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold font-display mb-5">Novo Agendamento</h2>
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Paciente</label>
                <select value={form.paciente_id} onChange={e => setForm({ ...form, paciente_id: e.target.value })}>
                  <option value="">Selecione um paciente</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Exame</label>
                <select value={form.tipo_exame} onChange={e => setForm({ ...form, tipo_exame: e.target.value, valor: String(EXAMES.find(ex => ex.nome === e.target.value)?.valor || '') })}>
                  <option value="">Selecione o exame</option>
                  {EXAMES.map(ex => <option key={ex.id} value={ex.nome}>{ex.nome}{ex.valor ? ` - R$ ${ex.valor}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Data</label>
                <div className="flex gap-2 items-center">
                  <input className="w-16 text-center" placeholder="DD" maxLength={2} value={selectedDate.split('-')[2] || ''} onChange={e => { const p = selectedDate.split('-'); const d = e.target.value.replace(/\D/g, '').slice(0,2); setSelectedDate(`${p[0]}-${p[1]}-${d}`) }} />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>/</span>
                  <input className="w-16 text-center" placeholder="MM" maxLength={2} value={selectedDate.split('-')[1] || ''} onChange={e => { const p = selectedDate.split('-'); const m = e.target.value.replace(/\D/g, '').slice(0,2); setSelectedDate(`${p[0]}-${m}-${p[2]}`) }} />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>/</span>
                  <input className="w-24 text-center" placeholder="AAAA" maxLength={4} value={selectedDate.split('-')[0] || ''} onChange={e => { const p = selectedDate.split('-'); const y = e.target.value.replace(/\D/g, '').slice(0,4); setSelectedDate(`${y}-${p[1]}-${p[2]}`) }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Horário</label>
                <div className="flex gap-2 items-center">
                  <input className="w-16 text-center" placeholder="HH" maxLength={2} value={form.hora.split(':')[0] || ''} onChange={e => { const h = e.target.value.replace(/\D/g, '').slice(0,2); setForm({ ...form, hora: `${h}:${form.hora.split(':')[1] || '00'}` }) }} />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>:</span>
                  <input className="w-16 text-center" placeholder="MM" maxLength={2} value={form.hora.split(':')[1] || ''} onChange={e => { const m = e.target.value.replace(/\D/g, '').slice(0,2); setForm({ ...form, hora: `${form.hora.split(':')[0] || '08'}:${m}` }) }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Valor (R$)</label>
                <input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Observações</label>
                <textarea rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button className="btn-sec" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCreate}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

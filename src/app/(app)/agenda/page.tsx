'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { Plus, RefreshCw } from 'lucide-react'
import { EXAMES } from '@/lib/types'
import toast from 'react-hot-toast'

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [pacientes, setPacientes] = useState<any[]>([])
  const [atendimentos, setAtendimentos] = useState<any[]>([])
  const [googleEvents, setGoogleEvents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [googleAuthorized, setGoogleAuthorized] = useState(true)
  const [form, setForm] = useState({ paciente_id: '', tipo_exame: '', valor: '', observacoes: '', hora: '08:00' })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_auth') === 'success') {
      toast.success('Google Agenda conectado!')
      window.history.replaceState({}, '', '/agenda')
    }
    loadData()
    syncFromGoogle()
    const interval = setInterval(syncFromGoogle, 60_000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const supabase = getSupabaseBrowser()
    const { data: p } = await supabase.from('pacientes').select('id, nome').order('nome')
    setPacientes(p || [])
    const { data: a } = await supabase
      .from('atendimentos')
      .select('*, pacientes!inner(nome)')
      .order('data_agendamento', { ascending: false })
      .limit(50)
    setAtendimentos(a || [])
  }

  async function syncFromGoogle() {
    setSyncing(true)
    try {
      const res = await fetch('/api/google/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error === 'not_authorized') {
        setGoogleAuthorized(false)
      } else {
        setGoogleAuthorized(true)
        setGoogleEvents(data.events || [])
      }
    } catch {}
    setSyncing(false)
  }

  async function handleCreate() {
    if (!form.paciente_id || !form.tipo_exame) return toast.error('Preencha todos os campos')
    const supabase = getSupabaseBrowser()
    const dataAgendamento = `${selectedDate}T${form.hora}:00`
    const { data: a, error } = await supabase.from('atendimentos').insert({
      paciente_id: form.paciente_id,
      tipo_exame: form.tipo_exame,
      status: 'agendado',
      data_agendamento: dataAgendamento,
      valor: form.valor ? parseFloat(form.valor) : null,
      observacoes: form.observacoes,
    }).select('*, pacientes!inner(nome)').single()

    if (error) return toast.error(error.message)
    toast.success('Agendamento criado!')

    if (googleAuthorized) {
      try {
        const res = await fetch('/api/google/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ atendimento: a }),
        })
        const j = await res.json()
        if (j.event_id) {
          await supabase.from('atendimentos').update({ google_event_id: j.event_id }).eq('id', a.id)
        }
      } catch {}
    }

    setShowModal(false)
    setForm({ paciente_id: '', tipo_exame: '', valor: '', observacoes: '', hora: '08:00' })
    loadData()
    syncFromGoogle()
  }

  async function handleDelete(id: string, googleEventId?: string) {
    if (!confirm('Excluir este agendamento?')) return
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.from('atendimentos').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Agendamento excluido!')
    if (googleEventId) {
      await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteEventId: googleEventId }),
      })
    }
    loadData()
    syncFromGoogle()
  }

  async function handleToggleStatus(a: any) {
    const novo = a.status === 'agendado' ? 'realizado' : 'agendado'
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.from('atendimentos').update({ status: novo }).eq('id', a.id)
    if (error) return toast.error(error.message)
    toast.success(`Marcado como ${novo}!`)
    loadData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold font-display">Agenda</h1>
        <div className="flex gap-2">
          <button className="btn-sec text-xs sm:text-sm whitespace-nowrap" onClick={syncFromGoogle} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary text-xs sm:text-sm whitespace-nowrap" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Novo
          </button>
        </div>
      </div>

      {!googleAuthorized && (
        <div className="bg-surface border border-border rounded-md p-4 mb-4 text-center">
          <p className="text-xs sm:text-sm mb-2" style={{ color: 'var(--fg-2)' }}>
            Google Agenda nao conectado. Sincronizacao desativada.
          </p>
          <a href="/api/google/auth" className="btn-primary inline-block text-xs sm:text-sm">
            Conectar Google Agenda
          </a>
        </div>
      )}

      <div className="bg-surface border border-border rounded-md overflow-hidden mb-4">
        <iframe
          src="https://calendar.google.com/calendar/embed?src=kaiquecalefi2%40gmail.com&ctz=America%2FSao_Paulo"
          style={{ border: 0, width: '100%', height: 500 }}
          frameBorder={0}
          scrolling="no"
          title="Google Agenda"
        />
      </div>

      <div className="bg-surface border border-border rounded-md p-4 sm:p-5 mb-4">
        <h3 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--fg-2)' }}>
          Agendamentos do CRM ({atendimentos.length})
        </h3>
        {atendimentos.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum agendamento cadastrado no CRM.</p>
        ) : atendimentos.map(a => (
          <div key={a.id} className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 border-b last:border-b-0 text-xs sm:text-sm" style={{ borderColor: 'var(--border)' }}>
            <input
              type="checkbox"
              checked={a.status === 'realizado'}
              onChange={() => handleToggleStatus(a)}
              className="w-4 h-4 cursor-pointer"
              title={a.status === 'realizado' ? 'Marcar como agendado' : 'Marcar como realizado'}
            />
            <span className="font-mono text-[10px] sm:text-xs min-w-[50px] sm:min-w-[60px]" style={{ color: 'var(--muted)' }}>
              {a.data_agendamento ? new Date(a.data_agendamento).toLocaleDateString('pt-BR') : '—'}
            </span>
            <span className="font-mono text-[10px] sm:text-xs" style={{ color: 'var(--muted)' }}>
              {a.data_agendamento ? new Date(a.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
            <div className="flex-1 min-w-0">
              <strong className="text-xs sm:text-sm">{a.pacientes?.nome || a.tipo_exame}</strong>
              <span className="block text-[10px] sm:text-xs truncate" style={{ color: 'var(--muted)' }}>
                {a.tipo_exame} · {a.status}{a.valor ? ` · R$ ${Number(a.valor).toFixed(2)}` : ''}
              </span>
            </div>
            {a.google_event_id && <span title="Sincronizado com Google Agenda" style={{ color: 'var(--success)', fontSize: 14 }}>●</span>}
            <button
              onClick={() => handleDelete(a.id, a.google_event_id)}
              className="text-[10px] sm:text-xs px-2 py-1 rounded"
              style={{ color: 'var(--danger)' }}
              title="Excluir"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      {googleEvents.length > 0 && (
        <div className="bg-surface border border-border rounded-md p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--fg-2)' }}>
            Outros eventos do Google Agenda ({googleEvents.length})
          </h3>
          {googleEvents.map(ev => (
            <div key={ev.id} className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 border-b last:border-b-0 text-xs sm:text-sm" style={{ borderColor: 'var(--border)' }}>
              <span className="font-mono text-[10px] sm:text-xs min-w-[50px] sm:min-w-[60px]" style={{ color: 'var(--muted)' }}>
                {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleDateString('pt-BR') : '—'}
              </span>
              <span className="font-mono text-[10px] sm:text-xs" style={{ color: 'var(--muted)' }}>
                {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
              <div className="flex-1 min-w-0">
                <strong className="text-xs sm:text-sm">{ev.summary}</strong>
                {ev.description && (
                  <span className="block text-[10px] sm:text-xs truncate" style={{ color: 'var(--muted)' }}>
                    {ev.description}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <input className="w-16 text-center" placeholder="DD" maxLength={2} value={selectedDate ? selectedDate.split('-')[2] || '' : ''} onChange={e => { const p = selectedDate.split('-'); const d = e.target.value.replace(/\D/g, '').slice(0, 2); setSelectedDate(`${p[0]}-${p[1]}-${d.padStart(2, '0')}`) }} />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>/</span>
                  <input className="w-16 text-center" placeholder="MM" maxLength={2} value={selectedDate ? selectedDate.split('-')[1] || '' : ''} onChange={e => { const p = selectedDate.split('-'); const v = e.target.value.replace(/\D/g, '').slice(0, 2); setSelectedDate(`${p[0]}-${v.padStart(2, '0')}-${p[2]}`) }} />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>/</span>
                  <input className="w-24 text-center" placeholder="AAAA" maxLength={4} value={selectedDate ? selectedDate.split('-')[0] || '' : ''} onChange={e => { const p = selectedDate.split('-'); const v = e.target.value.replace(/\D/g, '').slice(0, 4); setSelectedDate(`${v}-${p[1]}-${p[2]}`) }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Horario</label>
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
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Observacoes</label>
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

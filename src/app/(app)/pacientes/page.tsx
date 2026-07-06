'use client'

import { useEffect, useState, useRef } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { Plus, Search } from 'lucide-react'

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [pedidoSim, setPedidoSim] = useState(false)
  const [pedidoFile, setPedidoFile] = useState<string>('')
  const [pedidoFileName, setPedidoFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ nome: '', responsavel: '', data_nascimento: '', whatsapp: '', observacoes: '', status: 'lead' })

  useEffect(() => { loadPacientes() }, [search, statusFilter])

  async function loadPacientes() {
    const supabase = getSupabaseBrowser()
    let query = supabase.from('pacientes').select('*').order('nome')
    if (search) query = query.or(`nome.ilike.%${search}%,responsavel.ilike.%${search}%,whatsapp.ilike.%${search}%`)
    if (statusFilter) query = query.eq('status', statusFilter)
    const { data } = await query
    setPacientes(data || [])
  }

  function openModal(p: any = null) {
    if (p) {
      setForm({ nome: p.nome, responsavel: p.responsavel || '', data_nascimento: p.data_nascimento || '', whatsapp: p.whatsapp || '', observacoes: p.observacoes || '', status: p.status })
      setEditId(p.id)
      setPedidoSim(p.pedido_medico === 'sim')
      setPedidoFile(p.pedido_file || '')
      setPedidoFileName(p.pedido_file ? '📎 Pedido anexado' : '')
    } else {
      setForm({ nome: '', responsavel: '', data_nascimento: '', whatsapp: '', observacoes: '', status: 'lead' })
      setEditId(null)
      setPedidoSim(false)
      setPedidoFile('')
      setPedidoFileName('')
    }
    setShowModal(true)
  }

  function handlePedidoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Apenas PDF'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPedidoFile(ev.target?.result as string)
      setPedidoFileName(`📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.nome.trim()) return alert('Informe o nome do paciente.')
    const supabase = getSupabaseBrowser()
    const payload = {
      ...form,
      pedido_medico: pedidoSim ? 'sim' : 'nao',
      pedido_file: pedidoSim ? pedidoFile : '',
    }
    if (editId) {
      await supabase.from('pacientes').update(payload).eq('id', editId)
    } else {
      await supabase.from('pacientes').insert(payload)
    }
    setShowModal(false)
    loadPacientes()
  }

  const statusLabel: Record<string, string> = { lead: '📥 Lead', agendado: '📅 Agendado', realizado: '✅ Realizado', retorno: '🔄 Retorno', inativo: '❌ Inativo' }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-bold font-display">Pacientes</h1>
        <button className="btn-primary text-xs sm:text-sm" onClick={() => openModal()}><Plus size={14} /> Novo</button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative min-w-0">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input className="pl-8 text-sm" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto text-sm max-w-[120px]">
          <option value="">Todos</option>
          <option value="lead">📥 Lead</option>
          <option value="agendado">📅 Agendado</option>
          <option value="realizado">✅ Realizado</option>
          <option value="retorno">🔄 Retorno</option>
          <option value="inativo">❌ Inativo</option>
        </select>
      </div>

      <div className="table-desktop overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Nome</th>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Responsável</th>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>WhatsApp</th>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Pedido</th>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--muted)' }}>Nenhum paciente encontrado.</td></tr>
            ) : pacientes.map(p => (
              <tr key={p.id} className="cursor-pointer transition-colors hover:opacity-80" style={{ borderBottom: '1px solid var(--border)' }} onClick={() => window.location.href = `/pacientes/${p.id}`}>
                <td className="py-3 px-3.5"><strong>{p.nome}</strong></td>
                <td className="py-3 px-3.5">{p.responsavel || '—'}</td>
                <td className="py-3 px-3.5">{p.whatsapp || '—'}</td>
                <td className="py-3 px-3.5 text-center">{p.pedido_medico === 'sim' ? <span style={{ color: 'var(--success)', cursor: 'help' }} title="Com pedido médico">📋 Sim</span> : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                <td className="py-3 px-3.5"><span className={`status-badge ${p.status}`}>{statusLabel[p.status] || 'Lead'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-mobile-cards">
        {pacientes.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>Nenhum paciente encontrado.</p>
        ) : pacientes.map(p => (
          <div key={p.id} className="card-paciente" onClick={() => window.location.href = `/pacientes/${p.id}`}>
            <div className="flex items-center justify-between">
              <strong className="text-sm">{p.nome}</strong>
              <span className={`status-badge ${p.status} text-[10px]`}>{statusLabel[p.status] || 'Lead'}</span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
              {p.responsavel && <span>👤 {p.responsavel}</span>}
              {p.whatsapp && <span>📱 {p.whatsapp}</span>}
              {p.pedido_medico === 'sim' && <span style={{ color: 'var(--success)' }}>📋 Pedido</span>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 grid place-items-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-surface border border-border rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold font-display mb-5">{editId ? 'Editar Paciente' : 'Novo Paciente'}</h2>
            <div className="space-y-3.5">
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Nome do paciente</label><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Nome do responsável</label><input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></div>
              <div>
  <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Data de nascimento</label>
  <div className="flex gap-2">
    <input className="w-16 text-center" placeholder="DD" maxLength={2} value={form.data_nascimento ? form.data_nascimento.split('-')[2] || '' : ''} onChange={e => { const d = form.data_nascimento?.split('-') || ['', '', '']; const m = d[1] || ''; const y = d[0] || ''; const val = e.target.value.replace(/\D/g, '').slice(0, 2); setForm({ ...form, data_nascimento: `${y}-${m}-${val}` }) }} />
    <span className="self-center text-sm" style={{ color: 'var(--muted)' }}>/</span>
    <input className="w-16 text-center" placeholder="MM" maxLength={2} value={form.data_nascimento ? form.data_nascimento.split('-')[1] || '' : ''} onChange={e => { const d = form.data_nascimento?.split('-') || ['', '', '']; const val = e.target.value.replace(/\D/g, '').slice(0, 2); setForm({ ...form, data_nascimento: `${d[0] || ''}-${val}-${d[2] || ''}` }) }} />
    <span className="self-center text-sm" style={{ color: 'var(--muted)' }}>/</span>
    <input className="w-24 text-center" placeholder="AAAA" maxLength={4} value={form.data_nascimento ? form.data_nascimento.split('-')[0] || '' : ''} onChange={e => { const d = form.data_nascimento?.split('-') || ['', '', '']; const val = e.target.value.replace(/\D/g, '').slice(0, 4); setForm({ ...form, data_nascimento: `${val}-${d[1] || ''}-${d[2] || ''}` }) }} />
  </div>
</div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Pedido médico</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" checked={pedidoSim} onChange={() => setPedidoSim(true)} /> Sim
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" checked={!pedidoSim} onChange={() => setPedidoSim(false)} /> Não
                  </label>
                </div>
                {pedidoSim && (
                  <div className="mt-2 border border-dashed rounded-sm p-3.5" style={{ borderColor: 'var(--border)' }}>
                    <input ref={fileRef} type="file" accept=".pdf" onChange={handlePedidoFile} className="text-xs w-full" style={{ color: 'var(--fg-2)' }} />
                    {pedidoFileName && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs" style={{ color: 'var(--fg-2)' }}>{pedidoFileName}</span>
                        {pedidoFile && <button className="btn-sec text-xs py-1 px-2" onClick={() => window.open(pedidoFile, '_blank')}>👁️ Visualizar</button>}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>WhatsApp</label><input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Observações</label><textarea rows={3} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="lead">📥 Lead</option>
                  <option value="agendado">📅 Agendado</option>
                  <option value="realizado">✅ Realizado</option>
                  <option value="retorno">🔄 Retorno</option>
                  <option value="inativo">❌ Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button className="btn-sec" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

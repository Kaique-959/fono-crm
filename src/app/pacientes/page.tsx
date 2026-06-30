'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { Plus, Search } from 'lucide-react'

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', data_nascimento: '', cpf: '', convenio: '', observacoes: '', status: 'lead' })

  useEffect(() => { loadPacientes() }, [search, statusFilter])

  async function loadPacientes() {
    const supabase = getSupabaseBrowser()
    let query = supabase.from('pacientes').select('*').order('nome')
    if (search) query = query.or(`nome.ilike.%${search}%,whatsapp.ilike.%${search}%,email.ilike.%${search}%`)
    if (statusFilter) query = query.eq('status', statusFilter)
    const { data } = await query
    setPacientes(data || [])
  }

  function openModal(p: any = null) {
    if (p) { setForm({ nome: p.nome, whatsapp: p.whatsapp || '', email: p.email || '', data_nascimento: p.data_nascimento || '', cpf: p.cpf || '', convenio: p.convenio || '', observacoes: p.observacoes || '', status: p.status }); setEditId(p.id) }
    else { setForm({ nome: '', whatsapp: '', email: '', data_nascimento: '', cpf: '', convenio: '', observacoes: '', status: 'lead' }); setEditId(null) }
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nome.trim()) return alert('Informe o nome do paciente.')
    const supabase = getSupabaseBrowser()
    if (editId) {
      await supabase.from('pacientes').update(form).eq('id', editId)
    } else {
      await supabase.from('pacientes').insert(form)
    }
    setShowModal(false)
    loadPacientes()
  }

  const statusLabel: Record<string, string> = { lead: '📥 Lead', agendado: '📅 Agendado', realizado: '✅ Realizado', retorno: '🔄 Retorno', inativo: '❌ Inativo' }

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-6">Pacientes</h1>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input className="pl-9" placeholder="Buscar por nome, WhatsApp ou email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto">
          <option value="">Todos os status</option>
          <option value="lead">📥 Lead</option>
          <option value="agendado">📅 Agendado</option>
          <option value="realizado">✅ Realizado</option>
          <option value="retorno">🔄 Retorno</option>
          <option value="inativo">❌ Inativo</option>
        </select>
        <button className="btn-primary" onClick={() => openModal()}><Plus size={16} /> Novo Paciente</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Nome</th>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>WhatsApp</th>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Email</th>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>CPF</th>
              <th className="text-left py-3 px-3.5 text-xs uppercase tracking-wider font-mono font-medium" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--muted)' }}>Nenhum paciente encontrado.</td></tr>
            ) : pacientes.map(p => (
              <tr key={p.id} className="cursor-pointer transition-colors hover:opacity-80" style={{ borderBottom: '1px solid var(--border)' }} onClick={() => window.location.href = `/pacientes/${p.id}`}>
                <td className="py-3 px-3.5"><strong>{p.nome}</strong></td>
                <td className="py-3 px-3.5">{p.whatsapp || '—'}</td>
                <td className="py-3 px-3.5">{p.email || '—'}</td>
                <td className="py-3 px-3.5">{p.cpf || '—'}</td>
                <td className="py-3 px-3.5"><span className={`status-badge ${p.status}`}>{statusLabel[p.status] || 'Lead'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 grid place-items-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-surface border border-border rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold font-display mb-5">{editId ? 'Editar Paciente' : 'Novo Paciente'}</h2>
            <div className="space-y-3.5">
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Nome</label><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>WhatsApp</label><input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Data de Nascimento</label><input type="date" value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} /></div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>CPF</label><input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} /></div>
              <div><label className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>Convênio</label><input value={form.convenio} onChange={e => setForm({ ...form, convenio: e.target.value })} /></div>
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

'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { KANBAN_COLUNAS } from '@/lib/types'

export default function KanbanPage() {
  const [pacientes, setPacientes] = useState<any[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => { loadPacientes() }, [])

  async function loadPacientes() {
    const supabase = getSupabaseBrowser()
    const { data } = await supabase.from('pacientes').select('*').order('nome')
    setPacientes(data || [])
  }

  async function updateStatus(id: string, status: string) {
    const supabase = getSupabaseBrowser()
    await supabase.from('pacientes').update({ status }).eq('id', id)
    loadPacientes()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-bold font-display">Kanban</h1>
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 xl:grid-cols-5 gap-3 min-h-[60vh]">
        {KANBAN_COLUNAS.map(col => {
          const items = pacientes.filter(p => (p.status || 'lead') === col.id)
          return (
            <div key={col.id} className="bg-surface border border-border rounded-md p-3 flex flex-col"
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'var(--accent-soft)' }}
              onDragLeave={e => { e.currentTarget.style.background = '' }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.background = ''; if (draggedId) updateStatus(draggedId, col.id); setDraggedId(null) }}>
              <h3 className="text-sm font-semibold pb-3 mb-2 flex items-center gap-2 border-b-2" style={{ borderColor: col.id === 'lead' ? 'var(--warn)' : col.id === 'agendado' ? 'var(--accent)' : col.id === 'realizado' ? 'var(--success)' : col.id === 'retorno' ? 'var(--fg-2)' : 'var(--muted)' }}>
                {col.titulo}
                <span className="font-mono text-xs ml-auto" style={{ color: 'var(--muted)' }}>{items.length}</span>
              </h3>
              {items.length === 0 ? (
                <div className="text-center py-6 text-xs" style={{ color: 'var(--muted)' }}>Arraste cards para cá</div>
              ) : items.map(p => (
                <div key={p.id} className="bg-surface-2 border border-border rounded-sm p-3 mb-2 cursor-grab active:cursor-grabbing hover:border-accent transition-colors text-sm"
                  draggable
                  onDragStart={e => { setDraggedId(p.id); e.dataTransfer.effectAllowed = 'move' }}
                  onClick={() => window.location.href = `/pacientes/${p.id}`}>
                  <div className="font-semibold mb-1">{p.nome}</div>
                  <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                    {p.whatsapp || '—'}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="sm:hidden horizontal-scroll">
        {KANBAN_COLUNAS.map(col => {
          const items = pacientes.filter(p => (p.status || 'lead') === col.id)
          return (
            <div key={col.id} className="bg-surface border border-border rounded-md p-3 flex flex-col min-h-[50vh]"
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'var(--accent-soft)' }}
              onDragLeave={e => { e.currentTarget.style.background = '' }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.background = ''; if (draggedId) updateStatus(draggedId, col.id); setDraggedId(null) }}>
              <h3 className="text-sm font-semibold pb-3 mb-2 flex items-center gap-2 border-b-2" style={{ borderColor: col.id === 'lead' ? 'var(--warn)' : col.id === 'agendado' ? 'var(--accent)' : col.id === 'realizado' ? 'var(--success)' : col.id === 'retorno' ? 'var(--fg-2)' : 'var(--muted)' }}>
                {col.titulo}
                <span className="font-mono text-xs ml-auto" style={{ color: 'var(--muted)' }}>{items.length}</span>
              </h3>
              {items.length === 0 ? (
                <div className="text-center py-6 text-xs" style={{ color: 'var(--muted)' }}>Arraste cards para cá</div>
              ) : items.map(p => (
                <div key={p.id} className="bg-surface-2 border border-border rounded-sm p-3 mb-2 cursor-grab active:cursor-grabbing hover:border-accent transition-colors text-sm"
                  draggable
                  onDragStart={e => { setDraggedId(p.id); e.dataTransfer.effectAllowed = 'move' }}
                  onClick={() => window.location.href = `/pacientes/${p.id}`}>
                  <div className="font-semibold mb-1">{p.nome}</div>
                  <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                    {p.whatsapp || '—'}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

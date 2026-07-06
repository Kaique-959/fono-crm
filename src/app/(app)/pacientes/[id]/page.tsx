'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PacienteDetailPage() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState<any>(null)
  const [atendimentos, setAtendimentos] = useState<any[]>([])
  const [interacoes, setInteracoes] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    const supabase = getSupabaseBrowser()
    const { data: p } = await supabase.from('pacientes').select('*').eq('id', id).single()
    setPaciente(p)

    const { data: a } = await supabase.from('atendimentos').select('*').eq('paciente_id', id).order('data_agendamento', { ascending: false })
    setAtendimentos(a || [])

    const { data: i } = await supabase.from('interacoes').select('*').eq('paciente_id', id).order('criado_em', { ascending: false }).limit(10)
    setInteracoes(i || [])
  }

  if (!paciente) return <p className="text-center py-12" style={{ color: 'var(--muted)' }}>Carregando...</p>

  const statusLabel: Record<string, string> = { lead: '📥 Lead', agendado: '📅 Agendado', realizado: '✅ Realizado', retorno: '🔄 Retorno', inativo: '❌ Inativo' }

  return (
    <div>
      <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-xs sm:text-sm mb-4" style={{ color: 'var(--muted)' }}>
        <ArrowLeft size={14} /> Voltar
      </Link>

      <div className="flex items-center gap-3 sm:gap-5 mb-5 sm:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full grid place-items-center text-xl sm:text-2xl flex-shrink-0" style={{ background: 'var(--accent-soft)' }}>👤</div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold font-display truncate">{paciente.nome}</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`status-badge ${paciente.status} text-[10px]`}>{statusLabel[paciente.status] || 'Lead'}</span>
            {paciente.whatsapp && <span className="text-xs sm:text-sm truncate" style={{ color: 'var(--muted)' }}>· {paciente.whatsapp}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="bg-surface border border-border rounded-md p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--fg-2)' }}>Informações Pessoais</h3>
          {[
            ['Responsável', paciente.responsavel],
            ['Data de Nascimento', paciente.data_nascimento ? new Date(paciente.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'],
            ['WhatsApp', paciente.whatsapp],
            ['Pedido Médico', paciente.pedido_medico === 'sim' ? 'Sim' : 'Não'],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between py-1.5 sm:py-2 text-xs sm:text-sm border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{label}</span>
              <span className="font-medium text-right ml-2">{value || '—'}</span>
            </div>
          ))}
        </div>
        <div className="bg-surface border border-border rounded-md p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--fg-2)' }}>Observações</h3>
          <p className="text-xs sm:text-sm">{paciente.observacoes || 'Nenhuma observação.'}</p>
          {paciente.pedido_medico === 'sim' && paciente.pedido_file && (
            <button className="btn-sec mt-2 sm:mt-3 text-xs py-1.5 px-3" onClick={() => window.open(paciente.pedido_file, '_blank')}>
              👁️ Ver Pedido Médico
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-md p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--fg-2)' }}>Histórico de Atendimentos</h3>
        {atendimentos.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum atendimento registrado.</p>
        ) : atendimentos.map(a => (
          <div key={a.id} className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 border-b last:border-b-0 text-xs sm:text-sm" style={{ borderColor: 'var(--border)' }}>
            <span className="font-mono text-[10px] sm:text-xs min-w-[70px] sm:min-w-[80px]">{a.data_agendamento ? new Date(a.data_agendamento).toLocaleDateString('pt-BR') : '—'}</span>
            <div className="flex-1 min-w-0"><strong className="text-xs sm:text-sm">{a.tipo_exame}</strong><span className="block text-[10px] sm:text-xs truncate" style={{ color: 'var(--muted)' }}>{a.status}{a.valor ? ` · R$ ${Number(a.valor).toFixed(2)}` : ''}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

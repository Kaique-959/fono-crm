'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { Users, Calendar, DollarSign, TrendingUp, Plus, CalendarPlus } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend)

export default function DashboardPage() {
  const [kpis, setKpis] = useState({ pacientes: 0, hoje: 0, faturamento: 0, leads: 0 })
  const [chartLinha, setChartLinha] = useState<any>(null)
  const [chartPizza, setChartPizza] = useState<any>(null)
  const [atividades, setAtividades] = useState<any[]>([])

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const supabase = getSupabaseBrowser()
    const hoje = new Date().toISOString().split('T')[0]
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const inicioSemana = new Date(Date.now() - 7 * 86400000).toISOString()

    const { count: totalPacientes } = await supabase.from('pacientes').select('*', { count: 'exact', head: true })
    const { count: consultasHoje } = await supabase.from('atendimentos').select('*', { count: 'exact', head: true }).gte('data_agendamento', `${hoje}T00:00:00`).lte('data_agendamento', `${hoje}T23:59:59`)
    const { data: fatData } = await supabase.from('atendimentos').select('valor').gte('data_agendamento', inicioMes).eq('status', 'realizado')
    const { count: novosLeads } = await supabase.from('pacientes').select('*', { count: 'exact', head: true }).gte('criado_em', inicioSemana)

    const faturamento = (fatData || []).reduce((s, r) => s + (Number(r.valor) || 0), 0)
    setKpis({ pacientes: totalPacientes || 0, hoje: consultasHoje || 0, faturamento, leads: novosLeads || 0 })

    const { data: consultas } = await supabase.from('atendimentos').select('data_agendamento, tipo_exame, valor, status, paciente_id').gte('data_agendamento', inicioMes).order('data_agendamento')
    if (consultas) {
      const agruparDia: Record<string, number> = {}
      const agruparExame: Record<string, number> = {}
      consultas.forEach(c => {
        if (c.data_agendamento) {
          const dia = c.data_agendamento.split('T')[0]
          agruparDia[dia] = (agruparDia[dia] || 0) + 1
        }
        agruparExame[c.tipo_exame] = (agruparExame[c.tipo_exame] || 0) + 1
      })

      const dias = Object.keys(agruparDia).sort()
      setChartLinha({
        labels: dias.map(d => d.slice(5)),
        datasets: [{ label: 'Agendamentos', data: dias.map(d => agruparDia[d]), borderColor: '#9b5b32', backgroundColor: 'rgba(155,91,50,0.06)', fill: true, tension: 0.3 }]
      })
      setChartPizza({
        labels: Object.keys(agruparExame),
        datasets: [{ data: Object.values(agruparExame), backgroundColor: ['#9b5b32', '#4f8a4f', '#c9822f', '#b33a3a', '#4c4037', '#7a6d63', '#ded2c3'] }]
      })
    }

    const { data: recentes } = await supabase.from('atendimentos').select('data_agendamento, tipo_exame, status, valor').order('data_agendamento', { ascending: false }).limit(8)
    setAtividades(recentes || [])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-bold font-display">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        <div className="bg-surface border border-border rounded-md p-3.5 sm:p-5">
          <Users size={16} className="mb-2" style={{ color: 'var(--accent)' }} />
          <div className="text-[10px] uppercase tracking-wider font-mono mb-1" style={{ color: 'var(--muted)' }}>Pacientes</div>
          <div className="text-xl sm:text-3xl font-bold font-mono tabular-nums">{kpis.pacientes}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-3.5 sm:p-5">
          <Calendar size={16} className="mb-2" style={{ color: 'var(--accent)' }} />
          <div className="text-[10px] uppercase tracking-wider font-mono mb-1" style={{ color: 'var(--muted)' }}>Hoje</div>
          <div className="text-xl sm:text-3xl font-bold font-mono tabular-nums">{kpis.hoje}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-3.5 sm:p-5">
          <DollarSign size={16} className="mb-2" style={{ color: 'var(--accent)' }} />
          <div className="text-[10px] uppercase tracking-wider font-mono mb-1" style={{ color: 'var(--muted)' }}>Faturamento</div>
          <div className="text-xl sm:text-3xl font-bold font-mono tabular-nums">R$ {kpis.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-3.5 sm:p-5">
          <TrendingUp size={16} className="mb-2" style={{ color: 'var(--accent)' }} />
          <div className="text-[10px] uppercase tracking-wider font-mono mb-1" style={{ color: 'var(--muted)' }}>Leads</div>
          <div className="text-xl sm:text-3xl font-bold font-mono tabular-nums">{kpis.leads}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        <button className="btn-primary whitespace-nowrap text-xs sm:text-sm" onClick={() => window.location.href = '/pacientes'}>
          <Plus size={14} /> Novo Paciente
        </button>
        <button className="btn-sec whitespace-nowrap text-xs sm:text-sm" onClick={() => window.location.href = '/agenda'}>
          <CalendarPlus size={14} /> Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
        <div className="bg-surface border border-border rounded-md p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--fg-2)' }}>Agendamentos por Dia</h3>
          <div style={{ maxHeight: 220, position: 'relative' }}>
            {chartLinha && <Line data={chartLinha} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#707070', font: { size: 10 } }, grid: { color: '#d9d9d9' } }, y: { ticks: { color: '#707070', font: { size: 10 } }, grid: { color: '#d9d9d9' }, beginAtZero: true } } }} />}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-md p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--fg-2)' }}>Exames por Tipo</h3>
          <div style={{ maxHeight: 220, position: 'relative' }}>
            {chartPizza && <Doughnut data={chartPizza} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: '#3a3a3a', font: { size: 10 } } } } }} />}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-md p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-semibold mb-3" style={{ color: 'var(--fg-2)' }}>Atividades Recentes</h3>
        {atividades.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma atividade recente.</p>
        ) : (
          atividades.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 sm:py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.status === 'realizado' ? 'var(--success)' : a.status === 'agendado' ? 'var(--accent)' : 'var(--warn)' }} />
              <div className="flex-1 min-w-0 text-sm">
                <strong>{a.tipo_exame}</strong>
                <span className="block text-xs truncate" style={{ color: 'var(--muted)' }}>
                  {a.data_agendamento ? new Date(a.data_agendamento).toLocaleDateString('pt-BR') : '—'} · {a.status}
                  {a.valor ? ` · R$ ${Number(a.valor).toFixed(2)}` : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function RelatoriosPage() {
  const [period, setPeriod] = useState('mes')
  const [summary, setSummary] = useState({ faturamento: 0, exames: 0, pacientes: 0 })
  const [chartFat, setChartFat] = useState<any>(null)
  const [chartExames, setChartExames] = useState<any>(null)

  useEffect(() => { loadReports() }, [period])

  function getDateRange() {
    const now = new Date()
    let start: Date
    if (period === 'mes') start = new Date(now.getFullYear(), now.getMonth(), 1)
    else if (period === 'trimestre') start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    else start = new Date(now.getFullYear(), 0, 1)
    return { start: start.toISOString(), end: now.toISOString() }
  }

  async function loadReports() {
    const supabase = getSupabaseBrowser()
    const range = getDateRange()

    const { data: atendimentos } = await supabase.from('atendimentos')
      .select('data_agendamento, tipo_exame, valor, status')
      .gte('data_agendamento', range.start)
      .lte('data_agendamento', range.end)

    const { data: pacientes } = await supabase.from('pacientes')
      .select('criado_em')
      .gte('criado_em', range.start)

    const realizados = (atendimentos || []).filter(a => a.status === 'realizado')
    const fatTotal = realizados.reduce((s, a) => s + (Number(a.valor) || 0), 0)
    setSummary({ faturamento: fatTotal, exames: realizados.length, pacientes: pacientes?.length || 0 })

    if (atendimentos) {
      const fatPorMes: Record<string, number> = {}
      atendimentos.forEach(a => {
        if (a.data_agendamento) {
          const mes = a.data_agendamento.slice(0, 7)
          fatPorMes[mes] = (fatPorMes[mes] || 0) + (Number(a.valor) || 0)
        }
      })
      const meses = Object.keys(fatPorMes).sort()
      setChartFat({
        labels: meses.map(m => { const p = m.split('-'); return new Date(parseInt(p[0]), parseInt(p[1]) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }),
        datasets: [{ label: 'Faturamento', data: meses.map(m => fatPorMes[m]), backgroundColor: 'rgba(155,91,50,0.12)', borderColor: '#9b5b32', borderWidth: 1, borderRadius: 4 }]
      })

      const examesAgrupar: Record<string, number> = {}
      atendimentos.forEach(a => { examesAgrupar[a.tipo_exame] = (examesAgrupar[a.tipo_exame] || 0) + 1 })
      setChartExames({
        labels: Object.keys(examesAgrupar),
        datasets: [{ data: Object.values(examesAgrupar), backgroundColor: ['#9b5b32', '#4f8a4f', '#c9822f', '#b33a3a', '#4c4037', '#7a6d63', '#ded2c3'] }]
      })
    }
  }

  const periods = [
    { key: 'mes', label: 'Este Mês' },
    { key: 'trimestre', label: 'Trimestre' },
    { key: 'ano', label: 'Este Ano' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-6">Relatórios</h1>

      <div className="flex gap-2 mb-6">
        {periods.map(p => (
          <button key={p.key} className={`${period === p.key ? 'btn-primary' : 'btn-sec'}`} onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-md p-5 text-center hover:border-accent transition-colors">
          <div className="text-xs uppercase tracking-wider font-mono mb-2" style={{ color: 'var(--muted)' }}>Faturamento</div>
          <div className="text-2xl font-bold font-mono tabular-nums">R$ {summary.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-5 text-center hover:border-accent transition-colors">
          <div className="text-xs uppercase tracking-wider font-mono mb-2" style={{ color: 'var(--muted)' }}>Exames Realizados</div>
          <div className="text-2xl font-bold font-mono tabular-nums">{summary.exames}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-5 text-center hover:border-accent transition-colors">
          <div className="text-xs uppercase tracking-wider font-mono mb-2" style={{ color: 'var(--muted)' }}>Novos Pacientes</div>
          <div className="text-2xl font-bold font-mono tabular-nums">{summary.pacientes}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
        <div className="bg-surface border border-border rounded-md p-5 hover:border-accent transition-colors">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--fg-2)' }}>Faturamento Mensal</h3>
          {chartFat && <Bar data={chartFat} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#707070', font: { size: 11 } }, grid: { color: '#d9d9d9' } }, y: { ticks: { color: '#707070', font: { size: 11 } }, grid: { color: '#d9d9d9' }, beginAtZero: true } } }} />}
        </div>
        <div className="bg-surface border border-border rounded-md p-5 hover:border-accent transition-colors">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--fg-2)' }}>Exames Realizados</h3>
          {chartExames && <Doughnut data={chartExames} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#3a3a3a', font: { size: 11 } } } } }} />}
        </div>
      </div>
    </div>
  )
}

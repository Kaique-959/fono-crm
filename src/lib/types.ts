export interface Paciente {
  id: string
  nome: string
  telefone: string | null
  whatsapp: string | null
  email: string | null
  cpf: string | null
  rg: string | null
  data_nascimento: string | null
  endereco: string | null
  convenio: string | null
  origem: string | null
  observacoes: string | null
  status: string
  criado_em: string
  atualizado_em: string
}

export interface Atendimento {
  id: string
  paciente_id: string
  tipo_exame: string
  status: string
  data_agendamento: string | null
  data_realizacao: string | null
  valor: number | null
  pago: boolean
  origem: string | null
  observacoes: string | null
  google_event_id: string | null
  criado_em: string
  atualizado_em: string
}

export interface Interacao {
  id: string
  paciente_id: string
  tipo: string
  descricao: string
  canal: string
  criado_em: string
}

export const EXAMES = [
  { id: 1, nome: 'Audiometria', valor: 100 },
  { id: 2, nome: 'Imitanciometria', valor: 100 },
  { id: 3, nome: 'PAC - Processamento Auditivo Central', valor: 287 },
  { id: 4, nome: 'P300', valor: 267 },
  { id: 5, nome: 'BERA', valor: 287 },
  { id: 6, nome: 'Otoemissões Acústicas', valor: 240 },
  { id: 7, nome: 'Avaliação Neuropsicológica (TDAH, TEA, QI)', valor: 1437 },
  { id: 8, nome: 'Aparelho Auditivo', valor: 0 },
  { id: 9, nome: 'TAAC - Treinamento Auditivo em Cabine', valor: 437 },
  { id: 10, nome: 'Outros Assuntos', valor: 0 },
]

export const KANBAN_COLUNAS = [
  { id: 'lead', titulo: '📥 Lead', cor: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { id: 'agendado', titulo: '📅 Agendado', cor: 'bg-blue-100 border-blue-400 text-blue-800' },
  { id: 'realizado', titulo: '✅ Realizado', cor: 'bg-green-100 border-green-400 text-green-800' },
  { id: 'retorno', titulo: '🔄 Retorno', cor: 'bg-purple-100 border-purple-400 text-purple-800' },
  { id: 'inativo', titulo: '❌ Inativo', cor: 'bg-gray-100 border-gray-400 text-gray-800' },
]

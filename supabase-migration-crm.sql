-- ============================================
-- CRM Fonoaudiologia — Supabase Migration
-- ============================================

-- 1. TABLE: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nome text NOT NULL,
  role text NOT NULL DEFAULT 'atendente',
  avatar_url text,
  criado_em timestamptz DEFAULT now(),
  senha_hash text
);

-- 2. TABLE: pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  whatsapp text,
  email text,
  cpf text UNIQUE,
  rg text,
  data_nascimento date,
  endereco text,
  convenio text,
  origem text,
  observacoes text,
  status text DEFAULT 'lead',
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 3. TABLE: atendimentos
CREATE TABLE IF NOT EXISTS atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo_exame text NOT NULL,
  status text NOT NULL DEFAULT 'lead',
  data_agendamento timestamptz,
  data_realizacao timestamptz,
  valor numeric(10,2),
  pago bool DEFAULT false,
  origem text,
  observacoes text,
  google_event_id text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 4. TABLE: interacoes
CREATE TABLE IF NOT EXISTS interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descricao text NOT NULL,
  canal text NOT NULL DEFAULT 'whatsapp',
  criado_em timestamptz DEFAULT now()
);

-- 5. TABLE: kanban_colunas
CREATE TABLE IF NOT EXISTS kanban_colunas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  cor text,
  posicao integer,
  criado_em timestamptz DEFAULT now()
);

-- 6. TABLE: kanban_cards
CREATE TABLE IF NOT EXISTS kanban_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coluna_id uuid REFERENCES kanban_colunas(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  tag text,
  posicao integer,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 7. TABLE: configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  n8n_url text,
  n8n_token text,
  evolution_url text,
  evolution_key text,
  evolution_instance text,
  whatsapp_number text,
  google_calendar_id text,
  google_service_email text,
  auto_messages bool DEFAULT false,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 8. TABLE: templates_mensagem
CREATE TABLE IF NOT EXISTS templates_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger text NOT NULL,
  titulo text NOT NULL,
  corpo text NOT NULL,
  ativo bool DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

-- 9. TABLE: notification_log
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  trigger text NOT NULL,
  canal text,
  status text,
  resposta jsonb,
  criado_em timestamptz DEFAULT now()
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_atendimentos_paciente_id ON atendimentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON atendimentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_interacoes_paciente_id ON interacoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_telefone ON pacientes(telefone);
CREATE INDEX IF NOT EXISTS idx_pacientes_whatsapp ON pacientes(whatsapp);
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_coluna ON kanban_cards(coluna_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_paciente ON kanban_cards(paciente_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_paciente ON notification_log(paciente_id);

-- ============================================
-- Trigger: atualizado_em automático
-- ============================================
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pacientes_atualizado_em
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER atendimentos_atualizado_em
  BEFORE UPDATE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER kanban_cards_atualizado_em
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER configuracoes_atualizado_em
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_colunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados podem ler tudo
CREATE POLICY "Usuários autenticados podem ler usuarios"
  ON usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir usuarios"
  ON usuarios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler pacientes"
  ON pacientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir pacientes"
  ON pacientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar pacientes"
  ON pacientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar pacientes"
  ON pacientes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ler atendimentos"
  ON atendimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir atendimentos"
  ON atendimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar atendimentos"
  ON atendimentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar atendimentos"
  ON atendimentos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ler interacoes"
  ON interacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir interacoes"
  ON interacoes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ler kanban_colunas"
  ON kanban_colunas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir kanban_colunas"
  ON kanban_colunas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar kanban_colunas"
  ON kanban_colunas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ler kanban_cards"
  ON kanban_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir kanban_cards"
  ON kanban_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar kanban_cards"
  ON kanban_cards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar kanban_cards"
  ON kanban_cards FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ler configuracoes"
  ON configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem atualizar configuracoes"
  ON configuracoes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ler templates_mensagem"
  ON templates_mensagem FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir templates_mensagem"
  ON templates_mensagem FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar templates_mensagem"
  ON templates_mensagem FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem ler notification_log"
  ON notification_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem inserir notification_log"
  ON notification_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- Inserir colunas padrão do Kanban
-- ============================================
INSERT INTO kanban_colunas (titulo, cor, posicao) VALUES
  ('📥 Lead', 'bg-yellow-100 border-yellow-400 text-yellow-800', 1),
  ('📅 Agendado', 'bg-blue-100 border-blue-400 text-blue-800', 2),
  ('✅ Realizado', 'bg-green-100 border-green-400 text-green-800', 3),
  ('🔄 Retorno', 'bg-purple-100 border-purple-400 text-purple-800', 4),
  ('❌ Inativo', 'bg-gray-100 border-gray-400 text-gray-800', 5)
ON CONFLICT DO NOTHING;

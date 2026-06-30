CREATE TABLE pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  responsavel text,
  data_nascimento date,
  whatsapp text,
  email text,
  cpf text UNIQUE,
  pedido_medico text DEFAULT 'nao',
  pedido_file text,
  observacoes text,
  status text DEFAULT 'lead',
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE TABLE atendimentos (
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

CREATE TABLE interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descricao text NOT NULL,
  canal text NOT NULL DEFAULT 'whatsapp',
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_pacientes" ON pacientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_pacientes" ON pacientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_pacientes" ON pacientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "select_atendimentos" ON atendimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_atendimentos" ON atendimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_atendimentos" ON atendimentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "select_interacoes" ON interacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_interacoes" ON interacoes FOR INSERT TO authenticated WITH CHECK (true);

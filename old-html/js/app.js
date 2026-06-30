/* ─── Supabase client ─────────────────────────────────────────── */
const SUPABASE_URL = 'https://icdudetpnswghgnmjqwx.sb.co';
const SUPABASE_ANON_KEY = 'REDACTED_ANON_KEY';
const sb = sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─── Auth ────────────────────────────────────────────────────── */
async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

async function getSession() {
  const { data: { session }, error } = await sb.auth.getSession();
  if (error) throw error;
  return session;
}

/* ─── Router (simple hash-based SPA) ──────────────────────────── */
function navigateTo(path) {
  window.location.href = path;
}

function requireAuth() {
  getSession().then(session => {
    if (!session) navigateTo('/login.html');
  }).catch(() => navigateTo('/login.html'));
}

/* ─── API helpers ─────────────────────────────────────────────── */
async function fetchPacientes(search = '', status = '') {
  let query = sb.from('clientes').select('*');
  if (search) query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('nome');
  if (error) throw error;
  return data || [];
}

async function fetchPaciente(id) {
  const { data, error } = await sb.from('clientes').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function fetchConsultas(pacienteId = null) {
  let query = sb.from('consultas').select('*, clientes(nome, telefone)').order('data', { ascending: true });
  if (pacienteId) query = query.eq('paciente_id', pacienteId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchConsultasHoje() {
  const hoje = new Date().toISOString().split('T')[0];
  const { data, error } = await sb.from('consultas')
    .select('*, clientes(nome, telefone)')
    .gte('data', `${hoje}T00:00:00`)
    .lt('data', `${hoje}T23:59:59`)
    .order('data');
  if (error) throw error;
  return data || [];
}

async function fetchKPIs() {
  const hoje = new Date().toISOString().split('T')[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const inicioSemana = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [totalPacientes, consultasHoje, faturamentoMes, novosLeads] = await Promise.all([
    sb.from('clientes').select('id', { count: 'exact', head: true }),
    sb.from('consultas').select('id', { count: 'exact', head: true })
      .gte('data', `${hoje}T00:00:00`).lt('data', `${hoje}T23:59:59`),
    sb.from('consultas').select('valor').gte('data', inicioMes),
    sb.from('clientes').select('id', { count: 'exact', head: true })
      .gte('created_at', inicioSemana),
  ]);

  const fatTotal = (faturamentoMes.data || []).reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);

  return {
    totalPacientes: totalPacientes.count || 0,
    consultasHoje: consultasHoje.count || 0,
    faturamentoMes: fatTotal,
    novosLeads: novosLeads.count || 0,
  };
}

async function fetchAgendamentosPorDia() {
  const { data, error } = await sb.from('consultas')
    .select('data, valor')
    .gte('data', new Date(Date.now() - 30 * 86400000).toISOString());
  if (error) return [];
  const agrupar = {};
  (data || []).forEach(r => {
    const dia = r.data.split('T')[0];
    agrupar[dia] = (agrupar[dia] || 0) + 1;
  });
  return Object.entries(agrupar).sort(([a], [b]) => a.localeCompare(b)).map(([dia, count]) => ({ dia, count }));
}

async function fetchExamesPorTipo() {
  const { data, error } = await sb.from('consultas').select('exame');
  if (error) return [];
  const agrupar = {};
  (data || []).forEach(r => {
    const exame = r.exame || 'Não informado';
    agrupar[exame] = (agrupar[exame] || 0) + 1;
  });
  return Object.entries(agrupar).map(([exame, count]) => ({ exame, count }));
}

async function fetchAtividadesRecentes() {
  const { data, error } = await sb.from('consultas')
    .select('*, clientes(nome)')
    .order('data', { ascending: false })
    .limit(10);
  if (error) return [];
  return data || [];
}

async function upsertPaciente(paciente) {
  const { data, error } = await sb.from('clientes').upsert(paciente).select().single();
  if (error) throw error;
  return data;
}

async function upsertConsulta(consulta) {
  const { data, error } = await sb.from('consultas').upsert(consulta).select().single();
  if (error) throw error;
  return data;
}

async function updatePacienteStatus(id, status) {
  const { error } = await sb.from('clientes').update({ status }).eq('id', id);
  if (error) throw error;
}

/* ─── CSS compartilhado (injetado via <link>) ─────────────────── */
const CSS_TOKENS = `
:root {
  --bg: #09090B;
  --surface: #18181B;
  --surface-2: #27272A;
  --fg: #FAFAFA;
  --fg-2: #A1A1AA;
  --muted: #71717A;
  --border: #27272A;
  --border-soft: #18181B;
  --accent: #0C5CAB;
  --accent-on: #FFFFFF;
  --accent-hover: #0A4A8A;
  --accent-soft: rgba(12, 92, 171, 0.15);
  --success: #10B981;
  --warn: #F59E0B;
  --danger: #EF4444;
  --font-display: 'IBM Plex Sans', system-ui, sans-serif;
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 17px;
  --text-xl: 22px;
  --text-2xl: 30px;
  --text-3xl: 42px;
  --text-4xl: 56px;
  --leading-body: 1.48;
  --leading-tight: 1.1;
  --tracking-display: -0.015em;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 9999px;
  --elev-flat: none;
  --elev-ring: 0 0 0 1px var(--border);
  --elev-raised: 0 18px 46px rgba(0,0,0,0.4);
  --focus-ring: 0 0 0 4px rgba(12, 92, 171, 0.22);
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --container-max: 1280px;
  --container-gutter-desktop: 36px;
  --container-gutter-tablet: 24px;
  --container-gutter-phone: 16px;
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
button { font: inherit; cursor: pointer; }
img, svg { display: block; max-width: 100%; }
h1, h2, h3, h4 { margin: 0; font-family: var(--font-display); letter-spacing: var(--tracking-display); }
input, select, textarea {
  font: inherit;
  background: var(--surface-2);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: var(--text-sm);
  transition: border-color var(--motion-fast) var(--ease-standard);
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}
::placeholder { color: var(--muted); }
`;

/* ─── Injetar CSS global ─────────────────────────────────────── */
(function injectGlobalCSS() {
  if (document.getElementById('fono-crm-css')) return;
  const style = document.createElement('style');
  style.id = 'fono-crm-css';
  style.textContent = CSS_TOKENS;
  document.head.appendChild(style);
})();

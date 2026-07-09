# Instrucoes para o n8n — Apos atualizacao do CRM

> Estas sao as acoes que precisam ser feitas manualmente no n8n apos o deploy do CRM atualizado.

---

## A. Reestruturar o fluxo de agendamento (CRITICO)

### Problema
O no "Salvar Paciente" tem o body vazio, fazendo o INSERT no Supabase falhar. Como os nos downstream ("Webhook CRM Paciente" e "Salvar Agendamento") estao conectados a saida deste no, **o fluxo inteiro de agendamento esta quebrado**.

### Solucao
Remover os nos diretos do Supabase e usar apenas os webhooks do CRM.

### Passo a passo

1. **Deletar os nos:**
   - "Salvar Paciente" (HTTP Request POST direto Supabase)
   - "Salvar Agendamento" (HTTP Request POST direto Supabase)

2. **Reconectar o fluxo:**
   - Saida do "Extrair Dados Agendamento" → entrada do "Webhook CRM Paciente"
   - Saida do "Webhook CRM Paciente" → entrada do "Webhook CRM Agendamento"

3. **Fluxo final:**
   ```
   Extrair Dados Agendamento
     → Webhook CRM Paciente (POST /api/webhook/novo-paciente)
         → Webhook CRM Agendamento (POST /api/webhook/agendamento)
   ```

---

## B. Ajustar paciente_id no "Webhook CRM Agendamento"

### Problema
O no "Webhook CRM Agendamento" precisa do `paciente_id` que foi retornado pelo "Webhook CRM Paciente".

### Solucao
No no "Webhook CRM Agendamento", alterar o valor do parametro `paciente_id` para:

```
={{ $json.data.id }}
```

Isto pega o `id` do paciente que foi retornado pelo webhook anterior.

---

## C. Adicionar timezone a data_agendamento (CRITICO)

### Problema
O no "Webhook CRM Agendamento" construi a data assim:
```
={{ $json.atendimento.data }}T{{ $json.atendimento.horario }}:00
```
Isso gera `2026-07-25T09:00:00` **sem sufixo de timezone**. O Postgres interpreta como UTC, fazendo o horario ficar 3 horas atrasado.

### Solucao
Adicionar `-03:00` (timezone de Sao Paulo) ao final:

```
={{ $json.atendimento.data }}T{{ $json.atendimento.horario }}:00-03:00
```

---

## D. Adicionar header X-Webhook-Token nos webhooks

### Problema
O CRM agora exige autenticacao nos webhooks. Sem o header, os webhooks retornam 401 Unauthorized.

### Solucao
Em CADA no de webhook ("Webhook CRM Paciente", "Webhook CRM Agendamento", e qualquer outro que chame `/api/webhook/*` ou `/api/pedido-pdf`):

1. Abrir o no
2. Em "Send Headers" → ja esta ativo
3. Adicionar um novo header:
   - **Nome:** `X-Webhook-Token`
   - **Valor:** `libertad_webhook_2026_sec`

> **Importante:** O valor `libertad_webhook_2026_sec` esta definido no `.env.local` do CRM como `WEBHOOK_SECRET`. Na Vercel, adicionar a env var `WEBHOOK_SECRET=libertad_webhook_2026_sec` nas configuracoes do projeto.

---

## E. Configurar env vars na Vercel

Acessar https://vercel.com → projeto fono-crm → Settings → Environment Variables e adicionar:

| Variavel | Valor |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://fono-crm.vercel.app` |
| `SUPABASE_SERVICE_ROLE_KEY` | (pegar no Supabase: Settings → API → service_role key) |
| `WEBHOOK_SECRET` | `libertad_webhook_2026_sec` |

> Apos adicionar, fazer um novo deploy (redploy) para as variaveis terem efeito.

---

## F. Tornar bucket "pedidos-medicos" privado no Supabase

1. Acessar https://supabase.com → projeto nqimgdchhvgogyrbezae
2. Storage → Buckets → `pedidos-medicos`
3. Desativar "Public bucket" (tornar privado)

> O codigo do CRM ja foi atualizado para usar `createSignedUrl()` (URL temporaria de 1h) em vez de `getPublicUrl()`.

---

## G. Gerar nova API key do n8n

A API key atual pode estar exposta no historico do git. Gerar uma nova:

1. Acessar https://n8n.conectai.online → Settings → API
2. Revogar a key antiga
3. Gerar nova key
4. Atualizar no opencode se necessario

---

## Resumo da ordem de acao

1. **Deploy do CRM** na Vercel (com as novas env vars configuradas)
2. **Tornar bucket privado** no Supabase
3. **Editar workflow no n8n:** itens A, B, C, D
4. **Testar fluxo completo:** enviar mensagem no WhatsApp, agendar exame, verificar se paciente + agendamento aparecem no CRM e no Google Calendar
5. **Gerar nova API key** do n8n (item E)

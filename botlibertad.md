# BotLibertad

## Sobre o Projeto

Bot de WhatsApp para agendamento de exames na clínica de Fonoaudiologia da Dra. Libertad Ramirez. O paciente interage via menu numérico para escolher exame, ver valor, enviar dados pessoais + foto do pedido médico (opcional), escolher data/horário via Google Agenda e receber confirmação — tudo automatizado no n8n com Evolution API.

---

## Regras para o Assistente

- **Ao ler este arquivo**, carregue **todas as skills** da pasta `C:\Users\User\Desktop\OpenCode\n8n` antes de qualquer ação no n8n.
- Skills disponíveis: `n8n-agents`, `n8n-binary-and-data`, `n8n-code-javascript`, `n8n-code-nodes`, `n8n-code-python`, `n8n-connections`, `n8n-credentials-and-security`, `n8n-data-tables`, `n8n-debugging`, `n8n-error-handling`, `n8n-expression-syntax`, `n8n-expressions`, `n8n-extending-mcp`, `n8n-loops`, `n8n-mcp-tools-expert`, `n8n-node-configuration`, `n8n-subworkflows`, `n8n-validation-expert`, `n8n-workflow-lifecycle`, `n8n-workflow-patterns`, `using-n8n-skills`.
- Siga o protocolo descrito em `using-n8n-skills/SKILL.md`: invocar a skill relevante antes de cada ação no n8n.

---

## Credenciais e Acessos

| Serviço | Dados |
|---------|-------|
| **n8n** | `https://n8n.conectai.online/` — evertoncalefi@gmail.com |
| **Google OAuth (Sheets + Calendar)** | Client ID: `197439906871-jd91jvhj71i8ocj8lg8i4d160eqsk6sn.apps.googleusercontent.com` |
| **Google Redirect URI** | `https://n8n.conectai.online/rest/oauth2-credential/callback` |
| **Evolution API** | URL: `https://evolution.conectai.online` / API Key: `101173e5fa119c635ac17aba4ae17f52` / Instância: `bot-kaique` |
| **E-mail testes Google** | kaiquecalefi@gmail.com |
| **E-mail clínica (futuro)** | A definir pela Dra. Libertad |
| **WhatsApp notificação clínica** | 98455.7113 |

---

## Lista de Exames e Valores

| # | Exame | Valor | Observação |
|---|-------|-------|------------|
| 1 | Audiometria | R$ 100,00 | |
| 2 | Imitanciometria | R$ 100,00 | |
| 3 | PAC — Processamento Auditivo Central | R$ 287,00 | |
| 4 | P300 | R$ 267,00 | |
| 5 | BERA | R$ 287,00 | |
| 6 | Otoemissões Acústicas | R$ 240,00 | |
| 7 | Avaliação Neuropsicológica (TDAH/TEA/QI) | R$ 1.437,00 | Até 6x. 1º Anamnese, 2º Aplicação testes. ~6 encontros |
| 8 | Aparelho Auditivo | — | Marcar consulta para entender necessidade |
| 9 | TAAC — Treinamento Auditivo em Cabine | R$ 437,00 (4 sessões) / R$ 957,00 (10 sessões) | |
| 10 | Outros Assuntos | — | Categoria de contato. Bot pergunta o assunto e notifica clínica |

**Pagamento:** Só particular (não aceita convênios).

---

## Fluxo Completo do Bot

```
Paciente envia "Olá" no WhatsApp
    │
    ▼
[1] Boas-vindas + menu com 10 opções numeradas
    │
    ├── 1 a 7, 9 → mostra valor do exame
    │   └── pergunta: "Deseja enviar foto do pedido médico? (S/N)"
    │       ├── S → aguarda imagem → salva como link
    │       └── N → segue
    │   └── coleta dados:
    │       ├── Nome do paciente
    │       ├── Nome do responsável
    │       └── Data de nascimento
    │   └── mostra resumo dos dados
    │   └── "Recebemos seus dados! Agora escolha o melhor horário:"
    │   └── [Google Calendar] → busca próximos dias disponíveis
    │       └── mostra menu de datas (várias opções)
    │           └── paciente escolhe a data
    │               └── [Google Calendar] → busca horários livres na data
    │                   └── mostra menu de horários
    │                       └── paciente escolhe o horário
    │                           └── mostra resumo completo:
    │                               ├── Exame: Audiometria
    │                               ├── Valor: R$ 100,00
    │                               ├── Data: 29/06/2026
    │                               ├── Horário: 09:00
    │                               ├── Endereço: QNL 01 conjunto A casa 18, Taguatinga Norte
    │                               └── Digite 1: Confirmar / 2: Voltar / 3: Cancelar
    │                                   ├── 1 → [Google Calendar] cria evento
    │                                   │   → [Google Sheets] salva paciente
    │                                   │   → envia card de confirmação com endereço + maps
    │                                   │   → notifica clínica no WhatsApp (98455.7113)
    │                                   ├── 2 → volta ao menu inicial
    │                                   └── 3 → "Agendamento cancelado"
    │
    ├── 8 (Aparelho Auditivo) → "Vamos marcar uma consulta para entender sua necessidade"
    │   └── coleta dados → Google Calendar → mesma sequência acima
    │
    └── 10 (Outros Assuntos) → "Sobre o que gostaria de falar?"
        └── paciente digita o assunto
            └── notifica clínica: "Paciente X perguntou sobre: [assunto]"
            └── "Recebemos sua mensagem. Se quiser agendar um exame, digite o número dele."
            └── bot não responde mais mensagens desse paciente (só clínica responde)
```

---

## Estrutura de Dados

### Data Table: `sessoes` (controle de estado da conversa)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `telefone` | string | Número do paciente (identificador único) |
| `estado` | string | `inicio`, `aguardando_exame`, `aguardando_foto`, `aguardando_nome_paciente`, `aguardando_nome_responsavel`, `aguardando_data_nasc`, `aguardando_data`, `aguardando_hora`, `aguardando_confirmacao`, `aguardando_outros_assuntos`, `finalizado` |
| `exame_escolhido` | string | Nome do exame selecionado |
| `valor_exame` | number | Valor do exame |
| `nome_paciente` | string | Nome do paciente |
| `nome_responsavel` | string | Nome do responsável |
| `data_nascimento` | string | Data de nascimento |
| `foto_pedido_url` | string | Link da foto do pedido médico |
| `data_escolhida` | string | Data ISO selecionada |
| `hora_escolhida` | string | Horário selecionado |
| `assunto_outros` | string | Assunto digitado (exame 10) |
| `ultima_interacao` | timestamp | Atualizado a cada mensagem (timeout 30min) |

### Data Table: `exames` (catálogo de exames)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `numero` | number | Número do exame (1-10) |
| `nome` | string | Nome do exame |
| `valor` | number | Valor (0 para sem valor fixo) |
| `descricao` | string | Observações (parcelas, sessões, etc.) |
| `tipo` | string | `exame`, `consulta`, `contato` |

### Google Sheets: Planilha de Pacientes (CRM)

| Coluna | Exemplo |
|--------|---------|
| Nome Paciente | Maria Silva |
| Nome Responsável | João Silva |
| Data Nascimento | 15/03/1990 |
| Telefone | 61984557113 |
| Exame | Audiometria |
| Valor | R$ 100,00 |
| Foto Pedido Médico | (link) |
| Data Agendamento | 29/06/2026 |
| Horário | 09:00 |
| Status | Confirmado |

---

## Arquitetura do n8n

### Workflows

```
📁 BotLibertad/
├── 🏗️ Main: Bot Agendamento (workflow principal — orquestrador)
├── ❌ Error Handler (workflow de erro global)
├── 📦 Sub: Gerenciar Sessão (lê/atualiza estado da conversa)
├── 📦 Sub: Validar Entrada (valida número digitado)
├── 📦 Sub: Enviar WhatsApp (centraliza envio via Evolution API)
├── 📦 Sub: Buscar Horários (consulta Google Calendar + formata menu)
├── 📦 Sub: Coletar Dados Paciente (pergunta nome, responsável, data nasc, foto)
├── 📦 Sub: Confirmar & Agendar (cria evento Calendar + salva na planilha + notifica)
├── 📦 Sub: Processar Aparelho Auditivo (fluxo especial exame 8)
├── 📦 Sub: Processar Outros Assuntos (pergunta assunto + notifica clínica)
└── 📦 Sub: Notificar Clínica (envia alerta WhatsApp para 98455.7113)
```

### Nós Essenciais

| Nó | Função |
|----|--------|
| **Webhook** | Receber mensagens do WhatsApp (Evolution) |
| **Data Table** | Ler/atualizar estado da sessão e catálogo de exames |
| **Switch** | Rotear fluxo baseado no `estado` da sessão |
| **IF** | Validações (entrada válida/inválida, sessão expirada) |
| **Set (Edit Fields)** | Montar mensagens de resposta com expressões |
| **Google Calendar** | Buscar horários disponíveis e criar eventos |
| **Google Sheets** | Salvar dados do paciente (CRM) |
| **HTTP Request** | Enviar mensagens via Evolution API |
| **Execute Workflow** | Chamar sub-workflows |
| **Respond to Webhook** | Responder ao Evolution API |

---

## Tratamento de Erros

Todo nó de rede (HTTP Request, Google Calendar, Data Table, Google Sheets) DEVE ter:

1. `retryOnFail: true, maxTries: 3, waitBetweenTries: 5000`
2. Error output (`output(1)`) com `onError: 'continueErrorOutput'`
3. Mensagem amigável para o paciente em caso de falha

---

## Google Cloud — Guia de Configuração

### 1. Criar Projeto
- https://console.cloud.google.com → Novo Projeto → Nome: `botlibertad`

### 2. Ativar APIs
- Google Calendar API
- Google Sheets API
- Google Drive API

### 3. Tela de Consentimento OAuth
- Tipo: Externo
- Nome app: `BotLibertad`
- E-mail suporte: `kaiquecalefi@gmail.com`
- E-mail desenvolvedor: `kaiquecalefi@gmail.com`
- Usuários de teste: `kaiquecalefi@gmail.com`

### 4. Credencial OAuth
- Tipo: Aplicativo de Desktop
- Nome: `n8n-botlibertad`
- URI de redirecionamento: `https://n8n.conectai.online/rest/oauth2-credential/callback`

### 5. No n8n
- Criar credencial Google Sheets (OAuth2) — mesma credencial serve para Calendar

---

## Endereço da Clínica

**QNL 01 conjunto A casa 18, Taguatinga Norte**
📍 https://maps.app.goo.gl/Lpkn6J8Jht8fYhCu9

---

## Mensagens do Bot

### Boas-vindas
> Olá! Seja bem-vindo(a) ao consultório de Fonoaudiologia da Dra. Libertad Ramirez.
>
> Como podemos te ajudar hoje? Por favor, digite o número do exame ou serviço desejado:
>
> 1 — Audiometria — R$ 100,00
> 2 — Imitanciometria — R$ 100,00
> 3 — PAC (Processamento Auditivo Central) — R$ 287,00
> 4 — P300 — R$ 267,00
> 5 — BERA — R$ 287,00
> 6 — Otoemissões Acústicas — R$ 240,00
> 7 — Avaliação Neuropsicológica (TDAH, TEA, QI) — R$ 1.437,00
> 8 — Aparelho Auditivo
> 9 — TAAC (Treinamento Auditivo em Cabine) — a partir de R$ 437,00
> 10 — Outros Assuntos

### Card de Confirmação
> Prezado(a) paciente, [NOME]
> Seu agendamento foi confirmado!
>
> 📅 Data: [DATA]
> 🕒 Horário: [HORA]
> 🩺 Exame: [EXAME]
>
> 📍 Endereço: QNL 01 conjunto A casa 18, Taguatinga Norte
> 🔗 Localização: https://maps.app.goo.gl/Lpkn6J8Jht8fYhCu9
>
> Próximo do dia da consulta, enviaremos um lembrete para você!

### Outros Assuntos (após paciente digitar)
> Recebemos sua mensagem! Se quiser agendar um exame, digite o número dele que mostro os valores e horários disponíveis.

---

## Sessão 1 — 25/06/2026

### O que foi feito

- Criação do projeto BotLibertad e deste arquivo de registro.
- Definição completa dos 10 exames com valores e regras de negócio.
- Mapeamento do fluxo completo baseado no modelo Clínica Alexim (URA por menu numérico).
- Definição da arquitetura: 1 workflow principal + 8 sub-workflows.
- Escolha de n8n Data Tables para estado da sessão + Google Sheets como CRM.
- Configuração do Google Cloud (OAuth, APIs, redirect URI).
- Configuração das credenciais no n8n (Google Sheets + Google Calendar).
- Definição da Evolution API como gateway WhatsApp.
- Estrutura de tratamento de erros em todo nó falível.
- Definição das tabelas, colunas e tipos de dados.

### Próximos passos

1. Criar Data Tables no n8n: `sessoes` e `exames`
2. Criar Google Sheets (planilha de pacientes)
3. Construir `Sub: Gerenciar Sessão`
4. Construir `Sub: Validar Entrada`
5. Construir `Sub: Enviar WhatsApp` (Evolution API)
6. Construir `Sub: Coletar Dados Paciente`
7. Construir `Sub: Buscar Horários` (Google Calendar)
8. Construir `Sub: Confirmar & Agendar`
9. Construir `Sub: Processar Aparelho Auditivo`
10. Construir `Sub: Processar Outros Assuntos`
11. Construir `Sub: Notificar Clínica`
12. Construir `Main: Bot Agendamento` (workflow principal)
13. Configurar tratamento de erros
14. Testar fluxo completo com Evolution API
15. Publicar e configurar webhook

---

## Notas Gerais

| Item | Descrição |
|------|-----------|
| Stack | n8n self-hosted Community Edition (gratuito) |
| URL n8n | https://n8n.conectai.online/ |
| Gateway WhatsApp | Evolution API (instância: bot-kaique) |
| Armazenamento estado | n8n Data Tables (gratuito) |
| CRM pacientes | Google Sheets |
| Agenda | Google Calendar |
| Data Tables | Gratuito no self-hosted |

---

## 📁 Projetos Relacionados

### CRM Web (Next.js + Supabase)

| Info | Localização |
|------|-------------|
| **Documentação** | `C:\Users\User\Desktop\OpenCode\n8n\crm.md` |
| **Código do projeto** | `C:\Users\User\Desktop\OpenCode\n8n-botlibertad\` |
| **Skills de design** | `C:\Users\User\Desktop\OpenCode\n8n-botlibertad\skilscrm\` |
| **URL online** | https://n8n-botlibertad.vercel.app |
| **Login** | calefikaique@gmail.com |
| **Supabase** | https://supabase.com (projeto: botlibertad-crm) |
| **GitHub** | https://github.com/Kaique-959/botlibertad-crm |

> Para acessar o CRM, leia o arquivo `crm.md` na mesma pasta. Lá estão todas as credenciais, design system, webhooks e histórico completo do projeto.

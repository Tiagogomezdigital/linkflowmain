# 📂 project_profile.md — Perfil Técnico do Projeto

Este documento define o **contexto técnico, arquitetural, de regras de negócio e limitações** específicas deste projeto. A IA deve sempre se basear neste documento ao operar neste projeto.

> ⚠️ Este documento é **específico deste projeto** e complementa as regras globais definidas em `user_rules.md`.

---

## 🧾 Identificação do Projeto

- **Nome do projeto**: LinkFlow
- **Descrição geral**: Sistema de redirecionamento inteligente para WhatsApp com rotação automática de números e analytics avançado
- **Objetivo principal**: Gerenciar e rotacionar números de WhatsApp para grupos específicos, registrar cliques e fornecer analytics detalhados
- **Domínio do sistema**: Marketing Digital / Comunicação

---

## ⚙️ Stack Tecnológica

- **Linguagens utilizadas**: TypeScript, JavaScript, SQL
- **Frameworks principais**: 
  - Frontend: Next.js 14 (App Router)
  - UI: React, Tailwind CSS, shadcn/ui
  - Backend: Next.js API Routes
- **Banco de dados**: Supabase (PostgreSQL)
- **Ferramentas de CI/CD**: Vercel
- **Ambiente de nuvem/infraestrutura**: Vercel (hosting), Supabase (database)
- **Serviços externos integrados (APIs, etc)**: 
  - WhatsApp Web API (wa.me)
  - Supabase Auth
  - Analytics próprio

---

## 🏗️ Arquitetura do Sistema

- **Tipo de arquitetura**: Monolito Full-Stack (Next.js)
- **Componentes principais**:
  - [x] Frontend: Next.js App Router com componentes React
  - [x] Backend: API Routes do Next.js
  - [x] Banco de dados: Supabase PostgreSQL
  - [x] Integrações: WhatsApp Web, Supabase Auth

- **Fluxo principal do sistema**:
  1. Usuário acessa link curto `/l/{slug}`
  2. Sistema busca próximo número disponível do grupo
  3. Registra o clique com dados de analytics
  4. Redireciona para WhatsApp com mensagem personalizada
  5. Atualiza `last_used_at` do número para rotação

---

## 🗃️ Banco de Dados

- **Nome do banco e tipo**: Supabase PostgreSQL
- **Schemas importantes**:
  - **Schema `redirect`**: Schema principal do sistema
  - **Schema `public`**: Schema padrão (não utilizado para dados principais)

- **Tabelas importantes**:
  
  **Tabela: `redirect.groups`**
  - Nome: groups
  - Finalidade: Armazenar grupos de redirecionamento
  - Campos principais: id, name, slug, description, default_message, is_active
  - Relacionamentos: 1:N com whatsapp_numbers
  - Observações: Slug é único e usado nas URLs
  
  **Tabela: `redirect.whatsapp_numbers`**
  - Nome: whatsapp_numbers
  - Finalidade: Números de WhatsApp associados aos grupos
  - Campos principais: id, group_id, phone, name, custom_message, is_active, last_used_at
  - Relacionamentos: N:1 com groups, 1:N com clicks
  - Observações: Rotação baseada em last_used_at
  
  **Tabela: `redirect.clicks`**
  - Nome: clicks
  - Finalidade: Registro de todos os cliques/redirecionamentos
  - Campos principais: id, group_id, number_id, ip_address, user_agent, device_type, created_at
  - Relacionamentos: N:1 com groups e whatsapp_numbers
  - Observações: Tabela de analytics, somente inserção

- **Funções importantes**:
  - `get_next_number_for_group(group_slug)`: Retorna próximo número disponível
  - `register_click_v2()`: Registra clique e atualiza last_used_at
  - `get_group_stats()`: Estatísticas de grupos
  - `get_dashboard_stats()`: Estatísticas do dashboard

- **Procedimentos ou regras especiais**:
  - Schema `redirect` é o principal - não confundir com `public`
  - Rotação automática baseada em `last_used_at` (mais antigo primeiro)
  - RLS (Row Level Security) habilitado em todas as tabelas
  - Triggers automáticos para `updated_at`

---

## 🔐 Regras de Segurança / Permissões

- **Restrições de acesso**: 
  - Admin dashboard protegido por Supabase Auth
  - RLS habilitado em todas as tabelas
  - API keys separadas (anon vs service_role)
- **Funções de usuário existentes**: 
  - Usuários autenticados (acesso ao admin)
  - Acesso público (apenas redirecionamentos)
- **Observações de privacidade**: 
  - IPs são registrados para analytics
  - User-agents coletados para estatísticas de dispositivo

---

## 📏 Regras de Negócio

- **Comportamentos esperados**:
  - Um grupo pode ter múltiplos números de WhatsApp
  - Rotação automática: número menos usado recentemente é selecionado
  - Apenas números ativos (`is_active = true`) participam da rotação
  - Mensagem personalizada por número ou mensagem padrão do grupo
  
- **Lógicas importantes**:
  - Slug do grupo deve ser único
  - Redirecionamento sempre atualiza `last_used_at`
  - Analytics registram device_type, browser, OS automaticamente
  
- **Pontos de validação obrigatórios**:
  - Grupo deve existir e estar ativo
  - Pelo menos um número ativo no grupo
  - Formato de telefone válido

---

## 🔄 Regras de Atualização de Documentação

- Sempre que:
  - [x] Criar nova funcionalidade → atualizar esta seção
  - [x] Criar nova tabela → adicionar em Banco de Dados
  - [x] Integrar nova API → documentar aqui
  - [x] Modificar schema do banco → atualizar estrutura
- A IA pode solicitar atualização se perceber ausência de informação.

---

## ⚠️ Restrições técnicas

### 🔒 **Regras por Ambiente**

#### **🟢 Desenvolvimento Local**
- **Ações que EXIGEM autorização prévia**:
  - 🟡 Criar novas tabelas ou schemas
  - 🟡 Alterar estrutura de tabelas existentes
  - 🟡 Modificar funções SQL críticas
  - 🟡 Alterar configurações de RLS
  - 🟡 Modificar middleware de redirecionamento
  - 🟡 Alterar estrutura de APIs críticas
  - 🟡 Alterar lógica de rotação de números
- **Ações permitidas sem autorização**:
  - ✅ Criar arquivos, funções e componentes de frontend
  - ✅ Modificar código que não afete estrutura crítica
  - ✅ Testar funcionalidades em componentes não-críticos
  - ✅ Refatorar código de interface e componentes
  - ✅ Refatorar código de interface e componentes

#### **🟡 Homologação**
- **Ações que EXIGEM autorização prévia**:
  - 🟡 Criar novas tabelas ou schemas
  - 🟡 Alterar estrutura de tabelas existentes
  - 🟡 Modificar funções SQL críticas
  - 🟡 Alterar configurações de RLS
  - 🟡 Modificar middleware de redirecionamento
  - 🟡 Alterar estrutura de APIs críticas
  - 🟡 Modificar lógica de rotação de números

#### **🔴 Produção**
- **Mudanças que exigem autorização**:
  - [x] Alterar schema `redirect` do banco de dados
  - [x] Modificar funções SQL críticas (get_next_number_for_group, register_click_v2)
  - [x] Alterar estrutura de redirecionamento principal
  
- **Componentes que não podem ser tocados sem validação**:
  - Função `get_next_number_for_group` (lógica de rotação)
  - Schema `redirect` (estrutura principal)
  - Middleware de redirecionamento
  - Configurações de RLS

### 📋 **Regra Geral**
> **Em caso de dúvida sobre permissões**: Sempre perguntar antes de executar ações que possam impactar dados ou estruturas existentes em homologação e produção.

---

## 📎 Links úteis

- **Repositório**: Local project
- **Documentação externa**: 
  - Supabase Docs
  - Next.js App Router Docs
  - WhatsApp Business API
- **API docs**: Endpoints em `/app/api/`
- **Ambientes**: 
  - Desenvolvimento: http://localhost:3000
  - se porta tiver ocupada avise e nao suba em outra.
  - Produção: Vercel deployment

---

## 🧠 Observações específicas para a IA

- **CRÍTICO**: Sempre usar schema `redirect`, nunca `public` para dados principais
- **CRÍTICO**: Supabase nao acessa diretamente o `redirect`, nunca `public` para dados principais
- **Rotação**: Lógica baseada em `last_used_at ASC NULLS FIRST`
- **Supabase**: Usar `supabaseAdmin` para operações privilegiadas, `supabasePublic` para leitura
- **URLs**: Formato `/l/{slug}` para redirecionamento público
- **Analytics**: Sempre registrar cliques com dados completos (IP, User-Agent, etc.)
- **Mensagens**: Prioridade: custom_message do número > default_message do grupo
- **Telefones**: Formato internacional com + (ex: +5511999999999)

---

## 📂 Estrutura do Projeto

```
app/
├── admin/           # Dashboard administrativo
├── api/             # API Routes
│   ├── numbers/     # Gestão de números
│   ├── groups/      # Gestão de grupos  
│   ├── redirect/    # Lógica de redirecionamento
│   └── stats/       # Analytics e estatísticas
├── l/[slug]/        # Redirecionamento público
components/          # Componentes React/UI
lib/                 # Utilitários e configurações
├── api/             # Funções de API
├── supabase*.ts     # Configurações Supabase
docs/                # Documentação do projeto
```

---

## 📅 Última atualização

- **Data**: Janeiro 2025
- **Versão**: 1.0
- **Responsável**: Sistema automatizado baseado na análise do código atual
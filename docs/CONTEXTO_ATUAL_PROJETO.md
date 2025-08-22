# Contexto Atual do Projeto LinkFlow

## Visão Geral
O LinkFlow é um sistema de redirecionamento de WhatsApp que gerencia números e grupos para campanhas de marketing. O projeto utiliza Next.js 14, Supabase como banco de dados e está hospedado na Vercel.

## Arquitetura de Dados - IMPORTANTE

### Schemas do Banco de Dados
- **Schema `redirect`**: Contém as tabelas principais com os dados reais
- **Schema `public`**: Contém views que apontam para as tabelas do schema `redirect`
- **Schema `audit_sandbox`**: Contém dados de auditoria

### Tabelas Principais (Schema `redirect`)
1. **`whatsapp_numbers`**: Números de WhatsApp cadastrados (91 registros)
2. **`groups`**: Grupos de números (52 registros)
3. **`clicks`**: Registros de cliques nos links (86.889 registros)
4. **`group_stats`**: Estatísticas dos grupos (view materializada)
5. **`users`**: Usuários do sistema

### Views Criadas (Schema `public`) - CRÍTICO
```sql
-- View para números com informações de grupo
CREATE VIEW public.whatsapp_numbers AS 
SELECT 
    wn.*,
    gs.group_name
FROM redirect.whatsapp_numbers wn
LEFT JOIN redirect.group_stats gs ON wn.group_id = gs.group_id;

-- View para grupos
CREATE VIEW public.groups AS 
SELECT * FROM redirect.group_stats;
```

## APIs Principais

### `/api/numbers`
- **Status**: ✅ Funcionando
- **Retorna**: 91 números com `group_name` incluído
- **Schema**: Usa view `public.whatsapp_numbers`
- **Middleware**: Rota pública para chamadas internas

### `/api/groups`
- **Status**: ✅ Funcionando
- **Retorna**: Todos os grupos com estatísticas
- **Schema**: Usa view `public.groups`
- **Middleware**: Rota pública para chamadas internas

## Frontend - Página `/admin/numeros`

### Componente Principal
- **Arquivo**: `app/admin/numeros/NumbersPageClient.tsx`
- **Status**: ✅ Funcionando
- **Correção Aplicada**: Usa `number.group_name` em vez de `number.groups?.name`

### Estrutura de Dados no Frontend
```typescript
interface WhatsAppNumber {
  id: string;
  number: string;
  group_id: string;
  group_name: string; // ← Campo correto após correções
  is_active: boolean;
  // ... outros campos
}
```

## Middleware de Autenticação

### Rotas Públicas
```typescript
const publicApiRoutes = [
  '/api/redirect',
  '/api/clicks',
  '/api/numbers',  // ← Adicionado para chamadas internas
  '/api/groups'    // ← Adicionado para chamadas internas
];
```

## Problemas Resolvidos Recentemente

### 1. Erro de Schema Supabase
- **Problema**: Supabase só permite acesso aos schemas `public` e `graphql_public`
- **Solução**: Criadas views no schema `public` que apontam para tabelas do `redirect`

### 2. Middleware Bloqueando APIs
- **Problema**: APIs `/api/numbers` e `/api/groups` eram bloqueadas para chamadas internas
- **Solução**: Adicionadas como rotas públicas no middleware

### 3. Frontend Não Exibindo Group Names
- **Problema**: Código tentava acessar `number.groups?.name` (estrutura inexistente)
- **Solução**: Alterado para `number.group_name` (campo retornado pela view)

## Comandos de Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Testar APIs
curl http://localhost:3000/api/numbers | jq
curl http://localhost:3000/api/groups | jq
```

## URLs Importantes
- **Admin Dashboard**: http://localhost:3000/admin
- **Página de Números**: http://localhost:3000/admin/numeros
- **API Numbers**: http://localhost:3000/api/numbers
- **API Groups**: http://localhost:3000/api/groups

## Considerações para Futuras Modificações

1. **NUNCA** acesse diretamente o schema `redirect` via Supabase client
2. **SEMPRE** use as views do schema `public`
3. **MANTENHA** as rotas de API como públicas no middleware para chamadas internas
4. **TESTE** sempre as APIs após modificações usando curl
5. **VERIFIQUE** se o frontend está usando os campos corretos retornados pelas APIs

## Status Atual: ✅ SISTEMA FUNCIONANDO
- ✅ APIs retornando dados corretamente
- ✅ Frontend exibindo informações completas
- ✅ Middleware configurado adequadamente
- ✅ Views do banco criadas e funcionais

---
*Última atualização: 21/08/2025*
*Todas as funcionalidades principais estão operacionais*
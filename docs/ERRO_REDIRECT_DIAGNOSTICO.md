# 🚨 Diagnóstico do Erro de Redirecionamento

## Problema Identificado

Quando os usuários clicam nos links de redirecionamento, eles são direcionados para a página de erro (`/error`) em vez de serem redirecionados para o WhatsApp.

## Causa Raiz

**Erro 403 (Forbidden) na função `get_next_number`**

Os logs do Supabase mostram múltiplas tentativas de chamada da função RPC `get_next_number` retornando status 403:

```
POST | 403 | /rest/v1/rpc/get_next_number | node
```

### Análise Técnica

1. **Função RPC**: A função `get_next_number` existe e está funcionando corretamente quando testada diretamente
2. **Permissões**: As permissões da função estão configuradas corretamente para `anon`, `authenticated` e `service_role`
3. **Problema**: A variável `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.example` está usando a chave anônima em vez da chave de service role real

## Configuração Atual (Incorreta)

```env
# Está usando a chave anônima (limitada)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbnFodW9vcnNkcnVkdnBiemFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTI1MDksImV4cCI6MjA2ODE4ODUwOX0.CHykLYD4LEhUVdTsElKzzig1bL5Obcy-doMycAYlRWw
```

## Solução Necessária

### 1. Obter a Chave de Service Role Real

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá para o projeto: `sgnqhuoorsdrudvpbzan`
3. Navegue para **Settings** → **API**
4. Copie a **service_role key** (não a anon key)

### 2. Atualizar Variáveis de Ambiente

**No ambiente de produção (Vercel):**
1. Acesse o dashboard da Vercel
2. Vá para o projeto LinkFlow
3. Settings → Environment Variables
4. Atualize `SUPABASE_SERVICE_ROLE_KEY` com a chave real
5. Redeploy a aplicação

**No ambiente local:**
1. Crie um arquivo `.env.local`
2. Adicione a chave real:
```env
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_real_aqui
```

## Fluxo do Erro

```mermaid
graph TD
    A[Usuário clica no link] --> B[/api/redirect/[slug]]
    B --> C[getNextNumber()]
    C --> D[/api/numbers/next]
    D --> E[supabase.rpc('get_next_number')]
    E --> F{Chave válida?}
    F -->|Não| G[403 Forbidden]
    F -->|Sim| H[Retorna número]
    G --> I[Redirect para /error]
    H --> J[Redirect para WhatsApp]
```

## Verificação Pós-Correção

Após atualizar a chave, teste:

1. **Teste direto da API:**
```bash
curl https://whatsapp.aescoladenegocios.com.br/api/numbers/next?groupSlug=tiago-santineli
```

2. **Teste do redirecionamento:**
```bash
curl -I https://whatsapp.aescoladenegocios.com.br/api/redirect/tiago-santineli
```

3. **Verificar logs do Supabase:**
   - Não deve mais aparecer erros 403
   - Deve mostrar status 200 para as chamadas RPC

## Status das Correções

- ✅ **Função RPC**: `get_next_number` está correta e funcionando
- ✅ **Permissões**: RLS configurado corretamente
- ✅ **Código da API**: Usando a função correta
- ❌ **Chave de Service Role**: Precisa ser atualizada

## Impacto

**Antes da correção:**
- Todos os links de redirecionamento falham
- Usuários são direcionados para página de erro
- Perda de conversões

**Após a correção:**
- Links funcionarão normalmente
- Redirecionamento para WhatsApp funcionará
- Round robin de números funcionará corretamente

---

**Data do diagnóstico:** 29/01/2025  
**Prioridade:** 🔴 CRÍTICA - Afeta funcionalidade principal da aplicação
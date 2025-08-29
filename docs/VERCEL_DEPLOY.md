# Deploy na Vercel - Guia Completo

## Visão Geral

Este guia detalha o processo completo de deploy do LinkFlow na Vercel, incluindo configurações específicas, variáveis de ambiente e otimizações.

## Pré-requisitos

- ✅ Conta na [Vercel](https://vercel.com)
- ✅ Projeto Supabase configurado e funcionando
- ✅ Repositório GitHub com o código atualizado
- ✅ Variáveis de ambiente definidas

## Configurações Automáticas

O projeto já está configurado com:

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "headers": [...], // Headers de segurança
  "functions": {
    "app/l/[slug]/route.ts": { "maxDuration": 10 },
    "app/api/redirect/[slug]/route.ts": { "maxDuration": 10 }
  }
}
```

### next.config.mjs
- ESLint ignorado durante builds
- TypeScript errors ignorados
- Imagens não otimizadas (para compatibilidade)
- Headers de segurança configurados

## Variáveis de Ambiente

### Obrigatórias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Site
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# JWT
JWT_SECRET=your-secure-random-string

# Environment
NODE_ENV=production
```

### Como Configurar na Vercel

1. Acesse o dashboard do projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:
   - **Name**: Nome da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Selecione `Production`, `Preview`, e `Development`

## Processo de Deploy

### 1. Conectar Repositório

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Importe o repositório do GitHub
4. Selecione o repositório `linkflowmain`

### 2. Configuração Automática

A Vercel detectará automaticamente:
- ✅ Framework: Next.js
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `.next`
- ✅ Install Command: `npm install`

### 3. Configurar Variáveis

Antes do primeiro deploy, configure todas as variáveis de ambiente listadas acima.

### 4. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (geralmente 2-5 minutos)
3. Verifique se não há erros no log

## Verificações Pós-Deploy

### 1. Funcionalidades Básicas
- [ ] Página inicial carrega corretamente
- [ ] Sistema de autenticação funciona
- [ ] Dashboard administrativo acessível
- [ ] Redirecionamento de links funciona

### 2. Sistema Round Robin
- [ ] API `/api/numbers/next` responde corretamente
- [ ] Números são distribuídos em sequência
- [ ] Reset automático após último número

### 3. Autenticação
- [ ] Login/logout funciona
- [ ] Middleware de autenticação ativo
- [ ] Redirecionamento para login quando não autenticado

### 4. Performance
- [ ] Lighthouse Score > 90
- [ ] Tempo de carregamento < 3s
- [ ] Headers de segurança aplicados

## Domínio Personalizado

### Configurar Domínio

1. No dashboard da Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções da Vercel
4. Atualize `NEXT_PUBLIC_SITE_URL` com o novo domínio

## Monitoramento

### Logs
- Acesse **Functions** → **View Function Logs**
- Monitore erros em tempo real
- Configure alertas se necessário

### Analytics
- Ative Vercel Analytics no dashboard
- Monitore performance e uso

## Troubleshooting

### Build Falha

1. **Erro de TypeScript**:
   - Verificar se `typescript.ignoreBuildErrors: true` está no next.config.mjs

2. **Erro de ESLint**:
   - Verificar se `eslint.ignoreDuringBuilds: true` está no next.config.mjs

3. **Erro de Dependências**:
   - Verificar se todas as dependências estão no package.json
   - Limpar cache: Settings → General → Clear Cache

### Runtime Errors

1. **Erro de Variáveis de Ambiente**:
   - Verificar se todas as variáveis estão configuradas
   - Verificar se os valores estão corretos

2. **Erro de Supabase**:
   - Verificar conectividade com Supabase
   - Verificar se as chaves estão válidas

3. **Erro de Autenticação**:
   - Verificar configuração do JWT_SECRET
   - Verificar middleware de autenticação

## Otimizações

### Performance
- Imagens otimizadas automaticamente
- Compressão gzip/brotli ativa
- Edge caching configurado

### Segurança
- Headers de segurança aplicados
- HTTPS forçado
- CSP configurado

### SEO
- Meta tags configuradas
- Sitemap automático
- Robots.txt configurado

## Atualizações

### Deploy Automático
- Pushes na branch `main` fazem deploy automático
- Preview deployments para outras branches
- Rollback disponível no dashboard

### Deploy Manual
- Use `vercel --prod` para deploy manual
- Ou faça push para a branch main

## Suporte

Para problemas específicos:
1. Consulte os logs da Vercel
2. Verifique a documentação do Next.js
3. Consulte a documentação do Supabase
4. Abra uma issue no repositório

---

**Última atualização**: Janeiro 2025
**Versão do Next.js**: 15.2.4
**Versão do Node.js**: 18.x (recomendado pela Vercel)
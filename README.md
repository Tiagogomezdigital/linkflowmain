# LinkFlow Main

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com)

## Overview

LinkFlow é uma plataforma de gerenciamento de links com sistema de round robin para distribuição inteligente de números. O projeto utiliza Next.js 15, Supabase para backend e autenticação, e está otimizado para deploy na Vercel.

## Funcionalidades

- 🔗 Gerenciamento de links com redirecionamento
- 🔄 Sistema de round robin para distribuição de números
- 🔐 Autenticação completa com Supabase Auth
- 📊 Dashboard administrativo
- 🎨 Interface moderna com Tailwind CSS e Radix UI
- 🚀 Otimizado para performance e SEO

## Deploy na Vercel

### Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Projeto Supabase configurado
3. Repositório GitHub conectado

### Configuração de Variáveis de Ambiente

No painel da Vercel, configure as seguintes variáveis de ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=your_vercel_domain
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

### Passos para Deploy

1. **Conectar Repositório**: Importe o repositório na Vercel
2. **Configurar Build**: A Vercel detectará automaticamente Next.js
3. **Adicionar Variáveis**: Configure as variáveis de ambiente listadas acima
4. **Deploy**: Clique em "Deploy" e aguarde o build

### Configurações Automáticas

- ✅ Build Command: `npm run build` (configurado no vercel.json)
- ✅ Output Directory: `.next`
- ✅ Framework: Next.js (detectado automaticamente)
- ✅ Headers de Segurança: Configurados no vercel.json e next.config.mjs
- ✅ Timeouts de Função: Configurados para rotas específicas

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Executar em modo desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard administrativo
│   └── l/                 # Redirecionamento de links
├── components/            # Componentes React
├── lib/                   # Utilitários e configurações
├── docs/                  # Documentação
├── vercel.json           # Configurações da Vercel
└── next.config.mjs       # Configurações do Next.js
```

## Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deploy**: Vercel
- **Autenticação**: Supabase Auth
- **Validação**: Zod
- **Forms**: React Hook Form

## Suporte

Para dúvidas ou problemas, consulte a documentação no diretório `/docs` ou abra uma issue no repositório.

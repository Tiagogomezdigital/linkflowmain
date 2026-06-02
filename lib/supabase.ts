import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'production') {
    console.error("⚠️ Variáveis de ambiente do Supabase não configuradas!")
    console.error("URL:", supabaseUrl)
    console.error("Key:", supabaseAnonKey ? "Definida" : "Não definida")
  }
}

// Cliente principal para componentes (usando auth-helpers para melhor compatibilidade SSR)
let _supabaseClient: any = null

export function getSupabaseClient() {
  if (!_supabaseClient) {
    _supabaseClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!)
  }
  return _supabaseClient
}

// Cliente principal exportado (singleton com lazy loading via Proxy para evitar erro no build)
export const supabase = new Proxy({}, {
  get: function (target, prop) {
    return getSupabaseClient()[prop]
  }
}) as any



// Cliente alternativo para operações que não precisam de auth
const _supabasePublic = createSupabaseClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
export const supabasePublic = _supabasePublic

// Cliente admin para operações que requerem privilégios elevados
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const _supabaseAdmin = supabaseServiceKey
  ? createSupabaseClient(supabaseUrl || "", supabaseServiceKey, {
    global: {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null

export const supabaseAdmin = _supabaseAdmin

// Função para verificar se a API key está sendo enviada corretamente
export async function checkApiKey() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔍 Verificando configuração do Supabase...")
      console.log("URL:", supabaseUrl)
      console.log("API Key (primeiros 20 chars):", supabaseAnonKey?.substring(0, 20) + "...")
    }

    // Usar cliente público para teste
    const { data, error } = await supabasePublic.from("groups").select("id").limit(10)

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("❌ Erro na requisição:", error)
      }
      return {
        success: false,
        error: error.message,
        details: error,
      }
    }

    const count = data?.length || 0
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ API Key funcionando corretamente! ${count} grupos encontrados`)
    }

    return {
      success: true,
      message: "API Key está sendo enviada corretamente",
      data: { count, message: `${count} grupos encontrados` },
      url: supabaseUrl,
      keyPrefix: supabaseAnonKey?.substring(0, 20) + "...",
    }
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("❌ Erro ao verificar API key:", error)
    }
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    }
  }
}

// Função para verificar se o usuário está autenticado
export async function checkAuth() {
  const { data } = await supabase.auth.getSession()
  return data.session !== null
}

// Log para debug
if (process.env.NODE_ENV !== 'production') {
  console.log("🚀 Cliente Supabase inicializado com auth-helpers")
  console.log("📍 URL:", supabaseUrl)
  console.log("🔑 API Key configurada:", !!supabaseAnonKey)
  console.log("👑 Service Role configurada:", !!supabaseServiceKey)
  console.log("🌍 Environment:", process.env.NODE_ENV)
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isServer = typeof window === 'undefined'

  if (isServer) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase URL and SUPABASE_SERVICE_ROLE_KEY are required on the server-side")
    }
    return createSupabaseClient(supabaseUrl, serviceKey, {
      global: {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  // Browser Client
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required on the browser-side")
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

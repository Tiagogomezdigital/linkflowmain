import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  if (process.env.NODE_ENV !== 'production') {
    console.error("⚠️ Variáveis de ambiente do Supabase não configuradas para schema redirect!")
    console.error("URL:", supabaseUrl)
    console.error("Service Key:", supabaseServiceKey ? "Definida" : "Não definida")
  }
  throw new Error("Configuração do Supabase incompleta")
}

// Cliente específico para o schema 'redirect' usando service role
// Nota: Supabase API não suporta schemas customizados via configuração do cliente
// Vamos usar queries SQL diretas para acessar o schema redirect
export const supabaseRedirect = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  },
})

// Função para testar a conexão
export async function testRedirectConnection() {
  try {
    const { data, error } = await supabaseRedirect
      .from('groups')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.error('Erro ao conectar com schema redirect:', error)
      return false
    }
    
    console.log('✅ Conexão com schema redirect estabelecida com sucesso')
    return true
  } catch (error) {
    console.error('Erro na conexão:', error)
    return false
  }
}

if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Cliente Supabase para schema redirect inicializado')
  console.log('📍 URL:', supabaseUrl)
  console.log('🔑 Service Key configurada:', !!supabaseServiceKey)
  console.log('🗂️ Schema: redirect')
}

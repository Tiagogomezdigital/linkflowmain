import { getSupabaseClient } from "./supabase";

// Função de login simplificada
export async function loginUser(email: string, password: string) {
  console.log("🔐 Iniciando login para:", email)
  const supabaseAuth = getSupabaseClient()

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  })

  console.log("📊 Resultado do login:", {
    success: !error,
    user: data?.user?.email,
    error: error?.message,
  })

  return { data, error }
}

// Função de logout
export async function logoutUser() {
  const supabaseAuth = getSupabaseClient()
  const { error } = await supabaseAuth.auth.signOut()
  return { error }
}

// Verificar sessão atual (Client Side)
export async function getCurrentSession() {
  const supabaseAuth = getSupabaseClient()
  const { data } = await supabaseAuth.auth.getSession()
  return data.session
}

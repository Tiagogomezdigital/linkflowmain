import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const path = req.nextUrl.pathname

    const isRedirectRoute = path.startsWith("/l") || path.startsWith("/redirect") || path.startsWith("/api/redirect")

    if (isRedirectRoute) {
      if (process.env.NODE_ENV !== "production") {
        console.log("🚀 Rota de redirecionamento - bypass do middleware auth")
      }
      return res
    }

    // Verificar se existe token de autenticação
    const token = req.cookies.get('auth-token')?.value
    let hasValidUser = false

    // Para o Edge Runtime, vamos fazer uma validação simples
    // A validação completa será feita nas páginas/APIs
    if (token && token.length > 50) {
      // Assumir que o token é válido se existe e tem tamanho adequado
      // A validação real será feita no servidor
      hasValidUser = true
    }

    const isLoginRoute = path === "/login"
    const isAuthCallback = path === "/auth/callback"

    // Página de erro pública
    const isErrorRoute = path === "/error"

    // Rotas de API públicas
    const isPublicApiRoute = path.startsWith("/api/auth/")
    
    // Permitir chamadas internas de API (server-side)
    const isInternalApiCall = req.headers.get("user-agent") === "node" && path.startsWith("/api/")

    // Lista consolidada de rotas que NÃO exigem autenticação
    const isPublicRoute = isLoginRoute || isAuthCallback || isErrorRoute || isPublicApiRoute || isInternalApiCall

    // Log detalhado para debug
    if (process.env.NODE_ENV !== "production") {
      console.log("🛡️ Middleware Debug:", {
        path,
        hasToken: !!token,
        hasValidUser,
        isPublicRoute,
        isLoginRoute,
        isAuthCallback,
        userAgent: req.headers.get("user-agent")?.substring(0, 50),
        timestamp: new Date().toISOString(),
      })
    }

    // Permitir callback de auth sem verificação
    if (isAuthCallback) {
      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Permitindo acesso ao callback de auth")
      }
      return res
    }

    // Bloquear qualquer rota privada quando não houver sessão
    if (!isPublicRoute && !hasValidUser) {
      if (process.env.NODE_ENV !== "production") {
        console.log("❌ Acesso negado (rota privada), redirecionando para login")
      }

      // Evitar loops de redirecionamento
      if (!req.headers.get("referer")?.includes("/login")) {
        const redirectUrl = new URL("/login", req.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Redirecionar se já logado e tentar acessar login
    if (isLoginRoute && hasValidUser) {
      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Usuário já logado tentando acessar login, redirecionando para dashboard")
      }

      // Evitar loops de redirecionamento
      if (!req.headers.get("referer")?.includes("/admin/grupos")) {
        const redirectUrl = new URL("/admin/grupos", req.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Nenhuma ação extra necessária aqui, pois já validamos a sessão

    return res
  } catch (error) {
    console.error("❌ Erro no middleware:", error)

    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)


  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log("🏠 Página inicial - Verificando autenticação...")
        }

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        const result = await response.json()

        if (process.env.NODE_ENV !== 'production') {
          console.log("🔍 Verificando sessão na página inicial:", {
            success: result.success,
            hasUser: !!result.user,
            userId: result.user?.id,
            environment: process.env.NODE_ENV,
            url: typeof window !== "undefined" ? window.location.href : "SSR",
          })
        }

        if (response.ok && result.success && result.user) {
          if (process.env.NODE_ENV !== 'production') {
            console.log("✅ Usuário logado, redirecionando para dashboard")
          }
          router.replace("/admin/grupos")
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log("❌ Usuário não logado, redirecionando para login")
          }
          router.replace("/login")
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error("❌ Erro ao verificar sessão:", error)
        }
        router.replace("/login")
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="bg-lime-400 rounded-2xl p-4 mx-auto mb-4 w-fit">
            <div className="h-12 w-12 text-black flex items-center justify-center text-2xl">⚡</div>
          </div>
          <h1 className="text-2xl font-bold text-white">LinkFlow</h1>
          <p className="text-slate-400 text-sm mt-2">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return null
}

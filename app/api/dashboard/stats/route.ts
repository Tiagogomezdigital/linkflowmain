import { NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/api/dashboard"

export async function GET() {
  try {
    // Executa a consulta no servidor usando a secret key
    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("❌ Erro na API /api/dashboard/stats:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

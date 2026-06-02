import { NextRequest, NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/api/stats"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dateFrom, dateTo, groupIds } = body

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 }
      )
    }

    const stats = await getDashboardStats(
      new Date(dateFrom),
      new Date(dateTo),
      groupIds
    )

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("❌ Erro em /api/stats/dashboard:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

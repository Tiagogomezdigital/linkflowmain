import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, supabasePublic } from "@/lib/supabase"
import { registerClick } from "@/lib/api/clicks"
import { getNextNumber } from "@/lib/api/numbers"

// Seleciona o client com privilégios mais elevados quando disponível
const supabase = supabaseAdmin ?? supabasePublic

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")?.trim()
  const customPhone = url.searchParams.get("phone")?.trim()
  const verbose = url.searchParams.get("verbose") === "true"

  if (!slug) {
    return NextResponse.json({ error: "Parâmetro 'slug' é obrigatório" }, { status: 400 })
  }

  const logs: any[] = []
  const pushLog = (step: string, detail: any) => {
    const entry = { step, detail }
    logs.push(entry)
    // Também loga no console para quem estiver acompanhando via dashboard
    console.log("[simulate-click]", entry)
  }

  try {
    // 1) Buscar próximo número ativo (ou usar phone custom)
    let targetPhone: string = customPhone || ""
    if (!targetPhone) {
      const numberData = await getNextNumber(slug)
      pushLog("getNextNumber_response", { numberData })
      if (!numberData) {
        return NextResponse.json({ error: "Nenhum número encontrado", logs }, { status: 400 })
      }
      targetPhone = numberData.phone
    }

    // 2) Registrar clique usando função TypeScript
    let clickData = null
    let clickError = null
    try {
      await registerClick({
        groupSlug: slug,
        numberPhone: targetPhone,
        ipAddress: "127.0.0.1",
        userAgent: "SimulateClick/1.0",
        deviceType: "desktop",
        referrer: "https://debug.local",
      })
      clickData = { success: true }
    } catch (error) {
      clickError = error
    }
    pushLog("register_click_response", { data: clickData, error: clickError })

    // 3) Retornar resultado final
    const responsePayload = {
      success: !clickError,
      slug,
      phone: targetPhone,
      clickData,
      clickError,
      logs,
    }
    return NextResponse.json(responsePayload)
  } catch (error: any) {
    pushLog("exception", { message: error.message, stack: verbose ? error.stack : undefined })
    return NextResponse.json({ error: error.message, logs }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getDeviceStats } from "@/lib/api/stats"

const supabase = supabaseAdmin

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chart = searchParams.get("chart")
    const groupId = searchParams.get("groupId") || null
    const startDate = searchParams.get("startDate") || null
    const endDate = searchParams.get("endDate") || null

    if (!chart) {
      return NextResponse.json({ error: "Parâmetro 'chart' é obrigatório" }, { status: 400 })
    }

    let data: any = null
    let error: any = null

    if (chart === "device") {
      try {
        const parsedGroupId = groupId ? [groupId] : undefined
        const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const parsedEndDate = endDate ? new Date(endDate) : new Date()
        data = await getDeviceStats(parsedStartDate, parsedEndDate, parsedGroupId)
      } catch (err: any) {
        error = err
      }
    } else if (chart === "browser") {
      const res = await supabase.rpc("get_browser_stats", {
        p_group_id: groupId,
        p_start_date: startDate,
        p_end_date: endDate
      })
      data = res.data
      error = res.error
    } else if (chart === "location") {
      const countryRes = await supabase.rpc("get_country_stats_v3", {
        p_group_id: groupId,
        p_start_date: startDate,
        p_end_date: endDate
      })
      const locationRes = await supabase.rpc("get_location_stats", {
        p_group_id: groupId,
        p_start_date: startDate,
        p_end_date: endDate
      })
      data = {
        countries: countryRes.data || [],
        locations: locationRes.data || []
      }
      error = countryRes.error || locationRes.error
    } else if (chart === "os") {
      const res = await supabase.rpc("get_os_stats", {
        p_group_id: groupId,
        p_start_date: startDate,
        p_end_date: endDate
      })
      data = res.data
      error = res.error
    } else if (chart === "utm") {
      const utmRes = await supabase.rpc("get_utm_stats", {
        p_group_id: groupId,
        p_start_date: startDate,
        p_end_date: endDate
      })
      const sourceRes = await supabase.rpc("get_utm_source_stats_v3", {
        p_group_id: groupId,
        p_start_date: startDate,
        p_end_date: endDate
      })
      data = {
        utms: utmRes.data || [],
        sources: sourceRes.data || []
      }
      error = utmRes.error || sourceRes.error
    } else if (chart === "country") {
      const res = await supabase.rpc("get_country_stats_v3", {
        p_group_id: groupId,
        p_start_date: startDate,
        p_end_date: endDate
      })
      data = res.data
      error = res.error
    } else {
      return NextResponse.json({ error: "Tipo de gráfico inválido" }, { status: 400 })
    }

    if (error) {
      console.error(`❌ Erro ao buscar RPC ${chart}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("❌ Erro em /api/stats/charts:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const supabase = supabaseAdmin

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, groupIds } = await request.json()

    // Query de cliques no servidor usando privilégios da secret_key
    let query = supabase.from("clicks").select("*", { count: "exact" })
    
    if (startDate) query = query.gte("created_at", startDate)
    if (endDate) query = query.lte("created_at", endDate)
    if (groupIds && groupIds.length) query = query.in("group_id", groupIds)

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Erro ao buscar cliques de relatório:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, count })
  } catch (error: any) {
    console.error('❌ Erro no endpoint /api/relatorio/clicks:', error)
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 })
  }
}

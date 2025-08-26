import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 API /api/group-stats chamada - usando função RPC')
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client não disponível')
    }

    // Usar função RPC para buscar estatísticas dos grupos
    const { data: groupStats, error: statsError } = await supabaseAdmin
       .rpc('get_group_stats')

    if (statsError) {
      console.error('❌ Erro na consulta Supabase:', statsError)
      throw statsError
    }

    console.log('✅ Estatísticas encontradas:', groupStats?.length || 0)

    // Transformar os dados para o formato esperado pelo frontend
    const formattedStats = (groupStats || []).map((stat: any) => {
      return {
        group_id: stat.group_id,
        group_name: stat.group_name,
        group_slug: stat.group_slug,
        total_numbers: stat.total_numbers,
        active_numbers: stat.active_numbers,
        total_clicks: stat.total_clicks,
        clicks_today: stat.clicks_today,
        clicks_this_week: stat.clicks_this_week,
        clicks_this_month: stat.clicks_this_month,
        last_click_at: stat.last_click_at
      }
    })

    console.log('📊 Estatísticas calculadas para', formattedStats.length, 'grupos')
    
    return NextResponse.json({
      success: true,
      data: formattedStats
    })
  } catch (error) {
    console.error('❌ Erro na API /api/group-stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabasePublic } from '@/lib/supabase'
import { executeRedirectQuery } from '@/lib/api/redirect-queries'

// Usar cliente admin se disponível, senão público
const supabase = supabaseAdmin ?? supabasePublic

async function processRequest(dateFrom: string, dateTo: string, groupIds?: string[]) {
  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: 'dateFrom and dateTo are required' },
      { status: 400 }
    )
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 API: Buscando estatísticas filtradas...', { dateFrom, dateTo, groupIds })
    }

    // Usar SQL direto para acessar o esquema redirect
    let query = `
      SELECT 
        DATE(c.created_at) as date,
        c.group_id,
        g.name as group_name,
        g.slug as group_slug,
        COUNT(*) as clicks_count
      FROM redirect.clicks c
      INNER JOIN redirect.groups g ON c.group_id = g.id
      WHERE DATE(c.created_at) >= '${dateFrom}'
        AND DATE(c.created_at) <= '${dateTo}'
    `
    
    if (groupIds && groupIds.length > 0) {
      const groupIdsList = groupIds.map(id => `'${id}'`).join(',')
      query += ` AND c.group_id IN (${groupIdsList})`
    }
    
    query += `
      GROUP BY DATE(c.created_at), c.group_id, g.name, g.slug
      ORDER BY DATE(c.created_at) ASC, g.name ASC
    `
    
    const { data: clicksData, error } = await executeRedirectQuery(query)

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ API: Erro na consulta Supabase:', error)
      }
      throw error
    }

    if (!clicksData || !Array.isArray(clicksData)) {
      throw new Error('Resultado inválido da consulta')
    }

    console.log(`📊 API: ${clicksData.length} registros encontrados para o período ${dateFrom} - ${dateTo}`)

    // Agrupar por dia usando os dados já processados pela função RPC
    const stats = new Map<string, number>()
    const startDate = new Date(dateFrom)
    const endDate = new Date(dateTo)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      stats.set(d.toISOString().split('T')[0], 0)
    }
    
    clicksData.forEach((item: any, index: number) => {
      // Os dados podem estar dentro de um campo 'result'
      const data = item.result || item
      const date = data.date
      // Pular itens sem data válida
      if (!date) {
        return
      }
      
      const clicksCount = data.clicks_count || 0
      
      stats.set(date, (stats.get(date) || 0) + clicksCount)
    })

    // Buscar dados dos grupos usando função RPC
    const { data: groupsData } = await supabase.rpc('get_groups_with_numbers')
    
    const groupsMap = new Map()
    groupsData?.forEach((group: any) => {
      groupsMap.set(group.group_id, {
        id: group.group_id,
        name: group.group_name,
        slug: group.group_slug
      })
    })

    // Agrupar por grupo usando os dados já processados pela função RPC
    const groupMap = new Map<string, { group_id: string, group_name: string, group_slug: string, clicks: number }>()
    clicksData.forEach((item: any) => {
      // Os dados podem estar dentro de um campo 'result'
      const data = item.result || item
      const group_id = data.group_id
      // Pular itens sem group_id válido
      if (!group_id) return
      
      const group_name = data.group_name || '(Sem nome)'
      const group_slug = data.group_slug || ''
      if (!groupMap.has(group_id)) {
        groupMap.set(group_id, { group_id, group_name, group_slug, clicks: 0 })
      }
      groupMap.get(group_id)!.clicks += (data.clicks_count || 0)
    })
    const groupClicks = Array.from(groupMap.values()).sort((a, b) => b.clicks - a.clicks)

    const response = {
      dailyClicks: Array.from(stats.entries()).map(([date, clicks]) => ({ date, clicks })),
      groupClicks,
    }

    return NextResponse.json(response)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ API: Erro em getFilteredStats:', error)
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const groupIds = searchParams.get('groupIds')?.split(',').filter(Boolean)

  return processRequest(dateFrom!, dateTo!, groupIds)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dateFrom, dateTo, groupIds } = body

    return processRequest(dateFrom, dateTo, groupIds)
  } catch (error) {
    console.error('❌ API: Erro ao processar POST:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 400 }
    )
  }
}

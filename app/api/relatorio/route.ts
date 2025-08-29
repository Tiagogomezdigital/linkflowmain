import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface ReportRequest {
  filterType: 'hoje' | 'ontem' | 'dia_especifico' | 'periodo'
  selectedDate?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  groupIds: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json()
    const { filterType, selectedDate, startDate, endDate, startTime, endTime, groupIds } = body

    if (!groupIds || groupIds.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um grupo deve ser selecionado' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Construir filtros de data baseado no tipo
    let dateFilter = ''
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    switch (filterType) {
      case 'hoje':
        const todayStart = today.toISOString()
        const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        dateFilter = `c.created_at >= '${todayStart}' AND c.created_at <= '${todayEnd}'`
        break

      case 'ontem':
        const yesterdayStart = yesterday.toISOString()
        const yesterdayEnd = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        dateFilter = `c.created_at >= '${yesterdayStart}' AND c.created_at <= '${yesterdayEnd}'`
        break

      case 'dia_especifico':
        if (!selectedDate) {
          return NextResponse.json(
            { error: 'Data específica é obrigatória' },
            { status: 400 }
          )
        }
        const specificDate = new Date(selectedDate)
        const specificStart = new Date(specificDate.getFullYear(), specificDate.getMonth(), specificDate.getDate()).toISOString()
        const specificEnd = new Date(specificDate.getFullYear(), specificDate.getMonth(), specificDate.getDate(), 23, 59, 59, 999).toISOString()
        dateFilter = `c.created_at >= '${specificStart}' AND c.created_at <= '${specificEnd}'`
        break

      case 'periodo':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'Datas de início e fim são obrigatórias para período' },
            { status: 400 }
          )
        }
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        // Adicionar horários se fornecidos
        if (startTime) {
          const [startHour, startMinute] = startTime.split(':')
          start.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)
        }
        if (endTime) {
          const [endHour, endMinute] = endTime.split(':')
          end.setHours(parseInt(endHour), parseInt(endMinute), 59, 999)
        }
        
        dateFilter = `c.created_at >= '${start.toISOString()}' AND c.created_at <= '${end.toISOString()}'`
        break

      default:
        return NextResponse.json(
          { error: 'Tipo de filtro inválido' },
          { status: 400 }
        )
    }

    // Construir lista de IDs dos grupos para a query
    const groupIdsString = groupIds.map(id => `'${id}'`).join(',')

    // Query principal para buscar dados dos cliques agrupados por grupo
    const query = `
      SELECT 
        g.id as group_id,
        g.name as group_name,
        COUNT(c.id) as total_clicks,
        COUNT(DISTINCT c.ip_address) as unique_visitors,
        CASE 
          WHEN COUNT(DISTINCT c.ip_address) > 0 
          THEN (COUNT(c.id)::float / COUNT(DISTINCT c.ip_address)::float) * 100 
          ELSE 0 
        END as conversion_rate
      FROM redirect.groups g
      LEFT JOIN redirect.clicks c ON g.id = c.group_id 
        AND (${dateFilter})
      WHERE g.id IN (${groupIdsString})
        AND g.is_active = true
      GROUP BY g.id, g.name
      ORDER BY total_clicks DESC
    `

    console.log('🔍 Query do relatório:', query)

    const { data, error } = await supabase.rpc('execute_sql_select', {
      sql_query: query
    })

    if (error) {
      console.error('❌ Erro na consulta do relatório:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar relatório' },
        { status: 500 }
      )
    }

    console.log('📊 Dados do relatório retornados:', data?.length || 0, 'grupos')
    console.log('📊 Estrutura dos dados:', JSON.stringify(data?.slice(0, 2), null, 2))
    
    const responseData = data || []
    console.log('📊 Dados finais sendo enviados:', responseData.length, 'itens')

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ Erro no endpoint de relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST para gerar relatórios' },
    { status: 405 }
  )
}
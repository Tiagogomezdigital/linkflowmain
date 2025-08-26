import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth-custom'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query SQL é obrigatória' }, { status: 400 })
    }

    // Verificar se o cliente admin está disponível
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase admin não configurado' },
        { status: 500 }
      )
    }

    // Executar query usando Supabase diretamente
    const { data, error } = await supabaseAdmin.rpc('execute_sql_select', {
      sql_query: query
    })

    if (error) {
      console.error('❌ Erro Supabase:', error)
      return NextResponse.json(
        { error: 'Erro ao executar query no banco' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      error: null
    })
  } catch (error) {
    console.error('❌ Erro ao executar query:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

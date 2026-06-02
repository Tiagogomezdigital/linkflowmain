import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Usar apenas cliente admin para segurança do servidor
const supabase = supabaseAdmin

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupSlug = searchParams.get('groupSlug')

    if (!groupSlug) {
      return NextResponse.json(
        { error: 'groupSlug parameter is required' },
        { status: 400 }
      )
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 API /api/numbers/next chamada para slug:', groupSlug)
    }

    // Buscar o próximo número disponível usando função RPC com round robin correto
    const { data: result, error } = await supabase.rpc('get_next_number', {
      group_slug: groupSlug
    })

    if (error) {
      console.error('❌ Erro na consulta Supabase:', error)
      throw error
    }

    if (!result || result.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Nenhum número encontrado para o slug:', groupSlug)
      }
      return NextResponse.json(
        { error: 'No active numbers found for this group' },
        { status: 404 }
      )
    }

    const numberData = result[0]

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Número encontrado:', numberData)
    }

    return NextResponse.json({
      number_id: numberData.number_id,
      phone: numberData.phone,
      final_message: numberData.final_message
    })
  } catch (error) {
    console.error('❌ Erro na API /api/numbers/next:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

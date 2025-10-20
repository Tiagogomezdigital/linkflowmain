import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabasePublic } from '@/lib/supabase'

// Usar cliente admin se disponível, senão público
const supabase = supabaseAdmin ?? supabasePublic

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const excludeId = searchParams.get('excludeId')
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }
    
    // Verificar se o slug já existe usando a função RPC apropriada
    let slugExists
    
    if (excludeId) {
      // Caso de edição: verificar excluindo o ID atual
      const { data, error } = await supabase
        .rpc('check_slug_exists', { 
          group_slug: slug, 
          exclude_group_id: excludeId 
        })
      
      if (error) throw error
      slugExists = data
    } else {
      // Caso de criação: verificar sem excluir IDs
      const { data, error } = await supabase
        .rpc('check_slug_exists_for_create', { 
          p_slug: slug 
        })
      
      if (error) throw error
      slugExists = data
    }
    
    return NextResponse.json({
      available: !slugExists
    })
  } catch (error) {
    console.error('Error checking slug availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
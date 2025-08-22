import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabasePublic } from '@/lib/supabase'

// Usar cliente admin se disponível, senão público
const supabase = supabaseAdmin ?? supabasePublic

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/groups chamada - usando função RPC')
    
    // Consulta grupos com contagem de números usando função RPC
    const { data: groups, error } = await supabase.rpc('get_groups_with_numbers')
    
    if (error) {
      console.error('❌ Erro na consulta Supabase:', error)
      throw error
    }

    console.log('📊 Grupos retornados do banco:', groups?.length || 0)

    return NextResponse.json({
      success: true,
      data: groups || []
    })
  } catch (error) {
    console.error('❌ Erro na API /api/groups:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, is_active = true } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existingGroup } = await supabase
      .schema('redirect')
      .from('groups')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      )
    }

    const { data: newGroup, error } = await supabase
      .schema('redirect')
      .from('groups')
      .insert({
        name,
        slug,
        description,
        is_active
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(newGroup, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
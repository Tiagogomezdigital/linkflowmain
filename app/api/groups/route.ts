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
    const { name, slug, description, default_message, is_active = true } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists using RPC function
    const { data: slugExists, error: slugError } = await supabase
      .rpc('check_slug_exists_for_create', { p_slug: slug })

    if (slugError) {
      console.error('Error checking slug:', slugError)
      throw slugError
    }

    if (slugExists) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      )
    }

    // Create new group using RPC function
    const { data: newGroup, error } = await supabase
      .rpc('create_group', {
        p_name: name,
        p_slug: slug,
        p_description: description,
        p_default_message: default_message,
        p_is_active: is_active
      })

    if (error) {
      console.error('Error creating group:', error)
      throw error
    }

    // RPC returns an array, get the first item
    const group = Array.isArray(newGroup) ? newGroup[0] : newGroup

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

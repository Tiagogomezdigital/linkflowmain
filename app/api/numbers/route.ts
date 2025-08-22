import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabasePublic } from '@/lib/supabase'

// Usar cliente admin se disponível, senão público
const supabase = supabaseAdmin ?? supabasePublic

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    
    console.log('🔍 API /api/numbers chamada - usando função RPC')
    if (groupId) {
      console.log('🎯 Filtrando por grupo:', groupId)
    }
    
    // Consulta números com informações do grupo usando função RPC
    const { data: numbers, error } = await supabase.rpc('get_numbers_with_groups', {
      group_filter: groupId
    })
    
    if (error) {
      console.error('❌ Erro na consulta Supabase:', error)
      throw error
    }

    console.log('📊 Números retornados do banco:', numbers?.length || 0)

    return NextResponse.json({
      success: true,
      data: numbers
    })
  } catch (error) {
    console.error('❌ Erro na API /api/numbers:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// POST /api/numbers - Create new WhatsApp number
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { number, description, group_id, is_active = true, custom_message } = body

    console.log('📝 Dados recebidos no POST:', { number, description, group_id, is_active, custom_message })

    // Validate required fields
    if (!number || !group_id) {
      console.log('❌ Campos obrigatórios faltando')
      return NextResponse.json(
        { error: 'Number and group_id are required' },
        { status: 400 }
      )
    }

    console.log('✅ Validação inicial passou')

    // Check if phone number already exists using RPC
    console.log('🔍 Verificando se número já existe:', number)
    const { data: existingNumbers } = await supabase.rpc('get_numbers_with_groups')
    
    const existingNumber = existingNumbers?.find((num: any) => num.phone === number)
    if (existingNumber) {
      console.log('❌ Número já existe')
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      )
    }

    console.log('✅ Número não existe, prosseguindo')

    // Verify group exists using RPC
    console.log('🔍 Verificando se grupo existe:', group_id)
    const { data: groups } = await supabase.rpc('get_groups_with_numbers')
    
    const group = groups?.find((g: any) => g.id === group_id)
    if (!group) {
      console.log('❌ Grupo não encontrado')
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    console.log('✅ Grupo encontrado, prosseguindo')

    // Use RPC function to insert number
    console.log('💾 Inserindo novo número no banco usando RPC')
    const { data: newNumber, error } = await supabase.rpc('insert_whatsapp_number', {
      p_phone: number,
      p_name: description || 'Número sem descrição',
      p_group_id: group_id,
      p_is_active: is_active,
      p_custom_message: custom_message
    })

    if (error) {
      console.log('❌ Erro ao inserir número:', error)
      throw error
    }

    console.log('✅ Número inserido com sucesso:', newNumber)
    return NextResponse.json(newNumber, { status: 201 })
  } catch (error) {
    console.error('Error creating WhatsApp number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
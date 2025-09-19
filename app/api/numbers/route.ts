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

    // Check if phone number already exists in the same group using RPC
    console.log('🔍 Verificando se número já existe no grupo:', number, 'grupo:', group_id)
    const { data: phoneExists, error: phoneCheckError } = await supabase
      .rpc('check_phone_exists_in_group', {
        phone_number: number,
        group_uuid: group_id
      })
      .single()

    if (phoneCheckError) {
      console.error('Error checking phone existence in group:', phoneCheckError)
      return NextResponse.json(
        { error: 'Error validating phone number' },
        { status: 500 }
      )
    }

    if (phoneExists) {
      console.log('❌ Número já existe no grupo')
      return NextResponse.json(
        { error: 'Phone number already exists in this group' },
        { status: 409 }
      )
    }

    console.log('✅ Número não existe no grupo, prosseguindo')

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

    // Verificar se o grupo tem influencer associado
    console.log('🔍 Verificando se grupo tem influencer associado')
    const { data: groupInfo, error: groupError } = await supabase.rpc('get_group_info', {
      p_group_id: group_id
    })

    if (groupError) {
      console.log('❌ Erro ao buscar informações do grupo:', groupError)
      throw groupError
    }

    console.log('📋 Dados do grupo retornados:', JSON.stringify(groupInfo, null, 2))
    const hasInfluencer = groupInfo?.[0]?.influencer_id !== null
    console.log('📊 Grupo tem influencer:', hasInfluencer)

    // Use RPC function to insert number
    console.log('💾 Inserindo novo número no banco usando RPC')
    const rpcFunction = hasInfluencer 
      ? 'insert_whatsapp_number' 
      : 'insert_whatsapp_number_no_influencer_check'
    
    console.log('🔧 Usando função RPC:', rpcFunction)
    
    const { data: newNumber, error } = await supabase.rpc(rpcFunction, {
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

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, supabasePublic } from '@/lib/supabase'

// Usar cliente admin se disponível, senão público
const supabase = supabaseAdmin ?? supabasePublic

// GET /api/numbers/[id] - Get WhatsApp number by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: number, error } = await supabase
      .schema('redirect')
      .from('whatsapp_numbers')
      .select(`
        *,
        redirect.groups (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'WhatsApp number not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(number)
  } catch (error) {
    console.error('Error fetching WhatsApp number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/numbers/[id] - Update WhatsApp number
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { phone, name, group_id, custom_message, is_active } = body

    // Validate required fields
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone is required' },
        { status: 400 }
      )
    }

    // Check if phone number is already taken by another number
    const { data: phoneExists, error: phoneCheckError } = await supabase
      .rpc('check_phone_exists', {
        phone_number: phone,
        exclude_id: id
      })
      .single()

    if (phoneCheckError) {
      console.error('Error checking phone existence:', phoneCheckError)
      return NextResponse.json(
        { error: 'Error validating phone number' },
        { status: 500 }
      )
    }

    if (phoneExists) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      )
    }

    // Verify group exists (only if group_id is provided)
    if (group_id && group_id.trim() !== '') {
      console.log('🔍 Verificando grupo:', group_id)
      console.log('🔧 Cliente Supabase usado:', supabase === supabaseAdmin ? 'Admin' : 'Public')
      
      // Usar função do schema público para acessar grupos do schema redirect
      const { data: group, error: groupError } = await supabase
        .rpc('get_group_by_id', { group_uuid: group_id })

      console.log('📊 Resultado da busca do grupo:', { group, groupError })

      if (groupError || !group || group.length === 0) {
        console.log('❌ Erro ou grupo não encontrado:', { groupError, group_id })
        return NextResponse.json(
          { error: 'Group not found', details: groupError?.message },
          { status: 404 }
        )
      }
      console.log('✅ Grupo encontrado:', group[0])
    }

    const { data: updatedNumber, error } = await supabase
      .rpc('update_whatsapp_number', {
        number_id: id,
        new_phone: phone,
        new_name: name,
        new_group_id: group_id && group_id.trim() !== '' ? group_id : null,
        new_custom_message: custom_message,
        new_is_active: is_active
      })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'WhatsApp number not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(updatedNumber)
  } catch (error) {
    console.error('Error updating WhatsApp number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/numbers/[id] - Delete WhatsApp number
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Delete the WhatsApp number using RPC function
    const { data: deleted, error } = await supabase
      .rpc('delete_whatsapp_number', { p_number_id: id })

    if (error) {
      console.error('Error calling delete_whatsapp_number RPC:', error)
      throw error
    }

    if (!deleted) {
      return NextResponse.json(
        { error: 'Number not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting WhatsApp number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/numbers/[id] - Toggle WhatsApp number status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { is_active } = body

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean' },
        { status: 400 }
      )
    }

    // Use RPC function to toggle status
    const { data: updatedNumber, error } = await supabase
      .rpc('toggle_whatsapp_number_status', {
        p_number_id: id,
        p_is_active: is_active
      })
      .single()

    if (error) {
      console.error('Error toggling WhatsApp number status:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'WhatsApp number not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(updatedNumber)
  } catch (error) {
    console.error('Error toggling WhatsApp number status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

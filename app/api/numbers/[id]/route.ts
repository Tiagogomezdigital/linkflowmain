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
        groups (
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
    const { phone, name, group_id, is_active } = body

    // Validate required fields
    if (!phone || !name || !group_id) {
      return NextResponse.json(
        { error: 'Phone, name and group_id are required' },
        { status: 400 }
      )
    }

    // Check if phone number is already taken by another number
    const { data: existingNumber } = await supabase
      .schema('redirect')
      .from('whatsapp_numbers')
      .select('id')
      .eq('phone', phone)
      .neq('id', id)
      .single()

    if (existingNumber) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      )
    }

    // Verify group exists
    const { data: group } = await supabase
      .schema('redirect')
      .from('groups')
      .select('id')
      .eq('id', group_id)
      .single()

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const { data: updatedNumber, error } = await supabase
      .schema('redirect')
      .from('whatsapp_numbers')
      .update({
        phone,
        name,
        group_id,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        groups (
          id,
          name,
          slug
        )
      `)
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
    // Check if number has associated clicks (optional - you might want to keep click history)
    const { data: clicks, error: clicksError } = await supabase
      .schema('redirect')
      .from('clicks')
      .select('id')
      .eq('number_phone', id)
      .limit(1)

    if (clicksError) {
      console.warn('Warning checking clicks:', clicksError)
    }

    // Delete the WhatsApp number (clicks can remain for historical data)
    const { error } = await supabase
      .schema('redirect')
      .from('whatsapp_numbers')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
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

    const { data: updatedNumber, error } = await supabase
      .schema('redirect')
      .from('whatsapp_numbers')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        groups (
          id,
          name,
          slug
        )
      `)
      .single()

    if (error) {
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

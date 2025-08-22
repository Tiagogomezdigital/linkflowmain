import { supabase } from "../supabase"
import type { Click } from "../types"

export async function registerClick(params: {
  groupSlug: string
  numberPhone: string
  ipAddress?: string
  userAgent?: string
  deviceType?: string
  referrer?: string
}): Promise<void> {
  try {
    // Usar função RPC para registrar clique
    const { data, error } = await supabase.rpc('register_click', {
      p_group_slug: params.groupSlug,
      p_number_phone: params.numberPhone,
      p_ip_address: params.ipAddress || null,
      p_user_agent: params.userAgent || null,
      p_device_type: params.deviceType || null,
      p_referrer: params.referrer || null
    })

    if (error) {
      throw new Error(`Erro na RPC: ${error.message}`)
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Erro desconhecido ao registrar clique')
    }

    console.log('✅ Clique registrado com sucesso:', data)
  } catch (error) {
    console.error('❌ Erro ao registrar clique:', error)
    // Não propagar o erro para não quebrar o redirecionamento
    // throw error
  }
}

export async function registerClickOld(params: {
  groupSlug: string
  numberPhone: string
  ipAddress?: string
  userAgent?: string
  deviceType?: string
  referrer?: string
}): Promise<void> {
  try {
    // Buscar grupo pelo slug
    const { data: group, error: groupError } = await supabase
      .schema('redirect')
      .from('groups')
      .select('id')
      .eq('slug', params.groupSlug)
      .eq('is_active', true)
      .single()

    if (groupError || !group) {
      throw new Error(`Grupo não encontrado ou inativo: ${params.groupSlug}`)
    }

    // Buscar número
    const { data: number, error: numberError } = await supabase
      .schema('redirect')
      .from('whatsapp_numbers')
      .select('id')
      .eq('phone', params.numberPhone)
      .eq('group_id', group.id)
      .single()

    if (numberError || !number) {
      throw new Error(`Número não encontrado: ${params.numberPhone}`)
    }

    // Inserir clique
    const { error: clickError } = await supabase
      .schema('redirect')
      .from('clicks')
      .insert({
        group_id: group.id,
        number_id: number.id,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        device_type: params.deviceType || null,
        referrer: params.referrer || null,
        created_at: new Date().toISOString()
      })

    if (clickError) {
      throw clickError
    }

    // Atualizar last_used_at do número
    const { error: updateError } = await supabase
      .schema('redirect')
      .from('whatsapp_numbers')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', number.id)

    if (updateError) {
      throw updateError
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Error in registerClick:", error)
    }
    throw error
  }
}

export async function getClicksByGroupId(groupId: string, limit = 100): Promise<Click[]> {
  const { data, error } = await supabase
    .schema('redirect')
    .from('clicks')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Funções para executar queries no schema redirect usando SQL direto
import { supabaseAdmin } from "@/lib/supabase"

// Interface para o resultado das queries
interface QueryResult<T = any> {
  data: T[] | null
  error: any
}

// Função para executar SQL raw no schema redirect
export async function executeRedirectQuery<T = any>(query: string, params: any[] = []): Promise<QueryResult<T>> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client não configurado')
    }

    // Substituir parâmetros na query de forma mais segura
    let finalQuery = query
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`
      // Para strings, usar aspas simples e escapar adequadamente
      let value: string
      if (typeof param === 'string') {
        value = `'${param.replace(/'/g, "''")}'`
      } else if (param === null || param === undefined) {
        value = 'NULL'
      } else {
        value = String(param)
      }
      finalQuery = finalQuery.replace(new RegExp(`\\${placeholder}\\b`, 'g'), value)
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Executando query redirect:', finalQuery)
      console.log('🔍 Parâmetros originais:', params)
    }

    // Usar Supabase diretamente para executar SQL
    const { data, error } = await supabaseAdmin.rpc('execute_sql_select', {
      sql_query: finalQuery
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Resultado da RPC:', { data, error })
    }

    if (error) {
      console.error('❌ Erro na query redirect:', error)
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('❌ Erro ao executar query redirect:', err)
    return { data: null, error: err }
  }
}

// Função específica para buscar grupo por slug
export async function getGroupBySlugRedirect(slug: string) {
  const query = `SELECT id, name, default_message FROM redirect.groups WHERE slug = $1 AND is_active = true LIMIT 1`
  return executeRedirectQuery(query, [slug])
}

// Funções CRUD para grupos
export async function getAllGroupsRedirect() {
  const query = `SELECT * FROM redirect.groups ORDER BY created_at DESC`
  return executeRedirectQuery(query, [])
}

export async function getGroupByIdRedirect(id: string) {
  const query = `SELECT * FROM redirect.groups WHERE id = $1 LIMIT 1`
  return executeRedirectQuery(query, [id])
}

export async function createGroupRedirect(groupData: {
  name: string
  slug: string
  description?: string
  is_active: boolean
}) {
  const query = `
    INSERT INTO redirect.groups (name, slug, description, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `
  return executeRedirectQuery(query, [
    groupData.name,
    groupData.slug,
    groupData.description || null,
    groupData.is_active
  ])
}

export async function updateGroupRedirect(id: string, updates: any) {
  const fields = Object.keys(updates)
  const values = Object.values(updates)
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
  
  const query = `
    UPDATE redirect.groups 
    SET ${setClause}, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `
  return executeRedirectQuery(query, [id, ...values])
}

export async function deleteGroupRedirect(id: string) {
  const query = `DELETE FROM redirect.groups WHERE id = $1`
  return executeRedirectQuery(query, [id])
}

export async function checkSlugAvailabilityRedirect(slug: string, excludeId?: string) {
  let query = `SELECT COUNT(*) as count FROM redirect.groups WHERE slug = $1`
  const params = [slug]
  
  if (excludeId) {
    query += ` AND id != $2`
    params.push(excludeId)
  }
  
  return executeRedirectQuery(query, params)
}

// Função específica para buscar próximo número disponível
export async function getNextNumberRedirect(groupId: string) {
  const query = `
    SELECT id, phone, custom_message, last_used_at, created_at 
    FROM redirect.whatsapp_numbers 
    WHERE group_id = $1 AND is_active = true 
    ORDER BY last_used_at ASC NULLS FIRST, created_at ASC 
    LIMIT 1
  `
  return executeRedirectQuery(query, [groupId])
}

// Função específica para atualizar last_used_at
export async function updateLastUsedRedirect(numberId: string) {
  const query = `UPDATE redirect.whatsapp_numbers SET last_used_at = $1 WHERE id = $2`
  return executeRedirectQuery(query, [new Date().toISOString(), numberId])
}

// Função específica para registrar clique
export async function registerClickRedirect(clickData: {
  groupId: string
  numberPhone: string
  ipAddress?: string
  userAgent?: string
  deviceType?: string
  referrer?: string
}) {
  // Primeiro buscar o número pelo telefone
  const numberQuery = `SELECT id FROM redirect.whatsapp_numbers WHERE phone = $1 AND is_active = true LIMIT 1`
  const numberResult = await executeRedirectQuery(numberQuery, [clickData.numberPhone])
  
  if (!numberResult.data || numberResult.data.length === 0) {
    throw new Error(`Número não encontrado: ${clickData.numberPhone}`)
  }
  
  const numberId = numberResult.data[0].id
  
  // Registrar o clique
  const clickQuery = `
    INSERT INTO redirect.clicks (group_id, whatsapp_number_id, ip_address, user_agent, device_type, referrer, clicked_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `
  
  return executeRedirectQuery(clickQuery, [
    clickData.groupId,
    numberId,
    clickData.ipAddress,
    clickData.userAgent,
    clickData.deviceType,
    clickData.referrer,
    new Date().toISOString()
  ])
}

// CRUD functions for WhatsApp Numbers
export async function getAllNumbersRedirect() {
  const query = `
    SELECT wn.*, g.name as group_name 
    FROM redirect.whatsapp_numbers wn
    LEFT JOIN redirect.groups g ON wn.group_id = g.id
    ORDER BY wn.created_at DESC
  `
  return executeRedirectQuery(query)
}

export async function getNumbersByGroupIdRedirect(groupId: string) {
  const query = `
    SELECT * FROM redirect.whatsapp_numbers 
    WHERE group_id = $1 
    ORDER BY created_at DESC
  `
  return executeRedirectQuery(query, [groupId])
}

export async function getNumbersRedirect(groupId?: string) {
  let query = `SELECT * FROM redirect.whatsapp_numbers ORDER BY created_at DESC`
  const params: any[] = []
  
  if (groupId) {
    query = `SELECT * FROM redirect.whatsapp_numbers WHERE group_id = $1 ORDER BY created_at DESC`
    params.push(groupId)
  }
  
  return executeRedirectQuery(query, params)
}

export async function createNumberRedirect(numberData: {
  number: string
  description: string
  group_id: string
  is_active: boolean
  custom_message?: string
}) {
  const query = `
    INSERT INTO redirect.whatsapp_numbers (
      phone, name, group_id, is_active, custom_message
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `
  return executeRedirectQuery(query, [
    numberData.number,
    numberData.description,
    numberData.group_id,
    numberData.is_active,
    numberData.custom_message || null
  ])
}

export async function updateNumberRedirect(id: string, updates: any) {
  const fields = Object.keys(updates)
  const values = Object.values(updates)
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
  
  const query = `
    UPDATE redirect.whatsapp_numbers 
    SET ${setClause}, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `
  return executeRedirectQuery(query, [id, ...values])
}

export async function deleteNumberRedirect(id: string) {
  const query = `DELETE FROM redirect.whatsapp_numbers WHERE id = $1 RETURNING *`
  return executeRedirectQuery(query, [id])
}

export async function toggleNumberStatusRedirect(id: string, isActive: boolean) {
  const query = `
    UPDATE redirect.whatsapp_numbers 
    SET is_active = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `
  return executeRedirectQuery(query, [id, isActive])
}

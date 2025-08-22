import type { Group } from "@/lib/types"

export async function getGroups(): Promise<Group[]> {
  try {
    console.log('🔍 getGroups: Iniciando busca de grupos...')
    // Use URL relativa no cliente, absoluta no servidor
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/groups`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('🔍 getGroups: Resposta da API:', result)
    const data = result.success ? result.data : []
    console.log('🔍 getGroups: Retornando dados:', data || [])
    return data || []
  } catch (error) {
    console.error("Error in getGroups:", error)
    return []
  }
}

export async function getGroupById(id: string): Promise<Group | null> {
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/groups/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in getGroupById:", error)
    return null
  }
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/groups?slug=${slug}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in getGroupBySlug:", error)
    return null
  }
}

export async function createGroup(group: Omit<Group, "id" | "created_at" | "updated_at">): Promise<Group | null> {
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(group)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in createGroup:", error)
    return null
  }
}

export async function updateGroup(id: string, updates: Partial<Group>): Promise<Group | null> {
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/groups/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in updateGroup:", error)
    return null
  }
}

export async function deleteGroup(id: string): Promise<boolean> {
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/groups/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Error in deleteGroup:", error)
    return false
  }
}

export async function registerClick(clickData: {
  groupId: string
  numberPhone: string
  ipAddress?: string
  userAgent?: string
  deviceType?: string
  referrer?: string
}): Promise<boolean> {
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/clicks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clickData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Error in registerClick:", error)
    return false
  }
}

export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const url = excludeId ? `${baseUrl}/api/groups/check-slug?slug=${slug}&excludeId=${excludeId}` : `${baseUrl}/api/groups/check-slug?slug=${slug}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.available
  } catch (error) {
    console.error("Error in isSlugAvailable:", error)
    return false
  }
}

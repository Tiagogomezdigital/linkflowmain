import type { WhatsAppNumber } from "@/lib/types"

export async function getAllNumbers(): Promise<WhatsAppNumber[]> {
  try {
    console.log('🔍 getAllNumbers: Função chamada!')
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/numbers`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('🔍 getAllNumbers: Dados recebidos:', result)
    
    // Extrair os dados corretamente da resposta da API
    const data = result.success ? result.data : []
    console.log('📊 Números retornados:', data?.length || 0)
    
    return data || []
  } catch (error) {
    console.error("Error in getAllNumbers:", error)
    return []
  }
}

export async function getNumbersByGroupId(groupId: string): Promise<WhatsAppNumber[]> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Fetching numbers for group:", groupId)
    }

    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/numbers?groupId=${groupId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()

    if (process.env.NODE_ENV !== 'production') {
      console.log("Numbers API response:", result)
    }

    // Extrair os dados corretamente da resposta da API
    const data = result.success ? result.data : []
    
    if (process.env.NODE_ENV !== 'production') {
      console.log("Numbers fetched successfully:", data?.length || 0, "numbers")
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Error in getNumbersByGroupId:", error)
    }
    return []
  }
}

export async function getNumbers(groupId?: string): Promise<WhatsAppNumber[]> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Fetching numbers:", { groupId })
    }

    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const url = groupId ? `${baseUrl}/api/numbers?groupId=${groupId}` : `${baseUrl}/api/numbers`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()

    return data || []
  } catch (error) {
    console.error("Error in getNumbers:", error)
    return []
  }
}

export async function getNextNumber(groupSlug: string): Promise<{
  number_id: string;
  phone: string;
  final_message: string;
} | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Getting next number for group:", groupSlug)
    }

    // Em desenvolvimento, sempre usar localhost
    const baseUrl = typeof window !== 'undefined' ? '' : 
      (process.env.NODE_ENV === 'production' ? 
        (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') : 
        'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/numbers/next?groupSlug=${groupSlug}`)
    
    if (!response.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Error fetching next number:", response.status)
      }
      return null
    }
    
    const result = await response.json()

    if (process.env.NODE_ENV !== 'production') {
      console.log("Next number result:", result)
    }

    return result
  } catch (error) {
    console.error("Error in getNextNumber:", error)
    return null
  }
}

export async function createNumber(numberData: {
  number: string
  description: string
  group_id: string
  is_active: boolean
  custom_message?: string
}): Promise<WhatsAppNumber | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Creating number:", numberData)
    }

    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/numbers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(numberData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in createNumber:", error)
    return null
  }
}

export async function updateNumber(id: string, updates: Partial<WhatsAppNumber>): Promise<WhatsAppNumber | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Updating number:", { id, updates })
    }

    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/numbers/${id}`, {
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
    console.error("Error in updateNumber:", error)
    return null
  }
}

export async function deleteNumber(id: string): Promise<boolean> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Deleting number:", id)
    }

    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/numbers/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Error in deleteNumber:", error)
    return false
  }
}

export async function toggleNumberStatus(id: string, isActive: boolean): Promise<WhatsAppNumber | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Toggling number status:", { id, isActive })
    }

    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/numbers/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_active: isActive })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in toggleNumberStatus:", error)
    return null
  }
}

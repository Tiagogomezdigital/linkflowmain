import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabasePublic } from '@/lib/supabase'
import { getUltraSafeGroupAnalytics } from '@/lib/api/ultra-safe-analytics'

// Usar cliente admin se disponível, senão público
const supabase = supabaseAdmin ?? supabasePublic

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('🔍 API /api/analytics/group/[id] chamada para grupo:', id)
    
    // Usar a função ultra segura de analytics
    const result = await getUltraSafeGroupAnalytics(id)
    
    if (!result.success) {
      console.error('❌ Erro no analytics:', result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Erro ao carregar analytics' 
        },
        { status: 500 }
      )
    }
    
    console.log('✅ Analytics carregados com sucesso')
    
    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error: any) {
    console.error('❌ Erro na API /api/analytics/group/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}
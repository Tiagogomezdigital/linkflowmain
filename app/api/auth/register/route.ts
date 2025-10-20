import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth-custom'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuração do servidor indisponível' },
        { status: 500 }
      )
    }

    // Verificar se email já existe
    const checkEmailQuery = `
      SELECT id FROM redirect.users 
      WHERE email = '${email.replace(/'/g, "''")}'
    `
    
    const { data: existingUser, error: checkError } = await supabaseAdmin.rpc('execute_sql_select', {
      sql_query: checkEmailQuery
    })

    if (checkError) {
      console.error('Erro ao verificar email:', checkError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 409 }
      )
    }

    // Hash da senha
    const passwordHash = await hashPassword(password)

    // Inserir usuário
    const insertQuery = `
      INSERT INTO redirect.users (email, password_hash, name, is_active, created_at, updated_at)
      VALUES (
        '${email.replace(/'/g, "''")}',
        '${passwordHash.replace(/'/g, "''")}',
        '${name.replace(/'/g, "''")}',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, email, name, is_active, created_at, updated_at
    `

    const { data: newUser, error: insertError } = await supabaseAdmin.rpc('execute_sql_select', {
      sql_query: insertQuery
    })

    if (insertError || !newUser || newUser.length === 0) {
      console.error('Erro ao criar usuário:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    const userData = newUser[0]

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      }
    })
  } catch (error) {
    console.error('Erro no cadastro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
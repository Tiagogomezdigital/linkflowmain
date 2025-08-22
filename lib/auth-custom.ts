import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { executeRedirectQuery } from '@/lib/api/redirect-queries'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface User {
  id: number
  email: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

// Função para fazer hash da senha
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Função para verificar senha
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// Função para gerar JWT token
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Função para verificar JWT token
export function verifyToken(token: string): any {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Verificando token com JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...')
    }
    const result = jwt.verify(token, JWT_SECRET)
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Token verificado com sucesso')
    }
    return result
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Erro ao verificar token:', error)
    }
    return null
  }
}

// Função para buscar usuário por email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const query = `
      SELECT id, email, name, is_active, created_at, updated_at, last_login, password_hash
      FROM redirect.users 
      WHERE email = '${email}' AND is_active = true
    `
    
    const { data, error } = await executeRedirectQuery(query)
    
    if (error || !data || data.length === 0) {
      return null
    }
    
    const userData = data[0]
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      is_active: userData.is_active,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      last_login: userData.last_login
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}

// Função para buscar usuário por ID
export async function getUserById(id: number): Promise<User | null> {
  try {
    const query = `
      SELECT id, email, name, is_active, created_at, updated_at, last_login
      FROM redirect.users 
      WHERE id = ${id} AND is_active = true
    `
    
    const { data, error } = await executeRedirectQuery(query)
    
    if (error || !data || data.length === 0) {
      return null
    }
    
    return data[0] as User
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error)
    return null
  }
}

// Função principal de login
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
  try {
    const { email, password } = credentials
    
    // Usar Supabase diretamente para evitar problemas com a função executeRedirectQuery
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client não configurado')
    }

    const query = `
      SELECT id, email, name, is_active, created_at, updated_at, last_login, password_hash
      FROM redirect.users 
      WHERE email = '${email.replace(/'/g, "''")}'  AND is_active = true
    `
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Executando query de autenticação:', query)
    }
    
    const { data, error } = await supabaseAdmin.rpc('execute_sql_select', {
      sql_query: query
    })
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Resultado da query de autenticação:', { data, error })
      console.log('🔍 Dados do usuário encontrado:', data?.[0])
    }
    
    if (error || !data || data.length === 0) {
      return {
        success: false,
        error: 'Usuário não encontrado ou inativo'
      }
    }
    
    const userData = data[0]
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Password hash recebido:', userData.password_hash)
      console.log('🔍 Tipo do password hash:', typeof userData.password_hash)
    }
    
    // Verificar senha
    const isPasswordValid = await verifyPassword(password, userData.password_hash)
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Senha incorreta'
      }
    }
    
    // Atualizar last_login
    const updateQuery = `
      UPDATE redirect.users 
      SET last_login = NOW() 
      WHERE id = ${userData.id}
    `
    await executeRedirectQuery(updateQuery)
    
    // Criar objeto user sem password_hash
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      is_active: userData.is_active,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      last_login: new Date().toISOString()
    }
    
    // Gerar token
    const token = generateToken(user)
    
    return {
      success: true,
      user,
      token
    }
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}

// Função para validar sessão
export async function validateSession(token: string): Promise<User | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Validando sessão com token:', token.substring(0, 20) + '...')
    }
    
    const decoded = verifyToken(token)
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Token decodificado:', decoded)
    }
    
    if (!decoded || !decoded.id) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Token inválido ou sem ID')
      }
      return null
    }
    
    const user = await getUserById(decoded.id)
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Usuário encontrado:', user ? 'Sim' : 'Não')
    }
    
    return user
  } catch (error) {
    console.error('❌ Erro ao validar sessão:', error)
    return null
  }
}
export interface Connection {
  id: string
  name: string
  type: string
  host: string
  port: number
  database: string
  username: string
  createdAt: string
  lastUsed?: string
}

export interface QueryResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
}

export interface DatabaseConfig {
  type: string
  host: string
  port: number
  database: string
  username: string
  password: string
  saveConnection?: boolean
} 

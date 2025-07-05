export interface DatabaseConfig {
  type: string
  host: string
  port: number
  database: string
  username: string
  password: string
  [key: string]: any // Additional database-specific options
}

export interface ConnectionResult {
  success: boolean
  message: string
  connectionId?: string
  error?: string
}

export interface QueryResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
}

export interface DatabaseManagerInterface {
  // Connection management
  connect(config: DatabaseConfig, connectionId: string): Promise<ConnectionResult>
  disconnect(connectionId: string): Promise<{ success: boolean; message: string }>
  isConnected(connectionId: string): boolean

  // Query execution
  query(connectionId: string, sql: string): Promise<QueryResult>

  // Metadata operations
  getDatabases(
    connectionId: string
  ): Promise<{ success: boolean; databases?: string[]; message: string }>
  getTables(
    connectionId: string,
    database?: string
  ): Promise<{ success: boolean; tables?: string[]; message: string }>
  getTableSchema(
    connectionId: string,
    tableName: string,
    database?: string
  ): Promise<{ success: boolean; schema?: any[]; message: string }>

  // Connection info
  getConnectionInfo(connectionId: string): { host: string; port: number; database: string } | null
  getAllConnections(): string[]

  // Cleanup
  cleanup(): Promise<void>
}

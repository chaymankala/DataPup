import { DatabaseManagerInterface, DatabaseConfig, ConnectionResult, QueryResult } from './interface'
import { DatabaseManagerFactory } from './factory'

class DatabaseManager {
  private factory: DatabaseManagerFactory
  private activeConnections: Map<string, { type: string; manager: DatabaseManagerInterface }> = new Map()

  constructor() {
    this.factory = new DatabaseManagerFactory()
  }

  async connect(config: DatabaseConfig, connectionId: string): Promise<ConnectionResult> {
    try {
      // Check if database type is supported
      if (!this.factory.isSupported(config.type)) {
        return {
          success: false,
          message: `Unsupported database type: ${config.type}`,
          error: 'Database type not supported'
        }
      }

      // Get the appropriate manager
      const manager = this.factory.getManager(config.type)
      if (!manager) {
        return {
          success: false,
          message: `Failed to get manager for database type: ${config.type}`,
          error: 'Manager not available'
        }
      }

      // Connect using the specific manager
      const result = await manager.connect(config, connectionId)
      
      if (result.success) {
        // Store the connection mapping
        this.activeConnections.set(connectionId, {
          type: config.type,
          manager: manager
        })
      }
      
      return result
    } catch (error) {
      console.error('Database connection error:', error)
      return {
        success: false,
        message: 'Failed to connect to database',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async disconnect(connectionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const connection = this.activeConnections.get(connectionId)
      if (!connection) {
        return { success: false, message: 'Connection not found' }
      }

      // Disconnect using the specific manager
      const result = await connection.manager.disconnect(connectionId)
      
      if (result.success) {
        // Remove from active connections
        this.activeConnections.delete(connectionId)
      }

      return result
    } catch (error) {
      console.error('Database disconnection error:', error)
      return {
        success: false,
        message: 'Failed to disconnect from database'
      }
    }
  }

  async query(connectionId: string, sql: string): Promise<QueryResult> {
    try {
      const connection = this.activeConnections.get(connectionId)
      if (!connection) {
        return {
          success: false,
          message: 'Connection not found. Please connect first.',
          error: 'No active connection'
        }
      }

      // Execute query using the specific manager
      return await connection.manager.query(connectionId, sql)
    } catch (error) {
      console.error('Database query error:', error)
      return {
        success: false,
        message: 'Query execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getDatabases(connectionId: string): Promise<{ success: boolean; databases?: string[]; message: string }> {
    try {
      const connection = this.activeConnections.get(connectionId)
      if (!connection) {
        return {
          success: false,
          message: 'Connection not found. Please connect first.'
        }
      }

      return await connection.manager.getDatabases(connectionId)
    } catch (error) {
      console.error('Error getting databases:', error)
      return {
        success: false,
        message: 'Failed to get databases'
      }
    }
  }

  async getTables(connectionId: string, database?: string): Promise<{ success: boolean; tables?: string[]; message: string }> {
    try {
      const connection = this.activeConnections.get(connectionId)
      if (!connection) {
        return {
          success: false,
          message: 'Connection not found. Please connect first.'
        }
      }

      return await connection.manager.getTables(connectionId, database)
    } catch (error) {
      console.error('Error getting tables:', error)
      return {
        success: false,
        message: 'Failed to get tables'
      }
    }
  }

  async getTableSchema(connectionId: string, tableName: string, database?: string): Promise<{ success: boolean; schema?: any[]; message: string }> {
    try {
      const connection = this.activeConnections.get(connectionId)
      if (!connection) {
        return {
          success: false,
          message: 'Connection not found. Please connect first.'
        }
      }

      return await connection.manager.getTableSchema(connectionId, tableName, database)
    } catch (error) {
      console.error('Error getting table schema:', error)
      return {
        success: false,
        message: 'Failed to get table schema'
      }
    }
  }

  isConnected(connectionId: string): boolean {
    const connection = this.activeConnections.get(connectionId)
    if (!connection) return false

    return connection.manager.isConnected(connectionId)
  }

  getConnectionInfo(connectionId: string): { type: string; host: string; port: number; database: string } | null {
    const connection = this.activeConnections.get(connectionId)
    if (!connection) return null

    const info = connection.manager.getConnectionInfo(connectionId)
    return info ? { type: connection.type, ...info } : null
  }

  getAllConnections(): string[] {
    return Array.from(this.activeConnections.keys())
  }

  getSupportedDatabaseTypes(): string[] {
    return this.factory.getSupportedTypes()
  }

  // Clean up all connections
  async cleanup(): Promise<void> {
    const disconnectPromises = Array.from(this.activeConnections.keys()).map(id => this.disconnect(id))
    await Promise.allSettled(disconnectPromises)
  }
}

export { DatabaseManager } 
import { DatabaseManagerInterface, DatabaseConfig, ConnectionResult, QueryResult } from './interface'
import { DatabaseManagerFactory } from './factory'

class DatabaseManager {
  private factory: DatabaseManagerFactory
  private activeConnection: { id: string; type: string; manager: DatabaseManagerInterface } | null = null

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

      // Disconnect any existing connection first
      if (this.activeConnection) {
        await this.disconnect(this.activeConnection.id)
      }

      // Connect using the specific manager
      const result = await manager.connect(config, connectionId)
      
      if (result.success) {
        // Store the single active connection
        this.activeConnection = {
          id: connectionId,
          type: config.type,
          manager: manager
        }
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
      if (!this.activeConnection || this.activeConnection.id !== connectionId) {
        return { success: false, message: 'Connection not found' }
      }

      // Disconnect using the specific manager
      const result = await this.activeConnection.manager.disconnect(connectionId)
      
      if (result.success) {
        // Clear the active connection
        this.activeConnection = null
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
      if (!this.activeConnection || this.activeConnection.id !== connectionId) {
        return {
          success: false,
          message: 'Connection not found. Please connect first.',
          error: 'No active connection'
        }
      }

      // Execute query using the specific manager
      return await this.activeConnection.manager.query(connectionId, sql)
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
      if (!this.activeConnection || this.activeConnection.id !== connectionId) {
        return {
          success: false,
          message: 'Connection not found. Please connect first.'
        }
      }

      return await this.activeConnection.manager.getDatabases(connectionId)
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
      if (!this.activeConnection || this.activeConnection.id !== connectionId) {
        return {
          success: false,
          message: 'Connection not found. Please connect first.'
        }
      }

      return await this.activeConnection.manager.getTables(connectionId, database)
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
      if (!this.activeConnection || this.activeConnection.id !== connectionId) {
        return {
          success: false,
          message: 'Connection not found. Please connect first.'
        }
      }

      return await this.activeConnection.manager.getTableSchema(connectionId, tableName, database)
    } catch (error) {
      console.error('Error getting table schema:', error)
      return {
        success: false,
        message: 'Failed to get table schema'
      }
    }
  }

  isConnected(connectionId: string): boolean {
    if (!this.activeConnection || this.activeConnection.id !== connectionId) return false

    return this.activeConnection.manager.isConnected(connectionId)
  }

  getConnectionInfo(connectionId: string): { type: string; host: string; port: number; database: string } | null {
    if (!this.activeConnection || this.activeConnection.id !== connectionId) return null

    const info = this.activeConnection.manager.getConnectionInfo(connectionId)
    return info ? { type: this.activeConnection.type, ...info } : null
  }

  getActiveConnection(): string | null {
    return this.activeConnection ? this.activeConnection.id : null
  }

  getAllConnections(): string[] {
    const allConnections: string[] = []
    
    // Get connections from all database manager instances
    const supportedTypes = this.factory.getSupportedTypes()
    
    for (const dbType of supportedTypes) {
      const manager = this.factory.getManager(dbType)
      if (manager) {
        try {
          const connections = manager.getAllConnections()
          allConnections.push(...connections)
        } catch (error) {
          console.error(`Error getting connections from ${dbType} manager:`, error)
        }
      }
    }
    
    return allConnections
  }

  getSupportedDatabaseTypes(): string[] {
    return this.factory.getSupportedTypes()
  }

  // Clean up the active connection
  async cleanup(): Promise<void> {
    if (this.activeConnection) {
      await this.disconnect(this.activeConnection.id)
    }
  }
}

export { DatabaseManager } 

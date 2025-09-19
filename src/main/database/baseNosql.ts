import {
  DatabaseManagerInterface,
  DatabaseConfig,
  ConnectionResult,
  QueryResult,
  QueryType,
  InsertResult,
  UpdateResult,
  DeleteResult,
  TableSchema,
  DatabaseCapabilities,
  TransactionHandle,
  BulkOperation,
  BulkOperationResult,
  TableQueryOptions,
  TableFilter
} from './interface'

export abstract class BaseDatabaseManagerNoSQL implements DatabaseManagerInterface {
  protected connections: Map<string, any> = new Map()
  protected readonlyConnections: Set<string> = new Set()
  protected activeOps: Map<string, AbortController> = new Map()

  abstract connect(config: DatabaseConfig, connectionId: string): Promise<ConnectionResult>
  abstract disconnect(connectionId: string): Promise<{ success: boolean; message: string }>
  abstract cleanup(): Promise<void>

  isConnected(connectionId: string): boolean {
    return this.connections.has(connectionId)
  }

  isReadOnly(connectionId: string): boolean {
    return this.readonlyConnections.has(connectionId)
  }

  // Treat `sql` as NoSQL text (e.g., JSON/MQL) if a subclass wishes, else return an error by default
  async query(_connectionId: string, _sql: string, _sessionId?: string): Promise<QueryResult> {
    return this.createQueryResult(
      false,
      'Freeform text query not supported for this NoSQL database'
    )
  }

  async cancelQuery(
    _connectionId: string,
    queryId: string
  ): Promise<{ success: boolean; message: string }> {
    const ctl = this.activeOps.get(queryId)
    if (ctl) {
      ctl.abort()
      this.activeOps.delete(queryId)
    }
    return { success: true, message: 'Cancellation requested' }
  }

  // Default NoSQL table/collection querying should be implemented by subclass
  abstract queryTable(
    connectionId: string,
    options: TableQueryOptions,
    sessionId?: string
  ): Promise<QueryResult>

  abstract insertRow(
    connectionId: string,
    table: string,
    data: Record<string, any>,
    database?: string
  ): Promise<InsertResult>

  abstract updateRow(
    connectionId: string,
    table: string,
    primaryKey: Record<string, any>,
    updates: Record<string, any>,
    database?: string
  ): Promise<UpdateResult>

  abstract deleteRow(
    connectionId: string,
    table: string,
    primaryKey: Record<string, any>,
    database?: string
  ): Promise<DeleteResult>

  abstract getDatabases(
    connectionId: string
  ): Promise<{ success: boolean; databases?: string[]; message: string }>
  abstract getTables(
    connectionId: string,
    database?: string
  ): Promise<{ success: boolean; tables?: string[]; message: string }>
  abstract getTableSchema(
    connectionId: string,
    tableName: string,
    database?: string
  ): Promise<{ success: boolean; schema?: any[]; message: string }>

  async getTableFullSchema(
    connectionId: string,
    tableName: string,
    database?: string
  ): Promise<{ success: boolean; schema?: TableSchema; message: string }> {
    // Subclasses should provide a better schema by sampling and inferring types
    return { success: false, message: 'Not implemented' }
  }

  async getPrimaryKeys(connectionId: string, table: string, database?: string): Promise<string[]> {
    // Default for NoSQL: assume _id exists
    return ['_id']
  }

  getConnectionInfo(
    connectionId: string
  ): { host: string; port: number; database: string; type: string } | null {
    const connection = this.connections.get(connectionId)
    if (!connection) return null

    return {
      host: connection.config.host,
      port: connection.config.port,
      database: connection.config.database,
      type: connection.config.type
    }
  }

  getAllConnections(): string[] {
    return Array.from(this.connections.keys())
  }

  getCapabilities(): DatabaseCapabilities {
    return {
      supportsTransactions: false,
      supportsBatchOperations: true,
      supportsReturning: false,
      supportsUpsert: true,
      supportsSchemas: false,
      requiresPrimaryKey: false
    }
  }

  async supportsTransactions(_connectionId: string): Promise<boolean> {
    return this.getCapabilities().supportsTransactions
  }

  async beginTransaction(_connectionId: string): Promise<TransactionHandle> {
    throw new Error('Transactions not supported by this NoSQL database')
  }

  async executeBulkOperations(
    _connectionId: string,
    _operations: BulkOperation[]
  ): Promise<BulkOperationResult> {
    return {
      success: false,
      results: [],
      error: 'Bulk operations not implemented for this NoSQL database'
    }
  }

  protected toDocumentFilter(filters?: TableFilter[]): Record<string, any> {
    const query: Record<string, any> = {}
    if (!filters) return query
    for (const f of filters) {
      const field = f.column
      switch (f.operator) {
        case '=':
          query[field] = f.value
          break
        case '!=':
          query[field] = { $ne: f.value }
          break
        case '>':
          query[field] = { $gt: f.value }
          break
        case '<':
          query[field] = { $lt: f.value }
          break
        case '>=':
          query[field] = { $gte: f.value }
          break
        case '<=':
          query[field] = { $lte: f.value }
          break
        case 'IN':
          query[field] = { $in: Array.isArray(f.value) ? f.value : [f.value] }
          break
        case 'NOT IN':
          query[field] = { $nin: Array.isArray(f.value) ? f.value : [f.value] }
          break
        case 'LIKE': {
          const pattern = String(f.value ?? '').replace(/%/g, '.*')
          query[field] = { $regex: pattern, $options: 'i' }
          break
        }
        case 'NOT LIKE': {
          const pattern = String(f.value ?? '').replace(/%/g, '.*')
          query[field] = { $not: { $regex: pattern, $options: 'i' } }
          break
        }
        case 'IS NULL':
          query[field] = null
          break
        case 'IS NOT NULL':
          query[field] = { $ne: null }
          break
        case 'BETWEEN': {
          const [a, b] = Array.isArray(f.value) ? f.value : []
          if (a !== undefined && b !== undefined) query[field] = { $gte: a, $lte: b }
          break
        }
        case 'NOT BETWEEN': {
          const [a, b] = Array.isArray(f.value) ? f.value : []
          if (a !== undefined && b !== undefined) query[field] = { $not: { $gte: a, $lte: b } }
          break
        }
        default:
          break
      }
    }
    return query
  }

  protected createQueryResult(
    success: boolean,
    message: string,
    data?: any[],
    error?: string,
    queryType?: QueryType,
    affectedRows?: number
  ): QueryResult {
    const isDDL = false
    const isDML = [QueryType.INSERT, QueryType.UPDATE, QueryType.DELETE].includes(
      queryType || QueryType.OTHER
    )
    return {
      success,
      message,
      data,
      error,
      queryType,
      affectedRows,
      isDDL,
      isDML
    }
  }
}

export type { TableQueryOptions }

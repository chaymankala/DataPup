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
  DatabaseCapabilities
} from './interface'

export abstract class BaseDatabaseManager implements DatabaseManagerInterface {
  protected connections: Map<string, any> = new Map()
  protected readonlyConnections: Set<string> = new Set()

  abstract connect(config: DatabaseConfig, connectionId: string): Promise<ConnectionResult>
  abstract disconnect(connectionId: string): Promise<{ success: boolean; message: string }>
  abstract getCapabilities(): DatabaseCapabilities

  isConnected(connectionId: string): boolean {
    return this.connections.has(connectionId)
  }

  isReadOnly(connectionId: string): boolean {
    return this.readonlyConnections.has(connectionId)
  }

  protected detectQueryType(sql: string): QueryType {
    const trimmedSql = sql.trim().toUpperCase()

    if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('WITH')) {
      return QueryType.SELECT
    } else if (trimmedSql.startsWith('INSERT')) {
      return QueryType.INSERT
    } else if (trimmedSql.startsWith('UPDATE')) {
      return QueryType.UPDATE
    } else if (trimmedSql.startsWith('DELETE')) {
      return QueryType.DELETE
    } else if (trimmedSql.match(/^(CREATE|DROP|ALTER|TRUNCATE|RENAME|COMMENT)\s/)) {
      return QueryType.DDL
    } else if (trimmedSql.match(/^(SHOW|DESCRIBE|DESC|EXPLAIN)\s/)) {
      return QueryType.SYSTEM
    }

    return QueryType.OTHER
  }

  protected validateReadOnlyQuery(
    connectionId: string,
    sql: string
  ): { valid: boolean; error?: string } {
    if (!this.isReadOnly(connectionId)) {
      return { valid: true }
    }

    const queryType = this.detectQueryType(sql)
    const allowedTypes = [QueryType.SELECT, QueryType.SYSTEM]

    if (!allowedTypes.includes(queryType)) {
      return {
        valid: false,
        error: `Read-only connection: ${queryType} queries are not allowed`
      }
    }

    return { valid: true }
  }

  protected createQueryResult(
    success: boolean,
    message: string,
    data?: any[],
    error?: string,
    queryType?: QueryType,
    affectedRows?: number
  ): QueryResult {
    const isDDL = queryType === QueryType.DDL
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

  abstract query(connectionId: string, sql: string): Promise<QueryResult>

  async insertRow(
    connectionId: string,
    table: string,
    data: Record<string, any>,
    database?: string
  ): Promise<InsertResult> {
    // Default implementation - can be overridden by specific database managers
    const columns = Object.keys(data)
    const values = Object.values(data)

    const qualifiedTable = database ? `${database}.${table}` : table

    // Note: This is a basic implementation. Real implementations should use parameterized queries
    const escapedValues = values
      .map((v) => (typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v))
      .join(', ')
    const finalSql = `INSERT INTO ${qualifiedTable} (${columns.join(', ')}) VALUES (${escapedValues})`

    const result = await this.query(connectionId, finalSql)
    return result as InsertResult
  }

  async updateRow(
    connectionId: string,
    table: string,
    primaryKey: Record<string, any>,
    updates: Record<string, any>,
    database?: string
  ): Promise<UpdateResult> {
    const setClauses = Object.entries(updates).map(([col, val]) => {
      const escapedVal = typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
      return `${col} = ${escapedVal}`
    })

    const whereClauses = Object.entries(primaryKey).map(([col, val]) => {
      const escapedVal = typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
      return `${col} = ${escapedVal}`
    })

    const qualifiedTable = database ? `${database}.${table}` : table
    const sql = `UPDATE ${qualifiedTable} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`

    const result = await this.query(connectionId, sql)
    return result as UpdateResult
  }

  async deleteRow(
    connectionId: string,
    table: string,
    primaryKey: Record<string, any>,
    database?: string
  ): Promise<DeleteResult> {
    const whereClauses = Object.entries(primaryKey).map(([col, val]) => {
      const escapedVal = typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
      return `${col} = ${escapedVal}`
    })

    const qualifiedTable = database ? `${database}.${table}` : table
    const sql = `DELETE FROM ${qualifiedTable} WHERE ${whereClauses.join(' AND ')}`

    const result = await this.query(connectionId, sql)
    return result as DeleteResult
  }

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

  abstract getTableFullSchema(
    connectionId: string,
    tableName: string,
    database?: string
  ): Promise<{ success: boolean; schema?: TableSchema; message: string }>

  getConnectionInfo(connectionId: string): { host: string; port: number; database: string } | null {
    const connection = this.connections.get(connectionId)
    if (!connection) return null

    return {
      host: connection.config.host,
      port: connection.config.port,
      database: connection.config.database
    }
  }

  getAllConnections(): string[] {
    return Array.from(this.connections.keys())
  }

  abstract cleanup(): Promise<void>
}

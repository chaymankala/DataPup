import type { DatabaseSchema, TableInfo, ColumnInfo } from '../types'

export class DatabaseSchemaCache {
  private connectionId: string
  private cache: DatabaseSchema | null = null
  private lastFetch: number = 0
  private cacheTimeout: number
  private fetchPromise: Promise<DatabaseSchema> | null = null

  constructor(connectionId: string, cacheTimeout = 5 * 60 * 1000) {
    this.connectionId = connectionId
    this.cacheTimeout = cacheTimeout
  }

  async getSchema(): Promise<DatabaseSchema> {
    const now = Date.now()

    if (this.cache && now - this.lastFetch < this.cacheTimeout) {
      return this.cache
    }

    if (this.fetchPromise) {
      return this.fetchPromise
    }

    this.fetchPromise = this.fetchSchema()

    try {
      const schema = await this.fetchPromise
      this.cache = schema
      this.lastFetch = now
      return schema
    } finally {
      this.fetchPromise = null
    }
  }

  private async fetchSchema(): Promise<DatabaseSchema> {
    try {
      console.log('Fetching schema for connection:', this.connectionId)
      const [databasesResult, tablesMap] = await Promise.all([
        window.api.database.getDatabases(this.connectionId),
        this.fetchAllTables()
      ])

      console.log('Databases result:', databasesResult)

      const databases =
        databasesResult.success && databasesResult.databases ? databasesResult.databases : []

      const schema: DatabaseSchema = {
        databases,
        tables: tablesMap,
        functions: [],
        keywords: []
      }

      console.log('Schema fetched:', {
        databases: schema.databases.length,
        tables: schema.tables.size
      })
      return schema
    } catch (error) {
      console.error('Error fetching schema:', error)
      return {
        databases: [],
        tables: new Map(),
        functions: [],
        keywords: []
      }
    }
  }

  private async fetchAllTables(): Promise<Map<string, TableInfo>> {
    const tablesMap = new Map<string, TableInfo>()

    try {
      const databasesResult = await window.api.database.getDatabases(this.connectionId)
      if (!databasesResult.success || !databasesResult.databases) {
        return tablesMap
      }

      const tablePromises = databasesResult.databases.map(async (database) => {
        const tablesResult = await window.api.database.getTables(this.connectionId, database)
        if (!tablesResult.success || !tablesResult.tables) {
          return []
        }

        const schemaPromises = tablesResult.tables.map(async (tableName) => {
          const schemaResult = await window.api.database.getTableSchema(
            this.connectionId,
            tableName,
            database
          )

          if (!schemaResult.success || !schemaResult.schema) {
            return null
          }

          const columns: ColumnInfo[] = schemaResult.schema.map((col: any) => ({
            name: col.name,
            type: col.type,
            nullable: col.nullable ?? true,
            default: col.default_expression || col.default,
            comment: col.comment
          }))

          const tableInfo: TableInfo = {
            database,
            name: tableName,
            columns
          }

          return { key: `${database}.${tableName}`, value: tableInfo }
        })

        const results = await Promise.all(schemaPromises)
        return results.filter((r) => r !== null)
      })

      const allResults = await Promise.all(tablePromises)
      allResults.flat().forEach((result) => {
        if (result) {
          tablesMap.set(result.key, result.value)
        }
      })
    } catch (error) {
      console.error('Error fetching tables:', error)
    }

    return tablesMap
  }

  invalidate() {
    this.cache = null
    this.lastFetch = 0
  }

  dispose() {
    this.cache = null
    this.fetchPromise = null
  }
}

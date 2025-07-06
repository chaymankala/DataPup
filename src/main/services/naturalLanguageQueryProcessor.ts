import { GeminiService, QueryGenerationRequest, QueryGenerationResponse, DatabaseSchema } from './gemini'
import { SchemaIntrospector } from './schemaIntrospector'
import { DatabaseManager } from '../database/manager'
import { QueryResult } from '../database/interface'

interface NaturalLanguageQueryRequest {
  connectionId: string
  naturalLanguageQuery: string
  database?: string
  includeSampleData?: boolean
  maxSampleRows?: number
}

interface NaturalLanguageQueryResponse {
  success: boolean
  sqlQuery?: string
  explanation?: string
  queryResult?: QueryResult
  error?: string
}

class NaturalLanguageQueryProcessor {
  private geminiService: GeminiService
  private schemaIntrospector: SchemaIntrospector
  private databaseManager: DatabaseManager

  constructor(databaseManager: DatabaseManager, geminiApiKey?: string) {
    this.databaseManager = databaseManager
    this.schemaIntrospector = new SchemaIntrospector(databaseManager)
    this.geminiService = new GeminiService(geminiApiKey)
  }

  async processNaturalLanguageQuery(request: NaturalLanguageQueryRequest): Promise<NaturalLanguageQueryResponse> {
    try {
      const { connectionId, naturalLanguageQuery, database, includeSampleData = true, maxSampleRows = 3 } = request

      // Check if connection is active
      if (!this.databaseManager.isConnected(connectionId)) {
        return {
          success: false,
          error: 'Database connection is not active. Please reconnect and try again.'
        }
      }

      // Get database schema
      console.log('Getting database schema...')
      const schema = await this.schemaIntrospector.getDatabaseSchema(connectionId, database)
      if (!schema) {
        return {
          success: false,
          error: 'Failed to retrieve database schema. Please check your connection.'
        }
      }

      // Get sample data if requested
      let sampleData: Record<string, any[]> = {}
      if (includeSampleData) {
        console.log('Getting sample data...')
        const tableNames = schema.tables.map(table => table.name)
        sampleData = await this.schemaIntrospector.getSampleData(connectionId, schema.database, tableNames, maxSampleRows)
      }

      // Get database type from connection info
      const connectionInfo = this.databaseManager.getConnectionInfo(connectionId)
      const databaseType = connectionInfo ? this.getDatabaseTypeFromConnection(connectionInfo) : 'clickhouse'

      // Generate SQL query using Gemini
      console.log('Generating SQL query with Gemini...')
      const generationRequest: QueryGenerationRequest = {
        naturalLanguageQuery,
        databaseSchema: schema,
        databaseType,
        sampleData: Object.keys(sampleData).length > 0 ? sampleData : undefined
      }

      const generationResponse = await this.geminiService.generateSQLQuery(generationRequest)

      if (!generationResponse.success || !generationResponse.sqlQuery) {
        return {
          success: false,
          error: generationResponse.error || 'Failed to generate SQL query'
        }
      }

      // Execute the generated SQL query
      console.log('Executing generated SQL query...')
      const queryResult = await this.databaseManager.query(connectionId, generationResponse.sqlQuery)

      return {
        success: true,
        sqlQuery: generationResponse.sqlQuery,
        explanation: generationResponse.explanation,
        queryResult
      }

    } catch (error) {
      console.error('Error processing natural language query:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async generateSQLOnly(request: NaturalLanguageQueryRequest): Promise<QueryGenerationResponse> {
    try {
      const { connectionId, naturalLanguageQuery, database, includeSampleData = true, maxSampleRows = 3 } = request

      // Check if connection is active
      if (!this.databaseManager.isConnected(connectionId)) {
        return {
          success: false,
          error: 'Database connection is not active. Please reconnect and try again.'
        }
      }

      // Get database schema
      const schema = await this.schemaIntrospector.getDatabaseSchema(connectionId, database)
      if (!schema) {
        return {
          success: false,
          error: 'Failed to retrieve database schema. Please check your connection.'
        }
      }

      // Get sample data if requested
      let sampleData: Record<string, any[]> = {}
      if (includeSampleData) {
        const tableNames = schema.tables.map(table => table.name)
        sampleData = await this.schemaIntrospector.getSampleData(connectionId, schema.database, tableNames, maxSampleRows)
      }

      // Get database type from connection info
      const connectionInfo = this.databaseManager.getConnectionInfo(connectionId)
      const databaseType = connectionInfo ? this.getDatabaseTypeFromConnection(connectionInfo) : 'clickhouse'

      // Generate SQL query using Gemini
      const generationRequest: QueryGenerationRequest = {
        naturalLanguageQuery,
        databaseSchema: schema,
        databaseType,
        sampleData: Object.keys(sampleData).length > 0 ? sampleData : undefined
      }

      return await this.geminiService.generateSQLQuery(generationRequest)

    } catch (error) {
      console.error('Error generating SQL only:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getDatabaseSchema(connectionId: string, database?: string): Promise<DatabaseSchema | null> {
    return await this.schemaIntrospector.getDatabaseSchema(connectionId, database)
  }

  async validateGeneratedQuery(sql: string, connectionId: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const connectionInfo = this.databaseManager.getConnectionInfo(connectionId)
      const databaseType = connectionInfo ? this.getDatabaseTypeFromConnection(connectionInfo) : 'clickhouse'

      return await this.geminiService.validateQuery(sql, databaseType)
    } catch (error) {
      console.error('Error validating query:', error)
      return { isValid: false, error: 'Failed to validate query' }
    }
  }

  private getDatabaseTypeFromConnection(connectionInfo: { host: string; port: number; database: string }): string {
    // For now, we only support ClickHouse, but this can be extended
    // In the future, we could store the database type in the connection info
    return 'clickhouse'
  }

  formatSchemaForDisplay(schema: DatabaseSchema): string {
    return this.schemaIntrospector.formatSchemaForDisplay(schema)
  }
}

export { NaturalLanguageQueryProcessor }
export type { NaturalLanguageQueryRequest, NaturalLanguageQueryResponse }

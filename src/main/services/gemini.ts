import { GoogleGenerativeAI } from '@google/generative-ai'

interface DatabaseSchema {
  database: string
  tables: TableSchema[]
}

interface TableSchema {
  name: string
  columns: ColumnSchema[]
}

interface ColumnSchema {
  name: string
  type: string
  nullable?: boolean
  default?: string
}

interface QueryGenerationRequest {
  naturalLanguageQuery: string
  databaseSchema: DatabaseSchema
  databaseType: string
  sampleData?: Record<string, any[]>
}

interface QueryGenerationResponse {
  success: boolean
  sqlQuery?: string
  explanation?: string
  error?: string
}

class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY
    if (!key) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable or pass it to the constructor.')
    }

    this.genAI = new GoogleGenerativeAI(key)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async generateSQLQuery(request: QueryGenerationRequest): Promise<QueryGenerationResponse> {
    try {
      const prompt = this.buildPrompt(request)

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the response to extract SQL and explanation
      const parsed = this.parseResponse(text)

      return {
        success: true,
        sqlQuery: parsed.sql,
        explanation: parsed.explanation
      }
    } catch (error) {
      console.error('Error generating SQL query:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private buildPrompt(request: QueryGenerationRequest): string {
    const { naturalLanguageQuery, databaseSchema, databaseType, sampleData } = request

    let prompt = `You are a SQL expert specializing in ${databaseType.toUpperCase()} databases.
Your task is to convert natural language queries into accurate SQL statements.

DATABASE SCHEMA:
${this.formatSchema(databaseSchema)}

${sampleData ? `SAMPLE DATA:
${this.formatSampleData(sampleData)}

` : ''}NATURAL LANGUAGE QUERY:
"${naturalLanguageQuery}"

Please generate a ${databaseType.toUpperCase()} SQL query that answers this question.

IMPORTANT INSTRUCTIONS:
1. Use only the tables and columns provided in the schema
2. Follow ${databaseType.toUpperCase()} syntax and best practices
3. If the query involves aggregations, use appropriate functions (COUNT, SUM, AVG, etc.)
4. If the query involves date/time operations, use ${databaseType.toUpperCase()} date functions
5. If the query is ambiguous, make reasonable assumptions and explain them
6. Always include a brief explanation of what the query does

RESPONSE FORMAT:
SQL: [Your SQL query here]
Explanation: [Brief explanation of what the query does]`

    return prompt
  }

  private formatSchema(schema: DatabaseSchema): string {
    let formatted = `Database: ${schema.database}\n\n`

    for (const table of schema.tables) {
      formatted += `Table: ${table.name}\n`
      for (const column of table.columns) {
        const nullable = column.nullable !== undefined ? (column.nullable ? 'NULL' : 'NOT NULL') : ''
        const defaultValue = column.default ? ` DEFAULT ${column.default}` : ''
        formatted += `  - ${column.name}: ${column.type}${nullable}${defaultValue}\n`
      }
      formatted += '\n'
    }

    return formatted
  }

  private formatSampleData(sampleData: Record<string, any[]>): string {
    let formatted = ''

    for (const [tableName, rows] of Object.entries(sampleData)) {
      if (rows.length > 0) {
        formatted += `Table: ${tableName}\n`
        const columns = Object.keys(rows[0])
        formatted += `Columns: ${columns.join(', ')}\n`
        formatted += 'Sample rows:\n'

        // Show first 3 rows as examples
        const sampleRows = rows.slice(0, 3)
        for (const row of sampleRows) {
          const values = columns.map(col => row[col]).join(', ')
          formatted += `  [${values}]\n`
        }
        formatted += '\n'
      }
    }

    return formatted
  }

  private parseResponse(response: string): { sql: string; explanation: string } {
    const lines = response.split('\n')
    let sql = ''
    let explanation = ''
    let inSqlSection = false
    let inExplanationSection = false

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (trimmedLine.startsWith('SQL:')) {
        inSqlSection = true
        inExplanationSection = false
        sql = trimmedLine.substring(4).trim()
      } else if (trimmedLine.startsWith('Explanation:')) {
        inSqlSection = false
        inExplanationSection = true
        explanation = trimmedLine.substring(12).trim()
      } else if (inSqlSection && trimmedLine) {
        sql += ' ' + trimmedLine
      } else if (inExplanationSection && trimmedLine) {
        explanation += ' ' + trimmedLine
      }
    }

    // If we couldn't parse the structured format, try to extract SQL from the response
    if (!sql) {
      const sqlMatch = response.match(/```sql\s*([\s\S]*?)\s*```/)
      if (sqlMatch) {
        sql = sqlMatch[1].trim()
      } else {
        // Fallback: try to find SQL-like content
        const lines = response.split('\n')
        for (const line of lines) {
          if (line.trim().toUpperCase().startsWith('SELECT') ||
              line.trim().toUpperCase().startsWith('WITH')) {
            sql = line.trim()
            break
          }
        }
      }
    }

    return { sql, explanation }
  }

  async validateQuery(sql: string, databaseType: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const prompt = `You are a SQL validator. Please validate this ${databaseType.toUpperCase()} SQL query and return only "VALID" if it's syntactically correct, or a brief error message if it's not.

Query: ${sql}

Response:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text().trim()

      if (text.toUpperCase() === 'VALID') {
        return { isValid: true }
      } else {
        return { isValid: false, error: text }
      }
    } catch (error) {
      console.error('Error validating query:', error)
      return { isValid: false, error: 'Failed to validate query' }
    }
  }
}

export { GeminiService }
export type {
  DatabaseSchema,
  TableSchema,
  ColumnSchema,
  QueryGenerationRequest,
  QueryGenerationResponse
}

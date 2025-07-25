import { Monaco } from '@monaco-editor/react'
import type {
  CompletionList,
  DatabaseSchema,
  IntellisenseOptions,
  Position,
  SQLContext
} from './types'
import { DatabaseSchemaCache } from './cache/DatabaseSchemaCache'
import { SQLContextParser } from './parsers/SQLContextParser'

export abstract class IntellisenseProvider {
  protected monaco: Monaco
  protected schemaCache: DatabaseSchemaCache
  protected contextParser: SQLContextParser
  protected options: IntellisenseOptions

  constructor(monaco: Monaco, options: IntellisenseOptions) {
    this.monaco = monaco
    this.options = options
    this.schemaCache = new DatabaseSchemaCache(options.connectionId, options.cacheTimeout)
    this.contextParser = new SQLContextParser()
  }

  abstract getDatabaseSpecificKeywords(): string[]
  abstract getDatabaseSpecificFunctions(): string[]
  abstract formatIdentifier(identifier: string): string
  abstract getColumnSuggestions(
    context: SQLContext,
    schema: DatabaseSchema,
    position: Position
  ): Monaco.languages.CompletionItem[]

  async provideCompletionItems(model: any, position: Position): Promise<CompletionList> {
    console.log('IntellisenseProvider: Getting completions at position', position)

    const schema = await this.schemaCache.getSchema()
    const context = this.contextParser.parseContext(model, position)

    console.log('Context:', {
      type: context.type,
      currentWord: context.currentWord,
      currentClause: context.currentClause,
      availableTables: context.availableTables
    })

    const suggestions: Monaco.languages.CompletionItem[] = []

    switch (context.type) {
      case 'keyword':
        suggestions.push(...this.getKeywordSuggestions(context, schema, position))
        break
      case 'from':
        suggestions.push(...this.getTableSuggestions(context, schema, position))
        break
      case 'column':
      case 'select':
      case 'where':
        suggestions.push(...this.getColumnSuggestions(context, schema, position))
        suggestions.push(...this.getFunctionSuggestions(context, schema, position))
        break
      case 'function':
        suggestions.push(...this.getFunctionSuggestions(context, schema, position))
        break
      default:
        suggestions.push(...this.getGeneralSuggestions(context, schema, position))
    }

    console.log('Total suggestions before filtering:', suggestions.length)
    const filtered = this.sortAndFilterSuggestions(suggestions, context)
    console.log('Total suggestions after filtering:', filtered.length)

    return { suggestions: filtered }
  }

  protected getKeywordSuggestions(
    _context: SQLContext,
    _schema: DatabaseSchema,
    position: Position
  ): Monaco.languages.CompletionItem[] {
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'LEFT',
      'RIGHT',
      'INNER',
      'OUTER',
      'ON',
      'GROUP BY',
      'ORDER BY',
      'HAVING',
      'LIMIT',
      'OFFSET',
      'UNION',
      'EXCEPT',
      'INTERSECT',
      'AS',
      'AND',
      'OR',
      'NOT',
      'IN',
      'EXISTS',
      'BETWEEN',
      'LIKE',
      'IS NULL',
      'IS NOT NULL',
      ...this.getDatabaseSpecificKeywords()
    ]

    return keywords.map((keyword) => ({
      label: keyword,
      kind: this.monaco.languages.CompletionItemKind.Keyword,
      insertText: keyword,
      detail: 'SQL Keyword',
      sortText: '0' + keyword,
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      }
    }))
  }

  protected getTableSuggestions(
    _context: SQLContext,
    schema: DatabaseSchema,
    position: Position
  ): Monaco.languages.CompletionItem[] {
    const suggestions: Monaco.languages.CompletionItem[] = []

    schema.tables.forEach((table, fullName) => {
      const [database, tableName] = fullName.split('.')
      const formattedName = this.formatIdentifier(tableName)
      const formattedFullName = `${this.formatIdentifier(database)}.${formattedName}`

      suggestions.push({
        label: tableName,
        kind: this.monaco.languages.CompletionItemKind.Class,
        insertText: formattedName,
        detail: `Table in ${database}`,
        documentation: `Columns: ${table.columns.map((c) => c.name).join(', ')}`,
        sortText: '1' + tableName,
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }
      })

      if (database !== this.options.currentDatabase) {
        suggestions.push({
          label: fullName,
          kind: this.monaco.languages.CompletionItemKind.Class,
          insertText: formattedFullName,
          detail: 'Fully qualified table name',
          documentation: `Columns: ${table.columns.map((c) => c.name).join(', ')}`,
          sortText: '2' + fullName,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          }
        })
      }
    })

    return suggestions
  }

  protected getFunctionSuggestions(
    _context: SQLContext,
    _schema: DatabaseSchema,
    position: Position
  ): Monaco.languages.CompletionItem[] {
    const functions = [
      { name: 'COUNT', signature: 'COUNT(expression)', description: 'Returns the number of rows' },
      { name: 'SUM', signature: 'SUM(expression)', description: 'Returns the sum of values' },
      { name: 'AVG', signature: 'AVG(expression)', description: 'Returns the average value' },
      { name: 'MIN', signature: 'MIN(expression)', description: 'Returns the minimum value' },
      { name: 'MAX', signature: 'MAX(expression)', description: 'Returns the maximum value' },
      {
        name: 'COALESCE',
        signature: 'COALESCE(value1, value2, ...)',
        description: 'Returns the first non-null value'
      },
      {
        name: 'CAST',
        signature: 'CAST(expression AS type)',
        description: 'Converts a value to a different data type'
      },
      ...this.getDatabaseSpecificFunctions().map((f) => ({
        name: f,
        signature: `${f}()`,
        description: `Database-specific function: ${f}`
      }))
    ]

    return functions.map((func) => ({
      label: func.name,
      kind: this.monaco.languages.CompletionItemKind.Function,
      insertText: func.signature,
      detail: 'SQL Function',
      documentation: func.description,
      sortText: '3' + func.name,
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      }
    }))
  }

  protected getGeneralSuggestions(
    context: SQLContext,
    schema: DatabaseSchema,
    position: Position
  ): Monaco.languages.CompletionItem[] {
    const suggestions: Monaco.languages.CompletionItem[] = []

    suggestions.push(...this.getKeywordSuggestions(context, schema, position))
    suggestions.push(...this.getTableSuggestions(context, schema, position))
    suggestions.push(...this.getFunctionSuggestions(context, schema, position))

    return suggestions
  }

  protected sortAndFilterSuggestions(
    suggestions: Monaco.languages.CompletionItem[],
    context: SQLContext
  ): Monaco.languages.CompletionItem[] {
    const seen = new Set<string>()
    const unique = suggestions.filter((s) => {
      if (seen.has(s.label)) return false
      seen.add(s.label)
      return true
    })

    if (context.currentWord) {
      return unique.filter((s) =>
        s.label.toLowerCase().startsWith(context.currentWord.toLowerCase())
      )
    }

    return unique.sort((a, b) => {
      const sortA = a.sortText || a.label
      const sortB = b.sortText || b.label
      return sortA.localeCompare(sortB)
    })
  }

  dispose() {
    this.schemaCache.dispose()
  }
}

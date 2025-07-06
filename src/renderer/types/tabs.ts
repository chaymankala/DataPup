export interface BaseTab {
  id: string
  title: string
  isDirty: boolean
}

export interface QueryTab extends BaseTab {
  type: 'query'
  query: string
}

export interface TableTab extends BaseTab {
  type: 'table'
  tableName: string
  database: string
  filters: TableFilter[]
}

export interface NaturalLanguageQueryTab extends BaseTab {
  type: 'natural-language-query'
}

export interface TableFilter {
  id: string
  column: string
  operator:
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'LIKE'
    | 'IN'
    | 'NOT IN'
    | 'IS NULL'
    | 'IS NOT NULL'
  value: string
}

export type Tab = QueryTab | TableTab | NaturalLanguageQueryTab

export interface QueryExecutionResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
  executionTime?: number
  rowCount?: number
}

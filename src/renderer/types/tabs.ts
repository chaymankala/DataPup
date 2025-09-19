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
    | 'NOT LIKE'
    | 'IN'
    | 'NOT IN'
    | 'IS NULL'
    | 'IS NOT NULL'
    | 'BETWEEN'
    | 'NOT BETWEEN'
  value: string | string[]
}

export type Tab = QueryTab | TableTab

export interface QueryExecutionResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
  executionTime?: number
  rowCount?: number
  isDDL?: boolean
  isDML?: boolean
  queryType?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL' | 'SYSTEM' | 'OTHER'
  totalRows?: number // Total rows available (for pagination)
  hasMore?: boolean // Indicates if there are more rows beyond current result set
  isNoSQL?: boolean // Indicates if this is a NoSQL database result (should be displayed as JSON)
}

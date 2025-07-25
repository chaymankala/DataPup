import { Monaco } from '@monaco-editor/react'

export interface CompletionItem {
  label: string
  kind: Monaco.languages.CompletionItemKind
  insertText: string
  detail?: string
  documentation?: string
  sortText?: string
  filterText?: string
  command?: any
  range?: any
}

export interface Position {
  lineNumber: number
  column: number
}

export interface SQLContext {
  type: 'select' | 'from' | 'where' | 'join' | 'column' | 'function' | 'keyword' | 'unknown'
  currentClause?: string
  tableAliases: Map<string, string>
  availableTables: string[]
  availableColumns: Map<string, string[]>
  cursorPosition: Position
  precedingText: string
  currentWord: string
}

export interface DatabaseSchema {
  databases: string[]
  tables: Map<string, TableInfo>
  functions: FunctionInfo[]
  keywords: string[]
}

export interface TableInfo {
  database: string
  name: string
  columns: ColumnInfo[]
  indexes?: IndexInfo[]
  primaryKey?: string[]
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default?: string
  comment?: string
}

export interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
  primary: boolean
}

export interface FunctionInfo {
  name: string
  description: string
  signature: string
  returnType: string
  category?: string
}

export interface IntellisenseOptions {
  connectionId: string
  databaseType: string
  currentDatabase?: string
  cacheTimeout?: number
}

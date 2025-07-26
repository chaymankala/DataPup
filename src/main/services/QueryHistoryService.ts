import { app } from 'electron'
import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export interface QueryHistoryEntry {
  id?: number
  connectionId: string
  connectionType: string
  connectionName: string
  query: string
  executionTime?: number
  rowCount?: number
  success: boolean
  errorMessage?: string
  createdAt?: string
}

export interface SavedQuery {
  id?: number
  name: string
  description?: string
  query: string
  connectionType?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface QueryHistoryFilter {
  connectionId?: string
  connectionType?: string
  startDate?: string
  endDate?: string
  success?: boolean
  searchTerm?: string
  limit?: number
  offset?: number
}

export interface SavedQueryFilter {
  connectionType?: string
  tags?: string[]
  searchTerm?: string
  limit?: number
  offset?: number
}

class QueryHistoryService {
  private db: Database.Database
  private dbPath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }

    this.dbPath = join(userDataPath, 'query-history.db')
    this.db = new Database(this.dbPath)
    this.initializeDatabase()
  }

  private initializeDatabase(): void {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON')

    // Create query history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS query_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        connection_id TEXT NOT NULL,
        connection_type TEXT NOT NULL,
        connection_name TEXT NOT NULL,
        query TEXT NOT NULL,
        execution_time INTEGER,
        row_count INTEGER,
        success INTEGER NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create saved queries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS saved_queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        query TEXT NOT NULL,
        connection_type TEXT,
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_query_history_connection_id ON query_history(connection_id);
      CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON query_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_saved_queries_connection_type ON saved_queries(connection_type);
      CREATE INDEX IF NOT EXISTS idx_saved_queries_name ON saved_queries(name);
    `)
  }

  // Query History Methods
  addQueryToHistory(entry: QueryHistoryEntry): number {
    const stmt = this.db.prepare(`
      INSERT INTO query_history (
        connection_id, connection_type, connection_name, query,
        execution_time, row_count, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      entry.connectionId,
      entry.connectionType,
      entry.connectionName,
      entry.query,
      entry.executionTime || null,
      entry.rowCount || null,
      entry.success ? 1 : 0,
      entry.errorMessage || null
    )

    return result.lastInsertRowid as number
  }

  getQueryHistory(filter: QueryHistoryFilter = {}): QueryHistoryEntry[] {
    let query = 'SELECT * FROM query_history WHERE 1=1'
    const params: (string | number)[] = []

    if (filter.connectionId) {
      query += ' AND connection_id = ?'
      params.push(filter.connectionId)
    }

    if (filter.connectionType) {
      query += ' AND connection_type = ?'
      params.push(filter.connectionType)
    }

    if (filter.success !== undefined) {
      query += ' AND success = ?'
      params.push(filter.success ? 1 : 0)
    }

    if (filter.searchTerm) {
      query += ' AND query LIKE ?'
      params.push(`%${filter.searchTerm}%`)
    }

    if (filter.startDate) {
      query += ' AND created_at >= ?'
      params.push(filter.startDate)
    }

    if (filter.endDate) {
      query += ' AND created_at <= ?'
      params.push(filter.endDate)
    }

    query += ' ORDER BY created_at DESC'

    if (filter.limit) {
      query += ' LIMIT ?'
      params.push(filter.limit)
    }

    if (filter.offset) {
      query += ' OFFSET ?'
      params.push(filter.offset)
    }

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as Array<{
      id: number
      connection_id: string
      connection_type: string
      connection_name: string
      query: string
      execution_time: number | null
      row_count: number | null
      success: number
      error_message: string | null
      created_at: string
    }>

    return rows.map((row) => ({
      id: row.id,
      connectionId: row.connection_id,
      connectionType: row.connection_type,
      connectionName: row.connection_name,
      query: row.query,
      executionTime: row.execution_time,
      rowCount: row.row_count,
      success: row.success === 1,
      errorMessage: row.error_message,
      createdAt: row.created_at
    }))
  }

  clearHistory(connectionId?: string): number {
    if (connectionId) {
      const stmt = this.db.prepare('DELETE FROM query_history WHERE connection_id = ?')
      const result = stmt.run(connectionId)
      return result.changes
    } else {
      const stmt = this.db.prepare('DELETE FROM query_history')
      const result = stmt.run()
      return result.changes
    }
  }

  deleteHistoryEntry(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM query_history WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  // Saved Queries Methods
  saveQuery(query: SavedQuery): number {
    const stmt = this.db.prepare(`
      INSERT INTO saved_queries (name, description, query, connection_type, tags)
      VALUES (?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      query.name,
      query.description || null,
      query.query,
      query.connectionType || null,
      query.tags ? JSON.stringify(query.tags) : null
    )

    return result.lastInsertRowid as number
  }

  getSavedQueries(filter: SavedQueryFilter = {}): SavedQuery[] {
    let query = 'SELECT * FROM saved_queries WHERE 1=1'
    const params: (string | number)[] = []

    if (filter.connectionType) {
      query += ' AND (connection_type = ? OR connection_type IS NULL)'
      params.push(filter.connectionType)
    }

    if (filter.searchTerm) {
      query += ' AND (name LIKE ? OR description LIKE ? OR query LIKE ?)'
      params.push(`%${filter.searchTerm}%`, `%${filter.searchTerm}%`, `%${filter.searchTerm}%`)
    }

    if (filter.tags && filter.tags.length > 0) {
      // Simple tag filtering - checks if any of the requested tags exist in the JSON array
      query += ' AND ('
      query += filter.tags.map(() => 'tags LIKE ?').join(' OR ')
      query += ')'
      filter.tags.forEach((tag) => params.push(`%"${tag}"%`))
    }

    query += ' ORDER BY name ASC'

    if (filter.limit) {
      query += ' LIMIT ?'
      params.push(filter.limit)
    }

    if (filter.offset) {
      query += ' OFFSET ?'
      params.push(filter.offset)
    }

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as Array<{
      id: number
      name: string
      description: string | null
      query: string
      connection_type: string | null
      tags: string | null
      created_at: string
      updated_at: string
    }>

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      query: row.query,
      connectionType: row.connection_type,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  updateSavedQuery(id: number, updates: Partial<SavedQuery>): boolean {
    const fields: string[] = []
    const values: any[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }

    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }

    if (updates.query !== undefined) {
      fields.push('query = ?')
      values.push(updates.query)
    }

    if (updates.connectionType !== undefined) {
      fields.push('connection_type = ?')
      values.push(updates.connectionType)
    }

    if (updates.tags !== undefined) {
      fields.push('tags = ?')
      values.push(JSON.stringify(updates.tags))
    }

    if (fields.length === 0) return false

    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE saved_queries 
      SET ${fields.join(', ')}
      WHERE id = ?
    `)

    const result = stmt.run(...values)
    return result.changes > 0
  }

  deleteSavedQuery(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM saved_queries WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  // Utility methods
  getStatistics(connectionId?: string): {
    totalQueries: number
    successfulQueries: number
    failedQueries: number
    averageExecutionTime: number
  } {
    let baseQuery = 'FROM query_history'
    const params: (string | number)[] = []

    if (connectionId) {
      baseQuery += ' WHERE connection_id = ?'
      params.push(connectionId)
    }

    const totalStmt = this.db.prepare(`SELECT COUNT(*) as count ${baseQuery}`)
    const successStmt = this.db.prepare(
      `SELECT COUNT(*) as count ${baseQuery}${connectionId ? ' AND' : ' WHERE'} success = 1`
    )
    const failedStmt = this.db.prepare(
      `SELECT COUNT(*) as count ${baseQuery}${connectionId ? ' AND' : ' WHERE'} success = 0`
    )
    const avgTimeStmt = this.db.prepare(
      `SELECT AVG(execution_time) as avg_time ${baseQuery}${
        connectionId ? ' AND' : ' WHERE'
      } execution_time IS NOT NULL`
    )

    const total = (totalStmt.get(...params) as { count: number }).count
    const successful = (successStmt.get(...params) as { count: number }).count
    const failed = (failedStmt.get(...params) as { count: number }).count
    const avgTime = (avgTimeStmt.get(...params) as { avg_time: number | null }).avg_time || 0

    return {
      totalQueries: total,
      successfulQueries: successful,
      failedQueries: failed,
      averageExecutionTime: Math.round(avgTime)
    }
  }

  // Cleanup old entries (optional retention policy)
  cleanupOldEntries(daysToKeep: number = 30): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const stmt = this.db.prepare('DELETE FROM query_history WHERE created_at < ?')
    const result = stmt.run(cutoffDate.toISOString())
    return result.changes
  }

  close(): void {
    this.db.close()
  }
}

export default QueryHistoryService
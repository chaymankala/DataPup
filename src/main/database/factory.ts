import { DatabaseManagerInterface, DatabaseConfig } from './interface'
import { ClickHouseManager } from './clickhouse'

class DatabaseManagerFactory {
  private managers: Map<string, DatabaseManagerInterface> = new Map()

  constructor() {
    // Initialize managers for supported database types
    this.managers.set('clickhouse', new ClickHouseManager())
    // Add other database managers here as and when they are implemented
    // this.managers.set('postgresql', new PostgreSQLManager())
    // this.managers.set('mysql', new MySQLManager())
    // this.managers.set('sqlite', new SQLiteManager())
  }

  getManager(databaseType: string): DatabaseManagerInterface | null {
    return this.managers.get(databaseType.toLowerCase()) || null
  }

  getSupportedTypes(): string[] {
    return Array.from(this.managers.keys())
  }

  isSupported(databaseType: string): boolean {
    return this.managers.has(databaseType.toLowerCase())
  }
}

export { DatabaseManagerFactory } 

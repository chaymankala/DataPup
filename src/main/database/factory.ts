import { DatabaseManagerInterface } from './interface'
import { ClickHouseManager } from './clickhouse'

class DatabaseManagerFactory {
  private managers: Map<string, DatabaseManagerInterface> = new Map()

  constructor() {
    // Initialize managers for supported database types
    this.managers.set('clickhouse', new ClickHouseManager())
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

// AI Tools interface for the agent

export const aiTools = {
  listDatabases: async (connectionId: string) => {
    return await window.api.aiTools.listDatabases(connectionId)
  },
  listTables: async (connectionId: string, database?: string) => {
    return await window.api.aiTools.listTables(connectionId, database)
  },
  getTableSchema: async (connectionId: string, tableName: string, database?: string) => {
    return await window.api.aiTools.getTableSchema(connectionId, tableName, database)
  },
  getSampleRows: async (
    connectionId: string,
    database: string,
    tableName: string,
    limit?: number
  ) => {
    return await window.api.aiTools.getSampleRows(connectionId, database, tableName, limit)
  },
  executeQuery: async (connectionId: string, sql: string) => {
    return await window.api.aiTools.executeQuery(connectionId, sql)
  },
  getLastError: async (connectionId: string) => {
    return await window.api.aiTools.getLastError(connectionId)
  },
  searchTables: async (connectionId: string, pattern: string, database?: string) => {
    return await window.api.aiTools.searchTables(connectionId, pattern, database)
  },
  searchColumns: async (connectionId: string, pattern: string, database?: string) => {
    return await window.api.aiTools.searchColumns(connectionId, pattern, database)
  },
  summarizeSchema: async (connectionId: string, database?: string) => {
    return await window.api.aiTools.summarizeSchema(connectionId, database)
  },
  summarizeTable: async (connectionId: string, tableName: string, database?: string) => {
    return await window.api.aiTools.summarizeTable(connectionId, tableName, database)
  },
  profileTable: async (connectionId: string, tableName: string, database?: string) => {
    return await window.api.aiTools.profileTable(connectionId, tableName, database)
  },
  getConversationContext: async (sessionId: string) => {
    return await window.api.aiTools.getConversationContext(sessionId)
  },
  setConversationContext: async (sessionId: string, context: any) => {
    return await window.api.aiTools.setConversationContext(sessionId, context)
  },
  getDocumentation: async (topic: string) => {
    return await window.api.aiTools.getDocumentation(topic)
  }
}

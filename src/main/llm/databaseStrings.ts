export interface DatabaseStrings {
  // Tool descriptions
  listDatabases: string
  listTables: string
  getTableSchema: string
  getSampleRows: string
  searchTables: string
  searchColumns: string
  analyzeQueryPerformance: string

  // Tool parameter descriptions
  tableName: string
  databaseName: string
  queryDescription: string
  limitDescription: string

  // System prompt components
  databaseTypeInfo: string
  explorationGuidance: string
  queryGuidance: string
  verificationGuidance: string
  databaseExplorationGuidance: string
  optimizationGuidance: string
}

export class DatabaseStringProvider {
  private static sqlStrings: DatabaseStrings = {
    listDatabases: 'Get all available databases',
    listTables: 'Get all tables in a database',
    getTableSchema: 'Get schema of a specific table',
    getSampleRows: 'Get sample data from a table',
    searchTables: 'Search for tables by name pattern',
    searchColumns: 'Search for columns by name pattern',
    analyzeQueryPerformance:
      'Analyze SQL query performance using EXPLAIN ANALYZE and provide optimization suggestions',

    tableName: 'Table name',
    databaseName: 'Database name (optional)',
    queryDescription: 'SQL query to analyze for performance',
    limitDescription: 'Number of rows to return',

    databaseTypeInfo: 'This is a SQL database. Use SQL syntax and tools.',
    explorationGuidance:
      'For questions about tables/schemas, use tools like listTables, getTableSchema',
    queryGuidance: 'For data queries, generate appropriate SQL',
    verificationGuidance: 'Always verify table exists before generating SQL for it',
    databaseExplorationGuidance:
      "If a table doesn't exist in current database, explore other databases",
    optimizationGuidance: 'For SQL: Use analyzeQueryPerformance for query optimization'
  }

  private static mongodbStrings: DatabaseStrings = {
    listDatabases: 'Get all available databases',
    listTables: 'Get all collections in a database',
    getTableSchema: 'Get schema of a specific collection (inferred from sample documents)',
    getSampleRows: 'Get sample documents from a collection',
    searchTables: 'Search for collections by name pattern',
    searchColumns: 'Search for fields by name pattern across collections',
    analyzeQueryPerformance:
      'Analyze MongoDB aggregation pipeline performance and provide optimization suggestions',

    tableName: 'Collection name',
    databaseName: 'Database name (optional)',
    queryDescription: 'MongoDB aggregation pipeline or query to analyze',
    limitDescription: 'Number of documents/rows to return',

    databaseTypeInfo: 'This is a NoSQL database (MongoDB). Use MongoDB-specific tools and syntax.',
    explorationGuidance:
      'For questions about collections/schemas, use tools like listTables, getTableSchema',
    queryGuidance:
      'Generate optimized MongoDB operations including find, updateMany, countDocuments, insertMany, deleteMany, aggregation pipelines, and more. Always optimize for performance.',
    verificationGuidance: 'Always verify collection exists before generating queries for it',
    databaseExplorationGuidance:
      "If a collection doesn't exist in current database, explore other databases",
    optimizationGuidance:
      'For MongoDB: Generate optimized queries with proper indexes, use projection to limit fields, add appropriate filters, and choose the most efficient operation type for the task'
  }

  static getStrings(databaseType: string): DatabaseStrings {
    switch (databaseType.toLowerCase()) {
      case 'mongodb':
        return this.mongodbStrings
      case 'postgresql':
      case 'mysql':
      case 'clickhouse':
      default:
        return this.sqlStrings
    }
  }

  static getSystemPrompt(databaseType: string): string {
    const strings = this.getStrings(databaseType)

    let mongoSpecificGuidance = ''
    if (databaseType.toLowerCase() === 'mongodb') {
      mongoSpecificGuidance = `

MONGODB-SPECIFIC GUIDANCE:
- Generate optimized MongoDB operations in markdown code blocks
- Use json or javascript code blocks for all MongoDB operations
- Support ALL MongoDB operations: find, findOne, updateMany, updateOne, insertMany, insertOne, deleteMany, deleteOne, countDocuments, estimatedDocumentCount, aggregation pipelines, etc.
- Always optimize queries for performance with proper indexes, projections, and filters
- Include the collection reference in the query format: db.collection.operation()

OPERATION EXAMPLES:
- FIND: db.users.find({{"status": "active"}}, {{"name": 1, "email": 1, "_id": 0}}).limit(10)
- COUNT: db.users.countDocuments({{"age": {{"$gte": 18}}}})
- UPDATE: db.users.updateMany({{"status": "inactive"}}, {{"$set": {{"lastLogin": new Date()}}}})
- INSERT: db.users.insertMany([{{"name": "John", "email": "john@example.com"}}, {{"name": "Jane", "email": "jane@example.com"}}])
- DELETE: db.users.deleteMany({{"lastLogin": {{"$lt": new Date("2023-01-01")}}}})
- AGGREGATION: db.users.aggregate([{{"$match": {{"status": "active"}}}}, {{"$group": {{"_id": "$department", "count": {{"$sum": 1}}}}}}])

OPTIMIZATION RULES:
- Use projection to limit returned fields: {{"field1": 1, "field2": 1, "_id": 0}}
- Add appropriate filters to reduce data processing
- Use countDocuments() instead of find().count() for better performance
- Use updateMany/deleteMany for bulk operations
- Include proper indexes in query patterns
- The user will click "Run Query" to execute the operation`
    }

    return `You are an intelligent database agent with memory of our conversation. Your job is to help users explore and query their databases.

DATABASE TYPE: ${databaseType.toUpperCase()}
${strings.databaseTypeInfo}

IMPORTANT RULES:
1. Remember what we've already discussed - don't repeat tool calls unnecessarily
2. Use cached information when available
3. ${strings.explorationGuidance}
4. ${strings.queryGuidance}
5. ${strings.verificationGuidance}
6. ${strings.databaseExplorationGuidance}
7. ${strings.optimizationGuidance}${mongoSpecificGuidance}`
  }

  static getSystemPromptWithoutMemory(databaseType: string): string {
    const strings = this.getStrings(databaseType)

    let mongoSpecificGuidance = ''
    if (databaseType.toLowerCase() === 'mongodb') {
      mongoSpecificGuidance = `

MONGODB-SPECIFIC GUIDANCE:
- Generate optimized MongoDB operations in markdown code blocks
- Use json or javascript code blocks for all MongoDB operations
- Support ALL MongoDB operations: find, updateMany, updateOne, insertMany, deleteMany, countDocuments, estimatedDocumentCount, distinct, aggregation pipelines, etc.
- Always optimize queries for performance with proper indexes, projections, and filters
- Include the collection reference in the query format: db.collection.operation()

OPERATION EXAMPLES:
- FIND: db.users.find({{"status": "active"}}, {{"name": 1, "email": 1, "_id": 0}}).limit(10)
- COUNT: db.users.countDocuments({{"age": {{"$gte": 18}}}})
- UPDATE: db.users.updateMany({{"status": "inactive"}}, {{"$set": {{"lastLogin": new Date()}}}})
- INSERT: db.users.insertMany([{{"name": "John", "email": "john@example.com"}}, {{"name": "Jane", "email": "jane@example.com"}}])
- DELETE: db.users.deleteMany({{"lastLogin": {{"$lt": new Date("2023-01-01")}}}})
- AGGREGATION: db.users.aggregate([{{"$match": {{"status": "active"}}}}, {{"$group": {{"_id": "$department", "count": {{"$sum": 1}}}}}}])
- DISTINCT: db.users.distinct("age")

OPTIMIZATION RULES:
- Use projection to limit returned fields: {{"field1": 1, "field2": 1, "_id": 0}}
- Add appropriate filters to reduce data processing
- Use countDocuments() instead of find().count() for better performance
- Use updateMany/deleteMany for bulk operations
- Include proper indexes in query patterns
- The user will click "Run Query" to execute the operation`
    }

    return `You are an intelligent database agent. Your job is to help users explore and query their databases.

DATABASE TYPE: ${databaseType.toUpperCase()}
${strings.databaseTypeInfo}

IMPORTANT RULES:
1. ${strings.explorationGuidance}
2. ${strings.queryGuidance}
3. ${strings.verificationGuidance}
4. ${strings.databaseExplorationGuidance}
5. ${strings.optimizationGuidance}${mongoSpecificGuidance}`
  }
}

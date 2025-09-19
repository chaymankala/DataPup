import { BaseDatabaseManagerNoSQL } from './baseNosql'
import {
  ConnectionResult,
  DatabaseCapabilities,
  DatabaseConfig,
  DeleteResult,
  InsertResult,
  QueryResult,
  QueryType,
  TableQueryOptions,
  TableSchema,
  ColumnSchema,
  UpdateResult
} from './interface'

interface MongoConfig extends DatabaseConfig {
  uri?: string
  authSource?: string
  tls?: boolean
}

interface MongoConnection {
  id: string
  config: MongoConfig
  client: any
  db: any
  isConnected: boolean
  lastUsed: Date
}

class MongoDBManager extends BaseDatabaseManagerNoSQL {
  protected connections: Map<string, MongoConnection> = new Map()

  private toPlainBson(value: any): any {
    if (value === null || value === undefined) return value
    const t = typeof value
    if (t !== 'object') return value
    if (Array.isArray(value)) return value.map((v) => this.toPlainBson(v))

    // Handle common BSON types by _bsontype
    const bsontype = (value as any)._bsontype
    if (bsontype) {
      switch (bsontype) {
        case 'ObjectId':
          // Prefer hex string
          return typeof (value as any).toHexString === 'function'
            ? (value as any).toHexString()
            : String(value)
        case 'Decimal128':
        case 'Long':
        case 'Int32':
        case 'Double':
        case 'UUID':
        case 'Timestamp':
          return typeof (value as any).toString === 'function'
            ? (value as any).toString()
            : String(value)
        case 'Binary': {
          try {
            const buffer = (value as any).buffer || (value as any).toJSON?.().data
            const base64 = buffer ? Buffer.from(buffer).toString('base64') : String(value)
            const subtype = (value as any).sub_type ?? (value as any).subtype
            return subtype ? `binary:${subtype}:${base64}` : `binary:${base64}`
          } catch {
            return String(value)
          }
        }
        case 'MinKey':
          return 'MinKey'
        case 'MaxKey':
          return 'MaxKey'
        case 'BSONRegExp':
          try {
            return `/${(value as any).pattern}/${(value as any).options || ''}`
          } catch {
            return String(value)
          }
        default:
          // Fallback to string form
          return typeof (value as any).toString === 'function'
            ? (value as any).toString()
            : String(value)
      }
    }

    // Handle native Date
    if (value instanceof Date) return value.toISOString()

    // Plain object: recurse
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = this.toPlainBson(v)
    }
    return out
  }

  async connect(config: DatabaseConfig, connectionId: string): Promise<ConnectionResult> {
    try {
      // Dynamic import to avoid bundling if unused
      const { MongoClient } = await import('mongodb')

      const mongoConfig: MongoConfig = config as any
      const uri =
        mongoConfig.uri ||
        `mongodb://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.database}`

      const client = new MongoClient(uri, {
        authSource: (mongoConfig as any).authSource,
        tls: (mongoConfig as any).tls
        // timeouts can be set via URI or here
      } as any)

      await client.connect()
      const db = client.db(config.database)
      // Simple command to validate connection
      await db.command({ ping: 1 })

      const connection: MongoConnection = {
        id: connectionId,
        config: {
          ...config,
          uri: mongoConfig.uri,
          authSource: mongoConfig.authSource,
          tls: mongoConfig.tls
        },
        client,
        db,
        isConnected: true,
        lastUsed: new Date()
      }

      this.connections.set(connectionId, connection)
      if (config.readonly) this.readonlyConnections.add(connectionId)

      return { success: true, message: `Connected to MongoDB at ${config.host}:${config.port}` }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to MongoDB',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async disconnect(connectionId: string): Promise<{ success: boolean; message: string }> {
    const connection = this.connections.get(connectionId)
    if (!connection) return { success: false, message: 'Connection not found' }
    try {
      await connection.client.close()
    } catch {}
    this.connections.delete(connectionId)
    this.readonlyConnections.delete(connectionId)
    return { success: true, message: 'Disconnected from MongoDB' }
  }

  async queryTable(
    connectionId: string,
    options: TableQueryOptions,
    sessionId?: string
  ): Promise<QueryResult> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) {
      return this.createQueryResult(false, 'Not connected to MongoDB. Please connect first.')
    }

    const { database, table, filters, orderBy, limit, offset, aggregationPipeline } = options
    const db = database ? connection.client.db(database) : connection.db
    const collection = db.collection(table)

    const abortController = new AbortController()
    if (sessionId) this.activeOps.set(sessionId, abortController)

    try {
      let docs: any[]
      let totalRows: number | undefined
      let hasMore: boolean | undefined

      if (aggregationPipeline) {
        // Execute aggregation pipeline
        const pipeline = [...aggregationPipeline]

        // Add limit and skip to the pipeline if specified
        if (offset) pipeline.push({ $skip: offset })
        if (limit) pipeline.push({ $limit: limit })

        const cursor = collection.aggregate(pipeline, { signal: abortController.signal } as any)
        docs = await cursor.toArray()

        // For aggregation, we can't easily get total count without running a separate query
        // This would require modifying the pipeline to add a $count stage
      } else {
        // Execute regular find query
        const query = this.toDocumentFilter(filters)
        const cursor = collection.find(query, { signal: abortController.signal } as any)

        if (orderBy && orderBy.length > 0) {
          const sort: Record<string, 1 | -1> = {}
          for (const o of orderBy) sort[o.column] = o.direction === 'asc' ? 1 : -1
          cursor.sort(sort)
        }

        if (offset) cursor.skip(offset)
        if (limit) cursor.limit(limit)

        docs = await cursor.toArray()

        if (limit || offset) {
          totalRows = await collection.countDocuments(query)
          hasMore = (offset || 0) + docs.length < (totalRows || 0)
        }
      }

      const plainDocs = docs.map((d: any) => this.toPlainBson(d))

      if (sessionId) this.activeOps.delete(sessionId)

      const result = this.createQueryResult(
        true,
        `Query executed successfully. Returned ${docs.length} documents.`,
        plainDocs,
        undefined,
        QueryType.SELECT
      )
      if (totalRows !== undefined) (result as any).totalRows = totalRows
      if (hasMore !== undefined) (result as any).hasMore = hasMore
      return result
    } catch (error) {
      if (sessionId) this.activeOps.delete(sessionId)
      if (error instanceof Error && (error as any).name === 'AbortError') {
        return this.createQueryResult(false, 'Query was cancelled', undefined, 'Cancelled')
      }
      return this.createQueryResult(
        false,
        'Query execution failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  async insertRow(
    connectionId: string,
    table: string,
    data: Record<string, any>,
    database?: string
  ): Promise<InsertResult> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) {
      return { success: false, message: 'Not connected to MongoDB' }
    }
    try {
      const db = database ? connection.client.db(database) : connection.db
      const collection = db.collection(table)
      const res = await collection.insertOne(data)
      return {
        success: true,
        message: 'Document inserted',
        insertedId: res.insertedId?.toString(),
        queryType: QueryType.INSERT
      }
    } catch (error) {
      return {
        success: false,
        message: 'Insert failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateRow(
    connectionId: string,
    table: string,
    primaryKey: Record<string, any>,
    updates: Record<string, any>,
    database?: string
  ): Promise<UpdateResult> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected)
      return { success: false, message: 'Not connected to MongoDB', affectedRows: 0 }
    try {
      const db = database ? connection.client.db(database) : connection.db
      const collection = db.collection(table)
      const filter = { ...primaryKey }
      // handle string _id -> ObjectId
      if (filter._id && typeof filter._id === 'string') {
        try {
          const { ObjectId } = await import('mongodb')
          filter._id = new ObjectId(filter._id)
        } catch {}
      }
      const res = await collection.updateOne(filter, { $set: updates })
      return {
        success: true,
        message: 'Document updated',
        affectedRows: res.modifiedCount || 0,
        queryType: QueryType.UPDATE
      }
    } catch (error) {
      return {
        success: false,
        message: 'Update failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        affectedRows: 0
      }
    }
  }

  async deleteRow(
    connectionId: string,
    table: string,
    primaryKey: Record<string, any>,
    database?: string
  ): Promise<DeleteResult> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) {
      return { success: false, message: 'Not connected to MongoDB', affectedRows: 0 }
    }
    try {
      const db = database ? connection.client.db(database) : connection.db
      const collection = db.collection(table)
      const filter = { ...primaryKey }
      if (filter._id && typeof filter._id === 'string') {
        try {
          const { ObjectId } = await import('mongodb')
          filter._id = new ObjectId(filter._id)
        } catch {}
      }
      const res = await collection.deleteOne(filter)
      return {
        success: true,
        message: 'Document deleted',
        affectedRows: res.deletedCount || 0,
        queryType: QueryType.DELETE
      }
    } catch (error) {
      return {
        success: false,
        message: 'Delete failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        affectedRows: 0
      }
    }
  }

  async getDatabases(
    connectionId: string
  ): Promise<{ success: boolean; databases?: string[]; message: string }> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected)
      return { success: false, message: 'Not connected to MongoDB' }
    try {
      const admin = connection.client.db().admin()
      const res = await admin.listDatabases()
      const databases = (res.databases || []).map((d: any) => d.name)
      return { success: true, databases, message: `Found ${databases.length} databases` }
    } catch (error) {
      return { success: false, message: 'Failed to get databases' }
    }
  }

  async getTables(
    connectionId: string,
    database?: string
  ): Promise<{ success: boolean; tables?: string[]; message: string }> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected)
      return { success: false, message: 'Not connected to MongoDB' }
    try {
      const db = database ? connection.client.db(database) : connection.db
      const cols = await db.listCollections().toArray()
      const tables = cols.map((c: any) => c.name)
      return { success: true, tables, message: `Found ${tables.length} collections` }
    } catch (error) {
      return { success: false, message: 'Failed to get collections' }
    }
  }

  async getTableSchema(
    connectionId: string,
    tableName: string,
    database?: string
  ): Promise<{ success: boolean; schema?: any[]; message: string }> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected)
      return { success: false, message: 'Not connected to MongoDB' }
    try {
      const db = database ? connection.client.db(database) : connection.db
      const collection = db.collection(tableName)
      // Sample a few documents and infer flat column list
      const docs = await collection.find({}, { limit: 20 } as any).toArray()
      const fields = new Map<string, string>()
      const inferType = (val: any): string => {
        if (val === null) return 'null'
        if (Array.isArray(val)) return 'array'
        const t = typeof val
        if (t !== 'object') return t
        if (val && val._bsontype) return val._bsontype
        return 'object'
      }
      const walk = (obj: any, prefix: string = '') => {
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          for (const [k, v] of Object.entries(obj)) {
            const key = prefix ? `${prefix}.${k}` : k
            if (v && typeof v === 'object' && !Array.isArray(v) && !(v as any)._bsontype) {
              walk(v, key)
            } else {
              if (!fields.has(key)) fields.set(key, inferType(v))
            }
          }
        }
      }
      for (const d of docs) walk(d)
      const schema = Array.from(fields.entries()).map(([name, type]) => ({ name, type }))
      return { success: true, schema, message: 'Schema inferred from samples' }
    } catch (error) {
      return { success: false, message: 'Failed to infer schema' }
    }
  }

  async getTableFullSchema(
    connectionId: string,
    tableName: string,
    database?: string
  ): Promise<{ success: boolean; schema?: TableSchema; message: string }> {
    const basic = await this.getTableSchema(connectionId, tableName, database)
    if (!basic.success || !basic.schema) return { success: false, message: basic.message }
    const columns: ColumnSchema[] = basic.schema.map((c: any) => ({ name: c.name, type: c.type }))
    const tableSchema: TableSchema = {
      columns,
      primaryKeys: ['_id'],
      uniqueKeys: []
    }
    return { success: true, schema: tableSchema, message: 'Inferred table schema' }
  }

  async getPrimaryKeys(
    _connectionId: string,
    _table: string,
    _database?: string
  ): Promise<string[]> {
    return ['_id']
  }

  getCapabilities(): DatabaseCapabilities {
    return {
      supportsTransactions: false,
      supportsBatchOperations: true,
      supportsReturning: false,
      supportsUpsert: true,
      supportsSchemas: false,
      requiresPrimaryKey: false
    }
  }

  async cleanup(): Promise<void> {
    const ids = Array.from(this.connections.keys())
    await Promise.allSettled(ids.map((id) => this.disconnect(id)))
  }

  // Override the base query method to handle MongoDB queries
  async query(connectionId: string, query: string, _sessionId?: string): Promise<QueryResult> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) {
      return this.createQueryResult(false, 'Not connected to MongoDB. Please connect first.')
    }

    try {
      const db = connection.db

      // Create a MongoDB shell-like environment
      const collections = await db.listCollections().toArray()
      const shellDb = {
        getCollection: (name: string) => db.collection(name),
        // Add all collection methods dynamically
        ...Object.fromEntries(collections.map((col: any) => [col.name, db.collection(col.name)]))
      }

      // Enhance collection methods to automatically convert cursors to arrays
      for (const [collectionName, collection] of Object.entries(shellDb)) {
        if (
          collectionName !== 'getCollection' &&
          typeof collection === 'object' &&
          collection.find
        ) {
          // Only wrap the most common methods that return cursors
          const cursorMethods = [
            'find',
            'aggregate',
            'findOne',
            'findOneAndUpdate',
            'findOneAndDelete'
          ]

          for (const methodName of cursorMethods) {
            if (typeof collection[methodName] === 'function') {
              const originalMethod = collection[methodName].bind(collection)

              collection[methodName] = function (...args: any[]) {
                console.log(`Calling ${methodName} with args:`, args)
                const result = originalMethod(...args)
                console.log(`${methodName} returned:`, result)

                // If it's a cursor (has toArray method), convert to array
                if (result && typeof result.toArray === 'function') {
                  console.log(`Converting cursor to array for ${methodName}`)
                  return result.toArray().then((array) => {
                    console.log(`${methodName} array result:`, array)
                    return array
                  })
                }

                // If it's already a promise, return as-is
                if (result && typeof result.then === 'function') {
                  return result
                }

                // Otherwise return as-is
                return result
              }
            }
          }
        }
      }

      // Use Function constructor to execute the query as JavaScript
      try {
        // Create a function that has access to the db object with collection methods
        const executeQuery = new Function(
          'db',
          `
          return (function() {
            return ${query}
          })()
        `
        )

        console.log('Executing MongoDB query:', query)
        console.log('Available collections:', Object.keys(shellDb))

        const result = executeQuery(shellDb)
        console.log('Raw result:', result)

        // Handle promises if the result is a promise
        let finalResult
        if (result && typeof result.then === 'function') {
          console.log('Result is a promise, awaiting...')
          finalResult = await result
          console.log('Promise resolved to:', finalResult)
        } else {
          finalResult = result
          console.log('Result is not a promise:', finalResult)
        }
        console.log('Final result after promise handling:', finalResult)

        const plainResult = this.toPlainBson(finalResult)
        console.log('Plain result after BSON conversion:', plainResult)

        // Ensure we have valid data
        let finalData
        if (Array.isArray(plainResult)) {
          finalData = plainResult.filter((item) => item !== undefined && item !== null)
        } else if (plainResult !== undefined && plainResult !== null) {
          finalData = [plainResult]
        } else {
          finalData = []
        }

        console.log('Final data being sent to UI:', finalData)

        const queryResult = this.createQueryResult(
          true,
          'Query executed successfully',
          finalData,
          undefined,
          QueryType.SELECT
        )
        // Mark this as NoSQL result for JSON display
        ;(queryResult as any).isNoSQL = true
        console.log('Final query result:', queryResult)
        return queryResult
      } catch (execError) {
        console.error('MongoDB query execution error:', execError)
        return this.createQueryResult(
          false,
          'Query execution failed',
          undefined,
          execError instanceof Error ? execError.message : 'Unknown error occurred'
        )
      }
    } catch (error) {
      return this.createQueryResult(
        false,
        'Query execution failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
    }
  }

  async getCollectionStats(connectionId: string, collection: string, database?: string) {
    try {
      // Get basic collection info
      const schemaResult = await this.getTableSchema(connectionId, collection, database)
      if (!schemaResult.success) {
        return {
          success: false,
          error: 'Failed to get collection schema'
        }
      }

      const stats = {
        collection,
        database: database || 'default',
        fieldCount: schemaResult.schema?.length || 0,
        fields: schemaResult.schema || [],
        message: `Collection ${collection} has ${schemaResult.schema?.length || 0} different fields`
      }

      return {
        success: true,
        stats,
        message: `Retrieved stats for collection ${collection}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getMongoDocumentation(topic: string) {
    const docs: Record<string, string> = {
      aggregation: `
MongoDB Aggregation Pipeline:
- $match: Filter documents
- $group: Group documents by field
- $sort: Sort documents
- $limit: Limit number of documents
- $project: Select specific fields
- $lookup: Join with another collection
- $unwind: Deconstruct array fields

Example:
[
  { "$match": { "status": "active" } },
  { "$group": { "_id": "$category", "count": { "$sum": 1 } } },
  { "$sort": { "count": -1 } },
  { "$limit": 10 }
]
`,
      queries: `
MongoDB Query Examples:
- Find documents: { "field": "value" }
- Range queries: { "age": { "$gte": 18, "$lte": 65 } }
- Array queries: { "tags": { "$in": ["mongodb", "database"] } }
- Text search: { "$text": { "$search": "search term" } }
- Regex: { "name": { "$regex": "^John", "$options": "i" } }

Example:
{ "status": "active", "age": { "$gte": 18 } }
`,
      indexes: `
MongoDB Indexes:
- Single field: { "field": 1 }
- Compound: { "field1": 1, "field2": -1 }
- Text: { "field": "text" }
- Geospatial: { "location": "2dsphere" }

Example:
db.collection.createIndex({ "name": 1, "age": -1 })
`,
      operators: `
MongoDB Query Operators:
- Comparison: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin
- Logical: $and, $or, $not, $nor
- Element: $exists, $type
- Array: $all, $elemMatch, $size
- Evaluation: $expr, $jsonSchema, $mod, $regex, $text, $where

Example:
{ "$and": [{ "age": { "$gte": 18 } }, { "status": "active" }] }
`,
      operations: `
MongoDB Operations:
- MongoDB aggregation pipelines are executed through the standard query interface
- All operations must be expressed as aggregation pipelines
- Use aggregation stages like $match, $group, $count, $project, etc.

Examples:
- Count all documents: [{"$count": "total"}]
- Count with filter: [{"$match": {"status": "active"}}, {"$count": "activeUsers"}]
- Find documents: [{"$match": {"age": {"$gte": 18}}}, {"$limit": 10}]
- Group and count: [{"$match": {"status": "active"}}, {"$group": {"_id": "$category", "count": {"$sum": 1}}}]
`
    }

    const content = docs[topic] || `No MongoDB documentation available for topic: ${topic}`
    return { success: true, content }
  }
}

export { MongoDBManager }
export type { MongoConfig, MongoConnection }

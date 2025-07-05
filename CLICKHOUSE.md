# ClickHouse Integration

Data-Pup now includes full support for ClickHouse databases with a comprehensive implementation that handles connections, queries, and database exploration.

## Features

### 🔌 Connection Management
- **Secure Connection Storage**: All ClickHouse credentials are encrypted and stored locally
- **Connection Pooling**: Efficient connection management with keep-alive support
- **SSL/TLS Support**: Secure connections with configurable SSL settings
- **Connection Testing**: Automatic connection validation on connect

### 📊 Query Execution
- **SQL Query Editor**: Full-featured SQL editor with syntax highlighting
- **Result Display**: Tabular results with proper formatting
- **Error Handling**: Comprehensive error reporting and display
- **Query History**: Track and manage your query history

### 🗂️ Database Exploration
- **Database Listing**: View all available databases
- **Table Discovery**: Browse tables within databases
- **Schema Inspection**: View table schemas and column information
- **Metadata Queries**: Execute system queries for database information

## Configuration

### Connection Parameters

When connecting to ClickHouse, you can configure the following parameters:

```typescript
interface ClickHouseConfig {
  host: string           // ClickHouse server hostname
  port: number          // ClickHouse server port (default: 8123 for HTTP, 9000 for native)
  database: string      // Default database name
  username: string      // ClickHouse username
  password: string      // ClickHouse password
  secure?: boolean      // Enable SSL/TLS (default: false)
  timeout?: number      // Connection timeout in milliseconds (default: 30000)
}
```

### Default Ports

- **HTTP Interface**: 8123 (default for web-based connections)
- **Native Interface**: 9000 (default for binary protocol)
- **HTTPS Interface**: 8443 (secure HTTP)

## Usage Examples

### Basic Connection

1. Click "Connect to Database" in the sidebar
2. Select "ClickHouse" as the database type
3. Enter your connection details:
   - **Host**: `localhost` (or your ClickHouse server)
   - **Port**: `8123` (HTTP) or `9000` (native)
   - **Database**: `default` (or your database name)
   - **Username**: Your ClickHouse username
   - **Password**: Your ClickHouse password
4. Check "Save connection details securely" if you want to save the connection
5. Click "Connect"

### Query Examples

Once connected, you can execute ClickHouse-specific queries:

#### Basic Queries
```sql
-- Show all databases
SHOW DATABASES

-- Show tables in current database
SHOW TABLES

-- Basic SELECT query
SELECT * FROM your_table LIMIT 10
```

#### ClickHouse-Specific Features
```sql
-- Use ClickHouse-specific functions
SELECT 
    toDate(timestamp) as date,
    count() as count
FROM events 
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY date
ORDER BY date

-- Use ClickHouse data types
SELECT 
    toFixedString('hello', 10) as fixed_string,
    toDateTime('2023-01-01 12:00:00') as datetime,
    toDecimal32(123.456, 3) as decimal
```

#### System Queries
```sql
-- Get system information
SELECT * FROM system.numbers LIMIT 10

-- Check table engines
SELECT 
    database,
    table,
    engine
FROM system.tables
WHERE database = 'your_database'

-- Monitor query performance
SELECT 
    query,
    duration,
    memory_usage
FROM system.query_log
ORDER BY duration DESC
LIMIT 10
```

## Advanced Features

### Connection Pooling

The ClickHouse implementation includes connection pooling with:
- **Keep-alive connections**: Maintains persistent connections
- **Automatic reconnection**: Handles connection failures gracefully
- **Connection limits**: Prevents resource exhaustion

### Compression

ClickHouse connections support compression:
- **Response compression**: Reduces network bandwidth
- **Request compression**: Optional for large queries
- **Automatic detection**: Handles compression transparently

### Security

- **Password encryption**: All credentials are encrypted at rest
- **SSL/TLS support**: Secure connections when enabled
- **No credential logging**: Passwords are never logged

## Troubleshooting

### Common Issues

#### Connection Refused
```
Error: Connection refused
```
**Solution**: Check that ClickHouse is running and the port is correct.

#### Authentication Failed
```
Error: Authentication failed
```
**Solution**: Verify username and password are correct.

#### Database Not Found
```
Error: Database 'database_name' doesn't exist
```
**Solution**: Check the database name or create the database first.

#### Permission Denied
```
Error: Permission denied
```
**Solution**: Ensure the user has proper permissions for the database/table.

### Performance Tips

1. **Use appropriate data types**: ClickHouse is optimized for specific data types
2. **Leverage columnar storage**: Design queries to take advantage of columnar storage
3. **Use materialized views**: For frequently accessed data
4. **Optimize table engines**: Choose the right engine for your use case

### ClickHouse-Specific Optimizations

```sql
-- Use FINAL for deduplication
SELECT * FROM table_name FINAL WHERE date = '2023-01-01'

-- Use PREWHERE for better performance
SELECT * FROM table_name PREWHERE date = '2023-01-01' WHERE user_id = 123

-- Use SAMPLE for approximate queries
SELECT count() FROM table_name SAMPLE 0.1
```

## Dependencies

The ClickHouse integration requires:
- `clickhouse-client`: Official ClickHouse Node.js client
- Node.js 18+ for optimal performance

## Future Enhancements

- **Query Builder**: Visual query builder for ClickHouse
- **Data Import/Export**: Bulk data operations
- **Performance Monitoring**: Query performance analytics
- **Schema Migration**: Table structure management
- **Backup/Restore**: Database backup functionality

---

For more information about ClickHouse, visit the [official documentation](https://clickhouse.com/docs/). 
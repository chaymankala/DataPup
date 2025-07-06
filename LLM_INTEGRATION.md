# LLM Integration for Natural Language Queries

DataPup now includes AI-powered natural language query capabilities using Google's Gemini API. This feature allows you to ask questions about your data in plain English and get SQL queries generated automatically.

## Features

### 🤖 Natural Language to SQL
- **Plain English Queries**: Ask questions like "Show me all users" or "Count records in the users table"
- **Smart Schema Understanding**: The AI understands your database structure and generates appropriate SQL
- **Sample Data Context**: Uses sample data to improve query accuracy
- **Multiple Database Support**: Currently supports ClickHouse, with extensibility for other databases

### 🔍 Schema Introspection
- **Automatic Discovery**: Automatically discovers tables, columns, and data types
- **Schema Visualization**: View your database schema in a readable format
- **Sample Data Preview**: See sample data to help the AI understand your data structure

### ⚡ Query Execution
- **One-Click Execution**: Generate and execute queries with a single click
- **Query Explanation**: Get explanations of what the generated SQL does
- **Result Display**: View results in the same familiar table format
- **Query History**: Generated queries are saved as new tabs for reuse

## Setup

### 1. Get a Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Set Environment Variable
Set your Gemini API key as an environment variable:

```bash
# macOS/Linux
export GEMINI_API_KEY="your-api-key-here"

# Windows
set GEMINI_API_KEY=your-api-key-here
```

### 3. Restart DataPup
Restart the application for the environment variable to take effect.

## Usage

### Creating Natural Language Query Tabs
1. Connect to your database
2. Click the "+" button in the query tabs
3. Select "Natural Language Query" from the dropdown
4. A new tab will open with the natural language interface

### Asking Questions
1. Type your question in the text area
2. Use example queries as starting points:
   - "Show me all users"
   - "Count the number of records in the users table"
   - "Find users created in the last 7 days"
   - "Show me the top 10 users by creation date"
   - "What tables are available in this database?"

### Query Options
- **Generate SQL**: Creates SQL without executing it
- **Ask & Execute**: Generates and executes the query immediately
- **Show Schema**: Displays your database structure for reference

### Understanding Results
- **Generated SQL**: See the SQL that was created from your question
- **Explanation**: Read what the query does in plain English
- **Results**: View the data in a familiar table format
- **Export**: Export results to CSV or JSON

## Example Queries

### Basic Queries
```
"Show me all users"
→ SELECT * FROM users

"Count records in the users table"
→ SELECT COUNT(*) FROM users

"Find users with email containing '@example.com'"
→ SELECT * FROM users WHERE email LIKE '%@example.com%'
```

### Complex Queries
```
"Show me users created in the last 30 days"
→ SELECT * FROM users WHERE created_at >= now() - INTERVAL 30 DAY

"Get the top 5 users by creation date"
→ SELECT * FROM users ORDER BY created_at DESC LIMIT 5

"Count users by creation date (grouped by day)"
→ SELECT DATE(created_at) as date, COUNT(*) as count 
  FROM users 
  GROUP BY DATE(created_at) 
  ORDER BY date
```

### Aggregation Queries
```
"What's the average age of users?"
→ SELECT AVG(age) FROM users

"Show me the distribution of users by status"
→ SELECT status, COUNT(*) as count 
  FROM users 
  GROUP BY status
```

## Technical Details

### Architecture
- **Gemini Service**: Handles AI interactions using Google's Gemini API
- **Schema Introspector**: Discovers and formats database schema information
- **Natural Language Processor**: Orchestrates the entire query generation process
- **Database Integration**: Seamlessly integrates with existing database connections

### API Endpoints
- `nlq:process`: Process natural language and execute query
- `nlq:generateSQL`: Generate SQL without execution
- `nlq:getSchema`: Retrieve database schema
- `nlq:validateQuery`: Validate generated SQL

### Error Handling
- **Connection Issues**: Graceful handling of database connection problems
- **API Errors**: Clear error messages for Gemini API issues
- **Schema Issues**: Fallback behavior when schema discovery fails
- **Query Validation**: Automatic validation of generated SQL

## Best Practices

### Writing Effective Queries
1. **Be Specific**: "Show me users created this month" vs "Show me users"
2. **Use Clear Language**: "Count records" vs "How many"
3. **Mention Tables**: "Show me all users" vs "Show me all data"
4. **Specify Conditions**: "Find users with admin role" vs "Find users"

### Database Considerations
1. **Table Names**: Use exact table names when possible
2. **Column Names**: Reference specific columns for better accuracy
3. **Data Types**: The AI understands common data types and functions
4. **Relationships**: Mention relationships between tables when needed

### Performance Tips
1. **Limit Results**: Ask for "top 10" or "first 100" for large datasets
2. **Use Filters**: Add date ranges or conditions to reduce data volume
3. **Sample Data**: The AI uses sample data to understand your schema better

## Troubleshooting

### Common Issues

#### "Failed to generate SQL query"
- Check your Gemini API key is set correctly
- Verify your internet connection
- Ensure the database connection is active

#### "Failed to retrieve database schema"
- Check your database connection
- Verify you have permissions to view schema information
- Try reconnecting to the database

#### "Query execution failed"
- Review the generated SQL for syntax errors
- Check database permissions
- Verify table and column names exist

#### "No data returned"
- Check if the query conditions are too restrictive
- Verify the data exists in the specified tables
- Review the generated SQL logic

### Debug Mode
Enable debug logging by setting the environment variable:
```bash
export DEBUG=true
```

## Future Enhancements

- **Query Templates**: Save and reuse common query patterns
- **Query Optimization**: AI suggestions for query performance
- **Multi-Table Joins**: Better handling of complex relationships
- **Query History**: Persistent storage of natural language queries
- **Custom Prompts**: User-defined query generation rules
- **Batch Processing**: Process multiple questions at once

## Support

For issues or questions about the LLM integration:
1. Check the troubleshooting section above
2. Review the generated SQL for accuracy
3. Test with simpler queries first
4. Verify your database schema is accessible

---

The LLM integration makes DataPup more accessible to users who prefer natural language over SQL, while maintaining the power and flexibility of direct SQL queries for advanced users. 

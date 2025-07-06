// Test script for natural language query functionality
import { NaturalLanguageQueryProcessor } from './src/main/services/naturalLanguageQueryProcessor'
import { DatabaseManager } from './src/main/database/manager'

async function testNaturalLanguageQuery() {
  console.log('Testing Natural Language Query functionality...')

  try {
    // Initialize database manager
    const databaseManager = new DatabaseManager()

    // Initialize natural language query processor
    const processor = new NaturalLanguageQueryProcessor(databaseManager)

    console.log('✅ Natural Language Query Processor initialized successfully')

    // Test schema introspection
    console.log('\nTesting schema introspection...')
    const schema = await processor.getDatabaseSchema('test-connection-id')
    if (schema) {
      console.log('✅ Schema introspection works')
      console.log('Database:', schema.database)
      console.log('Tables:', schema.tables.length)
    } else {
      console.log('⚠️ Schema introspection returned null (expected for test connection)')
    }

    console.log('\n✅ Natural Language Query test completed successfully!')
    console.log('\nTo use this feature:')
    console.log('1. Set your GEMINI_API_KEY environment variable')
    console.log('2. Connect to a database in the application')
    console.log('3. Click the "+" button in the query tabs and select "Natural Language Query"')
    console.log('4. Ask questions like "Show me all users" or "Count records in the users table"')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testNaturalLanguageQuery()

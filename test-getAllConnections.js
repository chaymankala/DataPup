// Test script to verify getAllConnections functionality
const { DatabaseManager } = require('./out/main/database/manager')

async function testGetAllConnections() {
  console.log('Testing getAllConnections functionality...')
  
  const dbManager = new DatabaseManager()
  
  try {
    // Test getting all connections when no connections exist
    console.log('\n1. Testing getAllConnections with no connections:')
    const emptyConnections = dbManager.getAllConnections()
    console.log('Result:', emptyConnections)
    console.log('Expected: []')
    console.log(emptyConnections.length === 0 ? '✓ Passed' : '✗ Failed')
    
    // Test getting supported database types
    console.log('\n2. Testing getSupportedDatabaseTypes:')
    const supportedTypes = dbManager.getSupportedDatabaseTypes()
    console.log('Supported types:', supportedTypes)
    console.log(supportedTypes.includes('clickhouse') ? '✓ Passed' : '✗ Failed')
    
    console.log('\n✅ getAllConnections test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testGetAllConnections() 
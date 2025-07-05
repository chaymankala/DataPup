import { useState } from 'react'
import { Button, Flex, Text, TextArea, Card, Table } from '@radix-ui/themes'
import './QueryEditor.css'

interface QueryEditorProps {
  connectionId: string
  connectionName: string
}

interface QueryResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
}

export function QueryEditor({ connectionId, connectionName }: QueryEditorProps) {
  const [query, setQuery] = useState('SELECT * FROM dummy_db.users')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleExecuteQuery = async () => {
    if (!query.trim()) return

    try {
      setIsExecuting(true)
      setResult(null)
      
      const queryResult = await window.api.database.query(connectionId, query.trim())
      console.log('Query result:', queryResult)
      setResult(queryResult)
    } catch (error) {
      console.error('Query execution error:', error)
      setResult({
        success: false,
        message: 'Query execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleExecuteQuery()
    }
  }

  const formatResult = (data: any[]) => {
    console.log('Formatting result data:', data)
    
    if (!data || data.length === 0) {
      return <Text color="gray">No data returned</Text>
    }

    // Handle different data structures
    let rows = data
    let columns: string[] = []

    if (Array.isArray(data) && data.length > 0) {
      const firstRow = data[0]
      if (typeof firstRow === 'object' && firstRow !== null) {
        columns = Object.keys(firstRow)
      } else {
        // Handle case where data is array of primitive values
        columns = ['value']
        rows = data.map(value => ({ value }))
      }
    }

    console.log('Columns:', columns)
    console.log('Rows:', rows)
    
    // Simple fallback display if table fails
    if (columns.length === 0) {
      return (
        <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <Text>Raw data (table rendering failed):</Text>
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )
    }
    
    return (
      <div style={{ overflow: 'auto', maxHeight: '400px' }}>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              {columns.map((column) => (
                <Table.ColumnHeaderCell key={column}>
                  {column}
                </Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row, index) => (
              <Table.Row key={index}>
                {columns.map((column) => (
                  <Table.Cell key={column}>
                    {row[column] !== null && row[column] !== undefined 
                      ? String(row[column]) 
                      : <Text color="gray">null</Text>
                    }
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    )
  }

  return (
    <div className="query-editor">
      <Flex direction="column" gap="4" height="100%">
        {/* Header */}
        <Flex justify="between" align="center">
          <Text size="3" weight="bold">
            Query Editor - {connectionName}
          </Text>
          <Text size="1" color="gray">
            Cmd/Ctrl + Enter to execute
          </Text>
        </Flex>

        {/* Query Input */}
        <Card className="query-input-card">
          <Text size="2" weight="bold" mb="2">
            SQL Query
          </Text>
          <TextArea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your SQL query here..."
            className="query-textarea"
            rows={8}
          />
          <Flex justify="end" mt="2">
            <Button 
              onClick={handleExecuteQuery} 
              disabled={isExecuting || !query.trim()}
            >
              {isExecuting ? 'Executing...' : 'Execute Query'}
            </Button>
          </Flex>
        </Card>

        {/* Results */}
        {result && (
          <Card className="query-result-card">
            <Text size="2" weight="bold" mb="2">
              Results
            </Text>
            
            {result.success ? (
              <div>
                <Text size="1" color="gray" mb="2">
                  {result.message}
                </Text>
                <div className="result-table-container">
                  {formatResult(result.data || [])}
                </div>
                {/* Debug info */}
                <details style={{ marginTop: '8px', fontSize: '12px', color: 'gray' }}>
                  <summary>Debug Info</summary>
                  <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="error-message">
                <Text color="red" weight="bold">
                  Error: {result.message}
                </Text>
                {result.error && (
                  <Text size="1" color="red" mt="1">
                    {result.error}
                  </Text>
                )}
              </div>
            )}
          </Card>
        )}
      </Flex>
    </div>
  )
} 

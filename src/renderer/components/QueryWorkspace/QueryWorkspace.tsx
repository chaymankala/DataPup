import { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box, Button, Flex, Text, TextArea, Card, Table } from '@radix-ui/themes'
import './QueryWorkspace.css'

interface QueryWorkspaceProps {
  connectionId: string
  connectionName: string
}

interface QueryResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
}

export function QueryWorkspace({ connectionId, connectionName }: QueryWorkspaceProps) {
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
    if (!data || data.length === 0) {
      return <Text color="gray">No data returned</Text>
    }

    let rows = data
    let columns: string[] = []

    if (Array.isArray(data) && data.length > 0) {
      const firstRow = data[0]
      if (typeof firstRow === 'object' && firstRow !== null) {
        columns = Object.keys(firstRow)
      } else {
        columns = ['value']
        rows = data.map(value => ({ value }))
      }
    }
    
    return (
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
    )
  }

  return (
    <Box className="query-workspace">
      <PanelGroup direction="vertical" className="workspace-panels">
        {/* Top panel: Query editor */}
        <Panel defaultSize={40} minSize={20} className="editor-panel">
          <Flex direction="column" height="100%" p="3">
            <Flex justify="between" align="center" mb="3">
              <Text size="3" weight="bold">Query Editor</Text>
              <Text size="1" color="gray">Cmd/Ctrl + Enter to execute</Text>
            </Flex>
            
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TextArea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your SQL query here..."
                style={{ 
                  flex: 1, 
                  width: '100%', 
                  resize: 'none',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
              />
              <Flex justify="end" mt="2" gap="2">
                <Button 
                  onClick={handleExecuteQuery} 
                  disabled={isExecuting || !query.trim()}
                  variant="solid"
                >
                  {isExecuting ? 'Executing...' : 'Execute Query'}
                </Button>
              </Flex>
            </Box>
          </Flex>
        </Panel>
        
        <PanelResizeHandle className="resize-handle-horizontal" />
        
        {/* Bottom panel: Results */}
        <Panel defaultSize={60} minSize={20} className="results-panel">
          <Box p="3" style={{ height: '100%', overflow: 'auto' }}>
            <Text size="3" weight="bold" mb="3">Results</Text>
            
            {result ? (
              result.success ? (
                <Box>
                  <Text size="1" color="gray" mb="2">
                    {result.message}
                  </Text>
                  <Box className="result-table-container">
                    {formatResult(result.data || [])}
                  </Box>
                </Box>
              ) : (
                <Box className="error-message">
                  <Text color="red" weight="bold">
                    Error: {result.message}
                  </Text>
                  {result.error && (
                    <Text size="1" color="red" mt="1" style={{ display: 'block' }}>
                      {result.error}
                    </Text>
                  )}
                </Box>
              )
            ) : (
              <Text color="gray" size="2">
                Execute a query to see results here
              </Text>
            )}
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  )
}

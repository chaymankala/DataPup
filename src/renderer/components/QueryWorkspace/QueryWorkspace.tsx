import { useState, useRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box, Button, Flex, Text, Table } from '@radix-ui/themes'
import Editor, { Monaco } from '@monaco-editor/react'
import { Skeleton } from '../ui'
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

// SQL keywords for autocomplete
const sqlKeywords = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT',
  'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER',
  'DROP', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'AS',
  'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN',
  'ELSE', 'END', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE',
  'IS', 'NULL', 'ASC', 'DESC', 'UNION', 'ALL', 'ANY', 'SOME'
]

export function QueryWorkspace({ connectionId, connectionName }: QueryWorkspaceProps) {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor

    // Configure SQL language settings
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: () => {
        const suggestions = sqlKeywords.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          documentation: `SQL keyword: ${keyword}`
        }))
        return { suggestions }
      }
    })

    // Add keyboard shortcuts
    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleExecuteQuery()
    })

    // Track selected text
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection()
      const text = editor.getModel().getValueInRange(selection)
      setSelectedText(text)
    })
  }

  const handleExecuteQuery = async () => {
    const queryToExecute = selectedText || query
    if (!queryToExecute.trim()) return

    try {
      setIsExecuting(true)
      setResult(null)

      const queryResult = await window.api.database.query(connectionId, queryToExecute.trim())
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

  const formatQuery = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run()
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
        rows = data.map((value) => ({ value }))
      }
    }

    return (
      <Table.Root>
        <Table.Header>
          <Table.Row>
            {columns.map((column) => (
              <Table.ColumnHeaderCell key={column}>{column}</Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, index) => (
            <Table.Row key={index}>
              {columns.map((column) => (
                <Table.Cell key={column}>
                  {row[column] !== null && row[column] !== undefined ? (
                    String(row[column])
                  ) : (
                    <Text color="gray">null</Text>
                  )}
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
              <Flex align="center" gap="3">
                <Text size="3" weight="bold">
                  Query Editor
                </Text>
                <Text size="2" color="gray">
                  {connectionName}
                </Text>
              </Flex>
              <Flex gap="2" align="center">
                <Text size="1" color="gray">
                  {selectedText ? 'Execute selected' : 'Cmd/Ctrl + Enter to execute'}
                </Text>
                <Button size="1" variant="soft" onClick={formatQuery}>
                  Format
                </Button>
                <Button
                  onClick={handleExecuteQuery}
                  disabled={isExecuting || (!query.trim() && !selectedText.trim())}
                  variant="solid"
                  size="2"
                >
                  {isExecuting ? 'Executing...' : 'Execute'}
                </Button>
              </Flex>
            </Flex>

            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Editor
                height="100%"
                defaultLanguage="sql"
                theme="vs-dark"
                value={query}
                onChange={(value) => setQuery(value || '')}
                onMount={handleEditorDidMount}
                loading={<Skeleton height="100%" />}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: false
                  },
                  parameterHints: {
                    enabled: true
                  }
                }}
              />
            </Box>
          </Flex>
        </Panel>

        <PanelResizeHandle className="resize-handle-horizontal" />

        {/* Bottom panel: Results */}
        <Panel defaultSize={60} minSize={20} className="results-panel">
          <Box p="3" style={{ height: '100%', overflow: 'auto' }}>
            <Flex justify="between" align="center" mb="3">
              <Text size="3" weight="bold">
                Results
              </Text>
              {result?.success && result.data && (
                <Text size="1" color="gray">
                  {result.data.length} rows returned
                </Text>
              )}
            </Flex>

            {result ? (
              result.success ? (
                <Box>
                  <Box className="result-table-container">{formatResult(result.data || [])}</Box>
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

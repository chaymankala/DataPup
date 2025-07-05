import { useState, useRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box, Button, Flex, Text, Table } from '@radix-ui/themes'
import Editor, { Monaco } from '@monaco-editor/react'
import { Skeleton, Badge } from '../ui'
import { exportToCSV, exportToJSON } from '../../utils/exportData'
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
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'ON',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'ALTER',
  'DROP',
  'INDEX',
  'VIEW',
  'PROCEDURE',
  'FUNCTION',
  'TRIGGER',
  'AS',
  'DISTINCT',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'AND',
  'OR',
  'NOT',
  'IN',
  'EXISTS',
  'BETWEEN',
  'LIKE',
  'IS',
  'NULL',
  'ASC',
  'DESC',
  'UNION',
  'ALL',
  'ANY',
  'SOME'
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
      <Table.Root size="1">
        <Table.Header>
          <Table.Row>
            {columns.map((column) => (
              <Table.ColumnHeaderCell key={column}>
                <Text size="1" weight="medium">
                  {column}
                </Text>
              </Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, index) => (
            <Table.Row key={index}>
              {columns.map((column) => (
                <Table.Cell key={column}>
                  <Text size="1">
                    {row[column] !== null && row[column] !== undefined ? (
                      String(row[column])
                    ) : (
                      <Text size="1" color="gray">null</Text>
                    )}
                  </Text>
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
        <Panel defaultSize={50} minSize={30} className="editor-panel">
          <Flex direction="column" height="100%">
            <Flex justify="between" align="center" p="2" className="editor-header">
              <Flex align="center" gap="2">
                {selectedText && (
                  <Badge size="1" variant="soft">
                    Selection
                  </Badge>
                )}
              </Flex>
              <Flex gap="2" align="center">
                <Button size="1" variant="ghost" onClick={formatQuery}>
                  Format
                </Button>
                <Button
                  onClick={handleExecuteQuery}
                  disabled={isExecuting || (!query.trim() && !selectedText.trim())}
                  size="1"
                >
                  {isExecuting ? (
                    <>
                      <Box className="spinner" />
                      Running...
                    </>
                  ) : (
                    <>Run<Text size="1" color="gray" ml="1">⌘↵</Text></>
                  )}
                </Button>
              </Flex>
            </Flex>

            <Box className="editor-container">
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
                  fontSize: 13,
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
                  },
                  padding: { top: 12, bottom: 12 },
                  lineNumbersMinChars: 3
                }}
              />
            </Box>
          </Flex>
        </Panel>

        <PanelResizeHandle className="resize-handle-horizontal" />

        {/* Bottom panel: Results */}
        <Panel defaultSize={50} minSize={20} className="results-panel">
          <Flex direction="column" height="100%">
            <Flex justify="between" align="center" p="2" className="results-header">
              <Text size="2" weight="medium">
                Results
              </Text>
              {result?.success && result.data && (
                <Flex align="center" gap="3">
                  <Text size="1" color="gray">
                    {result.data.length} rows
                  </Text>
                  <Flex gap="1">
                    <Button
                      size="1"
                      variant="ghost"
                      onClick={() => exportToCSV(result.data || [], 'query-results.csv')}
                      disabled={!result.data || result.data.length === 0}
                    >
                      CSV
                    </Button>
                    <Button
                      size="1"
                      variant="ghost"
                      onClick={() => exportToJSON(result.data || [], 'query-results.json')}
                      disabled={!result.data || result.data.length === 0}
                    >
                      JSON
                    </Button>
                  </Flex>
                </Flex>
              )}
            </Flex>

            <Box className="results-content" flex="1">
              {result ? (
                result.success ? (
                  <Box className="result-table-container">
                    {formatResult(result.data || [])}
                  </Box>
                ) : (
                  <Flex align="center" justify="center" height="100%" p="4">
                    <Box className="error-message">
                      <Text size="2" color="red" weight="medium">
                        {result.message}
                      </Text>
                      {result.error && (
                        <Text size="1" color="red" mt="1" style={{ display: 'block' }}>
                          {result.error}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                )
              ) : (
                <Flex align="center" justify="center" height="100%">
                  <Text color="gray" size="1">
                    Execute a query to see results
                  </Text>
                </Flex>
              )}
            </Box>
          </Flex>
        </Panel>
      </PanelGroup>
    </Box>
  )
}

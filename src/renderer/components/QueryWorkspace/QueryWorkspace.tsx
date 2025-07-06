import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box, Button, Flex, Text, Table } from '@radix-ui/themes'
import Editor, { Monaco } from '@monaco-editor/react'
import { Skeleton, Badge } from '../ui'
import { QueryTabs } from '../QueryTabs/QueryTabs'
import { TableView } from '../TableView/TableView'
import { exportToCSV, exportToJSON } from '../../utils/exportData'
import { Tab, QueryTab, TableTab, QueryExecutionResult } from '../../types/tabs'
import './QueryWorkspace.css'
import { v4 as uuidv4 } from 'uuid';

interface QueryWorkspaceProps {
  connectionId: string
  connectionName: string
  onOpenTableTab?: (database: string, tableName: string) => void
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

export function QueryWorkspace({ connectionId, connectionName, onOpenTableTab }: QueryWorkspaceProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      type: 'query',
      title: 'Query 1',
      query: '',
      isDirty: false
    }
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [results, setResults] = useState<Record<string, QueryExecutionResult>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const editorRef = useRef<any>(null)

  const activeTab = tabs.find(tab => tab.id === activeTabId)
  const activeResult = activeTab ? results[activeTab.id] : null

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor

    // Define a custom theme that works well with both light and dark backgrounds
    monaco.editor.defineTheme('data-pup', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'string', foreground: 'A31515' },
        { token: 'string.sql', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'operator', foreground: '000000' },
        { token: 'delimiter', foreground: '000000' },
        { token: 'identifier', foreground: '001080' },
        { token: '', foreground: '000000' } // default text
      ],
      colors: {
        'editor.foreground': '#000000',
        'editor.background': '#00000000', // transparent
        'editor.selectionBackground': '#ADD6FF',
        'editor.lineHighlightBackground': '#00000000', // transparent - no highlight
        'editor.lineHighlightBorder': '#00000000', // transparent - no border
        'editorCursor.foreground': '#000000',
        'editorWhitespace.foreground': '#CCCCCC'
      }
    })

    // Apply our custom theme
    monaco.editor.setTheme('data-pup')

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
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE
      ],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: () => {
        handleExecuteQuery()
      }
    })

    // Track selected text
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection()
      const text = editor.getModel().getValueInRange(selection)
      setSelectedText(text)
    })
  }

  // Tab management functions
  const handleNewTab = useCallback(() => {
    const newTab: QueryTab = {
      id: Date.now().toString(),
      type: 'query',
      title: `Query ${tabs.length + 1}`,
      query: '',
      isDirty: false
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }, [tabs])

  const handleCloseTab = useCallback((tabId: string) => {
    if (tabs.length === 1) return // Keep at least one tab

    const tabIndex = tabs.findIndex(t => t.id === tabId)
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)

    // Update active tab if needed
    if (activeTabId === tabId) {
      const newActiveTab = tabIndex > 0 ? newTabs[tabIndex - 1] : newTabs[0]
      setActiveTabId(newActiveTab.id)
    }

    // Clean up results
    const newResults = { ...results }
    delete newResults[tabId]
    setResults(newResults)
  }, [tabs, activeTabId, results])

  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleUpdateTabTitle = useCallback((tabId: string, title: string) => {
    setTabs(tabs.map(tab =>
      tab.id === tabId ? { ...tab, title } : tab
    ))
  }, [tabs])

  const handleUpdateTabContent = useCallback((tabId: string, updates: Partial<Tab>) => {
    setTabs(tabs.map(tab =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    ))
  }, [tabs])

  // Open table tab from database explorer
  const openTableTab = useCallback((database: string, tableName: string) => {
    const newTab: TableTab = {
      id: Date.now().toString(),
      type: 'table',
      title: `${database}.${tableName}`,
      database,
      tableName,
      filters: [],
      isDirty: false
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }, [tabs])

  // Expose openTableTab to parent component
  React.useEffect(() => {
    if (onOpenTableTab) {
      window.openTableTab = openTableTab
    }
  }, [openTableTab, onOpenTableTab])

  const handleExecuteQuery = async () => {
    if (!activeTab || activeTab.type !== 'query') return

    let queryToExecute = ''

    // If there's selected text, use only that
    if (selectedText && selectedText.trim()) {
      queryToExecute = selectedText.trim()
    } else {
      // Otherwise use the full editor content
      const currentQuery = editorRef.current?.getValue() || activeTab.query
      queryToExecute = currentQuery.trim()
    }

    if (!queryToExecute) return

    try {
      setIsExecuting(true)
      const startTime = Date.now()

      const sessionId = uuidv4();
      const queryResult = await window.api.database.query(connectionId, queryToExecute.trim(), sessionId)
      const executionTime = Date.now() - startTime

      const result: QueryExecutionResult = {
        ...queryResult,
        executionTime,
        rowCount: queryResult.data?.length || 0
      }

      setResults({ ...results, [activeTab.id]: result })
    } catch (error) {
      console.error('Query execution error:', error)
      setResults({
        ...results,
        [activeTab.id]: {
          success: false,
          message: 'Query execution failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
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
      <Flex direction="column" height="100%">
        {/* Tabs */}
        <Box className="tabs-section" p="2">
          <QueryTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onNewTab={handleNewTab}
            onCloseTab={handleCloseTab}
            onUpdateTabTitle={handleUpdateTabTitle}
          />
        </Box>

        {/* Content */}
        {activeTab && activeTab.type === 'query' ? (
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
                      disabled={isExecuting || (!activeTab.query && !selectedText.trim())}
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
                    theme="data-pup"
                    value={activeTab.query}
                    onChange={(value) => handleUpdateTabContent(activeTab.id, {
                      query: value || '',
                      isDirty: true
                    })}
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
                      lineNumbersMinChars: 3,
                      renderLineHighlight: 'none',
                      renderLineHighlightOnlyWhenFocus: false
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
                  <Flex align="center" gap="3">
                    <Text size="2" weight="medium">
                      Results
                    </Text>
                    {activeResult?.success && activeResult.data && (
                      <>
                        <Badge size="1" variant="soft">
                          {activeResult.rowCount || activeResult.data.length} rows
                        </Badge>
                        {activeResult.executionTime && (
                          <Badge size="1" variant="soft" color="gray">
                            {activeResult.executionTime}ms
                          </Badge>
                        )}
                      </>
                    )}
                  </Flex>

                  {activeResult?.success && activeResult.data && activeResult.data.length > 0 && (
                    <Flex gap="1">
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={() => exportToCSV(activeResult.data || [], 'query-results.csv')}
                      >
                        CSV
                      </Button>
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={() => exportToJSON(activeResult.data || [], 'query-results.json')}
                      >
                        JSON
                      </Button>
                    </Flex>
                  )}
                </Flex>

                <Box className="results-content" flex="1">
                  {activeResult ? (
                    activeResult.success ? (
                      <Box className="result-table-container">
                        {formatResult(activeResult.data || [])}
                      </Box>
                    ) : (
                      <Flex align="center" justify="center" height="100%" p="4">
                        <Box className="error-message">
                          <Text size="2" color="red" weight="medium">
                            {activeResult.message}
                          </Text>
                          {activeResult.error && (
                            <Text size="1" color="red" mt="1" style={{ display: 'block' }}>
                              {activeResult.error}
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
        ) : activeTab && activeTab.type === 'table' ? (
          <Box flex="1" style={{ overflow: 'hidden' }}>
            <TableView
              connectionId={connectionId}
              database={activeTab.database}
              tableName={activeTab.tableName}
              onFiltersChange={(filters) =>
                handleUpdateTabContent(activeTab.id, { filters })
              }
            />
          </Box>
        ) : null}
      </Flex>
    </Box>
  )
}

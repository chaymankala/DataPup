import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle
} from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box, Button, Flex, Text, Table, ContextMenu, Dialog, Badge } from '@radix-ui/themes'
import Editor from '@monaco-editor/react'
import { Monaco } from '@monaco-editor/react'
import { QueryTabs } from '../QueryTabs/QueryTabs'
import { TableView } from '../TableView/TableView'
import DocumentsView from '../TableView/DocumentsView'
import { SqlEditor } from './SqlEditor'
import { ExclamationTriangleIcon, CodeIcon, PlayIcon } from '@radix-ui/react-icons'

import { exportToCSV, exportToJSON } from '../../utils/exportData'
import { Tab, QueryTab, TableTab, QueryExecutionResult } from '../../types/tabs'
import {
  isSelectQuery,
  hasLimitClause,
  addLimitToQuery,
  mightReturnLargeResultSet
} from '../../utils/queryParser'
import './QueryWorkspace.css'

const DEFAULT_LIMIT = 100

interface QueryWorkspaceProps {
  connectionId: string
  connectionName?: string
  onOpenTableTab?: (database: string, tableName: string) => void
  onRegisterNewTabHandler?: (handler: () => void) => void
}

// MongoDB Results Component
const MongoResultsView = ({ data, result }: { data: any[]; result?: QueryExecutionResult }) => {
  const [isJsonViewerOpen, setIsJsonViewerOpen] = useState(false)
  const [jsonViewerInitialValue, setJsonViewerInitialValue] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  const toggleRowSelection = (index: number) => {
    const next = new Set(selectedRows)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedRows(next)
  }

  const handleOpenJsonViewer = (value: any) => {
    setJsonViewerInitialValue(JSON.stringify(value, null, 2))
    setIsJsonViewerOpen(true)
  }

  if (!data || data.length === 0) {
    return <Text color="gray">No data returned</Text>
  }

  // Debug: log the data to see what we're getting
  console.log('MongoResultsView data:', data)
  console.log('MongoResultsView data length:', data?.length)
  console.log('MongoResultsView data type:', typeof data)
  console.log('MongoResultsView data is array:', Array.isArray(data))

  return (
    <>
      <Flex direction="column" gap="2">
        {data.map((doc, index) => {
          const isSelected = selectedRows.has(index)

          // Handle different data structures
          let idValue, json
          if (doc && typeof doc === 'object') {
            idValue = doc._id ?? doc.id ?? `Result ${index + 1}`
            json = JSON.stringify(doc, null, 2)
          } else {
            idValue = `Result ${index + 1}`
            json = JSON.stringify(doc, null, 2)
          }

          // Debug: log each document
          console.log(`Document ${index}:`, doc)
          console.log(`JSON for doc ${index}:`, json)
          console.log(`JSON length: ${json?.length}, JSON type: ${typeof json}`)
          console.log(
            `JSON conditions - json exists: ${!!json}, not empty: ${json?.trim() !== ''}, not empty object: ${json !== '{}'}, not null: ${json !== 'null'}`
          )

          return (
            <ContextMenu.Root key={index}>
              <ContextMenu.Trigger>
                <Box
                  onClick={() => toggleRowSelection(index)}
                  onDoubleClick={() => handleOpenJsonViewer(doc)}
                  style={{
                    border: '1px solid var(--gray-a5)',
                    borderRadius: '6px',
                    background: isSelected ? 'var(--accent-a2)' : 'var(--color-panel)',
                    padding: '8px'
                  }}
                >
                  <Flex justify="between" align="center" mb="1">
                    <Text size="1" weight="medium" style={{ fontFamily: 'monospace' }}>
                      {typeof idValue === 'object' ? JSON.stringify(idValue) : String(idValue)}
                    </Text>
                    <Badge size="1" variant="soft">
                      Doc {index + 1}
                    </Badge>
                  </Flex>
                  <Box
                    style={{
                      maxHeight: '200px',
                      overflow: 'auto',
                      background: 'var(--gray-2)',
                      borderRadius: '4px',
                      padding: '8px',
                      border: '1px solid var(--gray-6)'
                    }}
                  >
                    <Text
                      size="1"
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        color: 'var(--gray-12)',
                        lineHeight: '1.4'
                      }}
                    >
                      {json && json.trim() !== '' && json !== '{}' && json !== 'null'
                        ? json
                        : 'No content available'}
                    </Text>
                  </Box>
                </Box>
              </ContextMenu.Trigger>
              <ContextMenu.Content size="1" style={{ minWidth: '140px' }}>
                <ContextMenu.Item onClick={() => handleOpenJsonViewer(doc)}>
                  Open JSON
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          )
        })}
      </Flex>

      <Dialog.Root open={isJsonViewerOpen} onOpenChange={setIsJsonViewerOpen}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <Dialog.Title>
            <Text size="1">JSON</Text>
          </Dialog.Title>
          <Box
            mt="3"
            style={{
              maxHeight: '50vh',
              overflow: 'auto',
              background: 'var(--gray-2)',
              borderRadius: 'var(--radius-2)',
              padding: 'var(--space-2)'
            }}
          >
            <Editor
              key={jsonViewerInitialValue}
              height="400px"
              defaultLanguage="json"
              defaultValue={jsonViewerInitialValue}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'off',
                wordWrap: 'on',
                automaticLayout: true
              }}
              theme={document.body.classList.contains('dark') ? 'vs-dark' : 'vs'}
            />
          </Box>
          <Flex gap="2" mt="3" justify="end">
            <Dialog.Close>
              <Button size="1" variant="soft">
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

export const QueryWorkspace = forwardRef<any, QueryWorkspaceProps>(function QueryWorkspace(
  { connectionId, onOpenTableTab, onRegisterNewTabHandler },
  ref
) {
  const [connectionType, setConnectionType] = useState<string | null>(null)
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
  const executeQueryRef = useRef<() => void>(() => {})
  const saveQueryRef = useRef<() => void>(() => {})
  const newTabRef = useRef<() => void>(() => {})
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const [queryLimitOverride, setQueryLimitOverride] = useState(false)

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const activeResult = activeTab ? results[activeTab.id] : null

  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor

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
        if (executeQueryRef.current) {
          executeQueryRef.current()
        }
      }
    })

    editor.addAction({
      id: 'save-query',
      label: 'Save Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.6,
      run: () => {
        if (saveQueryRef.current) {
          saveQueryRef.current()
        }
      }
    })

    editor.addAction({
      id: 'new-query-tab',
      label: 'New Query Tab',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.6,
      run: () => {
        if (newTabRef.current) {
          newTabRef.current()
        }
      }
    })
  }, [])

  // Tab management functions
  const handleNewTab = useCallback(() => {
    const newTab: QueryTab = {
      id: Date.now().toString(),
      type: 'query',
      title: `Query ${tabs.length + 1}`,
      query: '',
      isDirty: false
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [tabs])

  const handleCloseTab = useCallback(
    (tabId: string) => {
      if (tabs.length === 1) return // Keep at least one tab

      const tabIndex = tabs.findIndex((t) => t.id === tabId)
      const newTabs = tabs.filter((t) => t.id !== tabId)
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
    },
    [tabs, activeTabId, results]
  )

  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setShowLimitWarning(false)
    setQueryLimitOverride(false)
  }, [])

  const handleUpdateTabTitle = useCallback(
    (tabId: string, title: string) => {
      setTabs(tabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab)))
    },
    [tabs]
  )

  const handleUpdateTabContent = useCallback((tabId: string, updates: any) => {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)))
  }, [])

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
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [])

  // Expose openTableTab to parent component
  React.useEffect(() => {
    if (onOpenTableTab) {
      window.openTableTab = openTableTab
    }
  }, [openTableTab, onOpenTableTab])

  // Update the ref whenever handleNewTab changes
  useEffect(() => {
    newTabRef.current = handleNewTab
  }, [handleNewTab])

  // Register the new tab handler with parent component
  useEffect(() => {
    if (onRegisterNewTabHandler) {
      onRegisterNewTabHandler(handleNewTab)
    }
  }, [handleNewTab, onRegisterNewTabHandler])

  const executeQuery = useCallback(
    async (queryToExecute: string, forceUnlimited = false) => {
      if (!activeTab || activeTab.type !== 'query') return

      if (!queryToExecute.trim()) return

      try {
        setIsExecuting(true)
        const startTime = Date.now()

        let finalQuery = queryToExecute.trim()

        // Check if we should add a limit
        if (
          isSelectQuery(finalQuery) &&
          !hasLimitClause(finalQuery) &&
          !forceUnlimited &&
          !queryLimitOverride
        ) {
          if (mightReturnLargeResultSet(finalQuery)) {
            setShowLimitWarning(true)
            finalQuery = addLimitToQuery(finalQuery, DEFAULT_LIMIT)
          }
        }

        const queryResult = await window.api.database.query(connectionId, finalQuery)
        const executionTime = Date.now() - startTime

        const result: QueryExecutionResult = {
          ...queryResult,
          executionTime,
          rowCount: queryResult.data?.length || 0
        }

        setResults({ ...results, [activeTab.id]: result })
      } catch (error) {
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
    },
    [activeTab, results, connectionId, queryLimitOverride]
  )

  const handleExecuteQuery = useCallback(async () => {
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

    await executeQuery(queryToExecute)
  }, [activeTab, selectedText, executeQuery])

  const handleSaveQuery = useCallback(async () => {
    if (!activeTab || activeTab.type !== 'query' || !activeTab.query.trim()) return

    // Use the tab title as the query name
    const name = activeTab.title

    try {
      const connectionInfo = await window.api.database.getConnectionInfo(connectionId)
      const result = await window.api.savedQueries.save({
        name,
        query: activeTab.query,
        connectionType: connectionInfo?.info?.type
      })

      if (result.success) {
        // Update the tab to indicate it's saved
        handleUpdateTabContent(activeTab.id, { isDirty: false })
        // Show a subtle notification or just log
        console.log('Query saved successfully as:', name)
      }
    } catch (error) {
      console.error('Failed to save query:', error)
    }
  }, [activeTab, connectionId, handleUpdateTabContent])
  // Load connection info (type) once
  useEffect(() => {
    const loadConnInfo = async () => {
      try {
        const info = await window.api.database.getConnectionInfo(connectionId)
        setConnectionType(info?.info?.type || null)
      } catch (e) {
        setConnectionType(null)
      }
    }
    loadConnInfo()
  }, [connectionId])

  // Update the refs whenever handlers change
  useEffect(() => {
    executeQueryRef.current = handleExecuteQuery
  }, [handleExecuteQuery])

  useEffect(() => {
    saveQueryRef.current = handleSaveQuery
  }, [handleSaveQuery])

  const handleExecuteQueryFromAI = async (sqlQuery: string) => {
    // Update the editor content with the SQL query
    if (activeTab && activeTab.type === 'query') {
      handleUpdateTabContent(activeTab.id, {
        query: sqlQuery,
        isDirty: true
      })

      // Update the editor value
      if (editorRef.current) {
        editorRef.current.setValue(sqlQuery)
      }
    }

    // Execute the query
    await executeQuery(sqlQuery)
  }

  const formatQuery = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run()
    }
  }

  // Expose methods for external components
  useImperativeHandle(
    ref,
    () => ({
      updateActiveTabQuery: (query: string, name?: string) => {
        if (activeTab && activeTab.type === 'query') {
          handleUpdateTabContent(activeTab.id, {
            query,
            title: name || activeTab.title,
            isDirty: false
          })
          if (editorRef.current) {
            editorRef.current.setValue(query)
          }
        }
      },
      executeQueryDirectly: async (query: string) => {
        await executeQuery(query)
      },
      executeQueryFromAI: handleExecuteQueryFromAI
    }),
    [activeTab, handleUpdateTabContent, executeQuery, handleExecuteQueryFromAI]
  )

  const formatResult = (data: any[], result?: QueryExecutionResult) => {
    if (!data || data.length === 0) {
      // Check if this is a successful DDL/DML command
      if (result?.isDDL || result?.isDML) {
        return (
          <Flex align="center" justify="center" height="100%" p="4">
            <Text color="green" size="2" weight="medium">
              ✓ {result.message}
            </Text>
          </Flex>
        )
      }
      return <Text color="gray">No data returned</Text>
    }

    // For NoSQL databases, use the MongoDB results view
    if (result?.isNoSQL) {
      console.log('formatResult: Using MongoResultsView for NoSQL data')
      console.log('formatResult: data passed to MongoResultsView:', data)
      console.log('formatResult: result passed to MongoResultsView:', result)
      return <MongoResultsView data={data} result={result} />
    }

    // For SQL databases, display as table
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
                      <Text size="1" color="gray">
                        null
                      </Text>
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
        {activeTab && activeTab.type === 'query' && (
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
                    <Button size="1" variant="soft" onClick={formatQuery}>
                      <CodeIcon />
                      Format
                    </Button>
                    <Button
                      size="1"
                      variant="solid"
                      onClick={handleExecuteQuery}
                      disabled={isExecuting || (!activeTab.query && !selectedText.trim())}
                    >
                      {isExecuting ? (
                        <>
                          <Box className="spinner" />
                          Running...
                        </>
                      ) : (
                        <>
                          <PlayIcon />
                          Run
                          <Text size="1" ml="1" style={{ opacity: 0.7 }}>
                            ⌘↵
                          </Text>
                        </>
                      )}
                    </Button>
                  </Flex>
                </Flex>

                <Box className="editor-container">
                  <SqlEditor
                    connectionId={connectionId}
                    value={activeTab.query}
                    onChange={(value) => {
                      handleUpdateTabContent(activeTab.id, {
                        query: value || '',
                        isDirty: true
                      })
                      // Reset limit override when query changes
                      setQueryLimitOverride(false)
                      setShowLimitWarning(false)
                    }}
                    onMount={handleEditorDidMount}
                    onSelectionChange={setSelectedText}
                    height="100%"
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
                          {activeResult.data.length === 1000 &&
                            !hasLimitClause(editorRef.current?.getValue() || '') &&
                            ' (limited)'}
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

                {/* Limit warning */}
                {showLimitWarning && activeResult?.success && (
                  <Box
                    p="2"
                    style={{
                      backgroundColor: 'var(--amber-3)',
                      borderBottom: '1px solid var(--amber-6)'
                    }}
                  >
                    <Flex align="center" justify="between">
                      <Flex align="center" gap="2">
                        <ExclamationTriangleIcon color="var(--amber-11)" />
                        <Text size="1" color="amber" weight="medium">
                          Query limited to {DEFAULT_LIMIT} rows for safety
                        </Text>
                        <Text size="1" color="gray">
                          Remove LIMIT to see all results
                        </Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => {
                            setShowLimitWarning(false)
                            setQueryLimitOverride(true)
                            handleExecuteQuery()
                          }}
                        >
                          Run without limit
                        </Button>
                        <Button size="1" variant="ghost" onClick={() => setShowLimitWarning(false)}>
                          Dismiss
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                )}

                <Box className="results-content" style={{ flex: 1 }}>
                  {activeResult ? (
                    activeResult.success ? (
                      <Box className="result-table-container">
                        {formatResult(activeResult.data || [], activeResult)}
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
        )}
        {activeTab && activeTab.type === 'table' && (
          <Box style={{ flex: 1, overflow: 'hidden' }}>
            {connectionType === 'mongodb' ? (
              <DocumentsView
                connectionId={connectionId}
                database={activeTab.database}
                collection={activeTab.tableName}
              />
            ) : (
              <TableView
                connectionId={connectionId}
                database={activeTab.database}
                tableName={activeTab.tableName}
                onFiltersChange={(filters) => handleUpdateTabContent(activeTab.id, { filters })}
              />
            )}
          </Box>
        )}
      </Flex>
    </Box>
  )
})

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box, Button, Flex, Text, Table } from '@radix-ui/themes'
import { Monaco } from '@monaco-editor/react'
import { Badge } from '../ui'
import { QueryTabs } from '../QueryTabs/QueryTabs'
import { TableView } from '../TableView/TableView'
import { AIAssistant } from '../AIAssistant'
import { SqlEditor } from './SqlEditor'

import { exportToCSV, exportToJSON } from '../../utils/exportData'
import { Tab, QueryTab, TableTab, QueryExecutionResult } from '../../types/tabs'
import './QueryWorkspace.css'

interface QueryWorkspaceProps {
  connectionId: string
  onOpenTableTab?: (database: string, tableName: string) => void
}

export function QueryWorkspace({ connectionId, onOpenTableTab }: QueryWorkspaceProps) {
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
  const [showAIPanel, setShowAIPanel] = useState(false)
  const editorRef = useRef<any>(null)
  const executeQueryRef = useRef<() => void>()

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

  const executeQuery = useCallback(
    async (queryToExecute: string) => {
      if (!activeTab || activeTab.type !== 'query') return

      if (!queryToExecute.trim()) return

      try {
        setIsExecuting(true)
        const startTime = Date.now()

        const queryResult = await window.api.database.query(connectionId, queryToExecute.trim())
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
    [activeTab, results, connectionId]
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

  // Update the ref whenever handleExecuteQuery changes
  useEffect(() => {
    executeQueryRef.current = handleExecuteQuery
  }, [handleExecuteQuery])

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
                    <Button
                      size="1"
                      variant={showAIPanel ? 'solid' : 'ghost'}
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      style={{ minWidth: '60px' }}
                    >
                      ✨ AI
                    </Button>
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
                        <>
                          Run
                          <Text size="1" color="gray" ml="1">
                            ⌘↵
                          </Text>
                        </>
                      )}
                    </Button>
                  </Flex>
                </Flex>

                <Box className="editor-container">
                  <PanelGroup direction="horizontal">
                    <Panel defaultSize={showAIPanel ? 70 : 100} minSize={50}>
                      <SqlEditor
                        connectionId={connectionId}
                        value={activeTab.query}
                        onChange={(value) =>
                          handleUpdateTabContent(activeTab.id, {
                            query: value || '',
                            isDirty: true
                          })
                        }
                        onMount={handleEditorDidMount}
                        onSelectionChange={setSelectedText}
                        height="100%"
                      />
                    </Panel>
                    {showAIPanel && (
                      <>
                        <PanelResizeHandle className="resize-handle-vertical" />
                        <Panel defaultSize={30} minSize={20} maxSize={50}>
                          <AIAssistant
                            context={{
                              connectionId: connectionId,
                              database: undefined
                            }}
                            onExecuteQuery={handleExecuteQueryFromAI}
                            onClose={() => setShowAIPanel(false)}
                          />
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
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
            <TableView
              connectionId={connectionId}
              database={activeTab.database}
              tableName={activeTab.tableName}
              onFiltersChange={(filters) => handleUpdateTabContent(activeTab.id, { filters })}
            />
          </Box>
        )}
      </Flex>
    </Box>
  )
}

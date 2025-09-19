import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  ContextMenu,
  Dialog,
  Flex,
  Select,
  Text,
  TextField,
  Badge
} from '@radix-ui/themes'
import Editor from '@monaco-editor/react'
import './TableView.css'

interface DocumentsViewProps {
  connectionId: string
  database: string
  collection: string
}

interface QueryResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
  executionTime?: number
}

export function DocumentsView({
  connectionId,
  database,
  collection
}: DocumentsViewProps) {
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [totalRows, setTotalRows] = useState(0)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [isJsonViewerOpen, setIsJsonViewerOpen] = useState(false)
  const [jsonViewerInitialValue, setJsonViewerInitialValue] = useState('')
  const jsonEditorRef = useRef<any>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const sessionId = `${Date.now()}`
      const res = await window.api.database.queryTable(
        connectionId,
        {
          database,
          table: collection,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize
        },
        sessionId
      )
      setResult(res)
      if (res.totalRows !== undefined) setTotalRows(res.totalRows)
    } catch (e: any) {
      setResult({ success: false, message: 'Failed to load documents', error: e?.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId, database, collection, currentPage, pageSize])

  const allData = useMemo(() => result?.data || [], [result])

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

  return (
    <Box
      className="table-view"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Flex justify="between" align="center" p="2" className="results-header">
        <Flex align="center" gap="3">
          <Text size="2" weight="medium">
            Documents
          </Text>
          {result?.success && result.data && (
            <>
              <Badge size="1" variant="soft">
                {totalRows > pageSize
                  ? `Page ${currentPage} (${result.data.length} docs)`
                  : `${result.data.length} docs`}
              </Badge>
              {result.executionTime && (
                <Badge size="1" variant="soft" color="gray">
                  {result.executionTime}ms
                </Badge>
              )}
            </>
          )}
        </Flex>
        <Flex gap="1" align="center">
          <Select.Root value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v))}>
            <Select.Trigger className="filter-select" />
            <Select.Content>
              {[25, 50, 100, 200, 500].map((s) => (
                <Select.Item key={s} value={String(s)}>
                  <Text size="1">{s} / page</Text>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Button size="1" variant="soft" onClick={() => load()} disabled={isLoading}>
            Refresh
          </Button>
        </Flex>
      </Flex>

      <Box style={{ flex: 1, overflow: 'auto' }} p="2">
        {isLoading ? (
          <Text color="gray">Loading...</Text>
        ) : result?.success ? (
          <Flex direction="column" gap="2">
            {allData.length === 0 && <Text color="gray">No documents</Text>}
            {allData.map((doc, index) => {
              const isSelected = selectedRows.has(index)
              const idValue = doc?._id ?? '(no _id)'
              const json = JSON.stringify(doc, null, 2)
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
                          _id: {String(idValue)}
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
                          padding: '6px'
                        }}
                      >
                        <Text size="1" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                          {json}
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
        ) : (
          <Text color="red">{result?.message || 'Failed to load documents'}</Text>
        )}
      </Box>

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
              onMount={(editor) => {
                jsonEditorRef.current = editor
              }}
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
    </Box>
  )
}

export default DocumentsView

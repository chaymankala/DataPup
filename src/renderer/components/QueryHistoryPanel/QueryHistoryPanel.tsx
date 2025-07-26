import React, { useState, useEffect } from 'react'
import { Box, Flex, Text, ScrollArea, TextField, Badge, Button } from '@radix-ui/themes'
import { ClockIcon, CopyIcon, PlayIcon, TrashIcon } from '@radix-ui/react-icons'
import './QueryHistoryPanel.css'

export interface QueryHistoryEntry {
  id: number
  connectionId: string
  connectionType: string
  connectionName: string
  query: string
  executionTime?: number
  rowCount?: number
  success: boolean
  errorMessage?: string
  createdAt: string
}

interface QueryHistoryPanelProps {
  connectionId: string
  onSelectQuery: (query: string) => void
  onRunQuery?: (query: string) => void
}

export function QueryHistoryPanel({ connectionId, onSelectQuery, onRunQuery }: QueryHistoryPanelProps) {
  const [history, setHistory] = useState<QueryHistoryEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    loadHistory()
  }, [connectionId])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const result = await window.api.queryHistory.get({
        connectionId,
        limit: 100
      })
      if (result.success) {
        setHistory(result.history)
      }
    } catch (error) {
      console.error('Failed to load query history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const result = await window.api.queryHistory.delete(id)
      if (result.success) {
        setHistory(history.filter(item => item.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete history entry:', error)
    }
  }

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all query history for this connection?')) {
      try {
        const result = await window.api.queryHistory.clear(connectionId)
        if (result.success) {
          setHistory([])
        }
      } catch (error) {
        console.error('Failed to clear history:', error)
      }
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return ''
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

    return date.toLocaleDateString()
  }

  const truncateQuery = (query: string, maxLength: number = 100) => {
    const singleLine = query.replace(/\s+/g, ' ').trim()
    if (singleLine.length <= maxLength) return singleLine
    return singleLine.substring(0, maxLength) + '...'
  }

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
  }

  const filteredHistory = history.filter((item) =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <Flex align="center" justify="center" height="100%" p="4">
        <Text size="2" color="gray">Loading history...</Text>
      </Flex>
    )
  }

  return (
    <Flex direction="column" className="query-history-panel" height="100%">
      <Box className="history-header" p="3">
        <Flex justify="between" align="center" mb="2">
          <Flex align="center" gap="2">
            <ClockIcon />
            <Text size="2" weight="bold">Query History</Text>
          </Flex>
          <Button
            size="1"
            variant="ghost"
            onClick={handleClear}
            disabled={history.length === 0}
          >
            Clear All
          </Button>
        </Flex>

        <TextField.Root
          placeholder="Search queries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="history-search"
        />
      </Box>

      <ScrollArea className="history-list">
        {filteredHistory.length === 0 ? (
          <Flex align="center" justify="center" p="4">
            <Text size="2" color="gray">
              {searchTerm ? 'No matching queries found' : 'No query history yet'}
            </Text>
          </Flex>
        ) : (
          <Box p="2">
            {filteredHistory.map((item) => (
              <Box
                key={item.id}
                className={`history-item ${selectedId === item.id ? 'selected' : ''} ${
                  !item.success ? 'error' : ''
                }`}
                onClick={() => {
                  setSelectedId(item.id)
                  onSelectQuery(item.query)
                }}
              >
                <Flex direction="column" gap="1">
                  <Flex justify="between" align="start">
                    <Text size="1" className="query-text">
                      {truncateQuery(item.query)}
                    </Text>
                    <Flex gap="1">
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={(e) => copyToClipboard(item.query, e)}
                        className="action-button"
                      >
                        <CopyIcon />
                      </Button>
                      {onRunQuery && (
                        <Button
                          size="1"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRunQuery(item.query)
                          }}
                          className="action-button"
                        >
                          <PlayIcon />
                        </Button>
                      )}
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="action-button"
                      >
                        <TrashIcon />
                      </Button>
                    </Flex>
                  </Flex>

                  <Flex gap="2" align="center">
                    <Badge size="1" color={item.success ? 'green' : 'red'} variant="soft">
                      {item.success ? 'Success' : 'Failed'}
                    </Badge>

                    {item.executionTime !== undefined && (
                      <Text size="1" color="gray">
                        {formatDuration(item.executionTime)}
                      </Text>
                    )}

                    {item.rowCount !== undefined && item.success && (
                      <Text size="1" color="gray">
                        {item.rowCount} rows
                      </Text>
                    )}

                    <Text size="1" color="gray" ml="auto">
                      {formatTimestamp(item.createdAt)}
                    </Text>
                  </Flex>

                  {item.errorMessage && (
                    <Text size="1" color="red" className="error-text">
                      {item.errorMessage}
                    </Text>
                  )}
                </Flex>
              </Box>
            ))}
          </Box>
        )}
      </ScrollArea>
    </Flex>
  )
}
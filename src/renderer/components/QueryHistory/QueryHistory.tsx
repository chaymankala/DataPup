import { useState } from 'react'
import { Box, Flex, Text, ScrollArea, TextField } from '@radix-ui/themes'
import { Button, Badge } from '../ui'
import { QueryHistoryItem } from '../../hooks/useQueryHistory'
import './QueryHistory.css'

interface QueryHistoryProps {
  history: QueryHistoryItem[]
  onSelectQuery: (query: string) => void
  onDeleteItem: (id: string) => void
  onClearHistory: () => void
}

export function QueryHistory({
  history,
  onSelectQuery,
  onDeleteItem,
  onClearHistory
}: QueryHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredHistory = history.filter((item) =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDuration = (ms?: number) => {
    if (!ms) return ''
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

    return date.toLocaleDateString()
  }

  const truncateQuery = (query: string, maxLength: number = 100) => {
    if (query.length <= maxLength) return query
    return query.substring(0, maxLength) + '...'
  }

  return (
    <Flex direction="column" className="query-history" height="100%">
      <Box className="history-header" p="3">
        <Flex justify="between" align="center" mb="2">
          <Text size="2" weight="bold">
            Query History
          </Text>
          <Button size="1" variant="ghost" onClick={onClearHistory} disabled={history.length === 0}>
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
                    <Button
                      size="1"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteItem(item.id)
                      }}
                      className="delete-button"
                    >
                      ×
                    </Button>
                  </Flex>

                  <Flex gap="2" align="center">
                    <Badge size="1" color={item.success ? 'green' : 'red'} variant="soft">
                      {item.success ? 'Success' : 'Failed'}
                    </Badge>

                    {item.duration && (
                      <Text size="1" color="gray">
                        {formatDuration(item.duration)}
                      </Text>
                    )}

                    {item.rowCount !== undefined && item.success && (
                      <Text size="1" color="gray">
                        {item.rowCount} rows
                      </Text>
                    )}

                    <Text size="1" color="gray" ml="auto">
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </Flex>

                  {item.error && (
                    <Text size="1" color="red" className="error-text">
                      {item.error}
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

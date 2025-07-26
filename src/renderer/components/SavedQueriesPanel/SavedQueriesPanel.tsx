import React, { useState, useEffect } from 'react'
import { Box, Flex, Text, ScrollArea, TextField, Button, Badge } from '@radix-ui/themes'
import { BookmarkIcon, CopyIcon, PlayIcon, TrashIcon, Pencil1Icon } from '@radix-ui/react-icons'
import './SavedQueriesPanel.css'

export interface SavedQuery {
  id: number
  name: string
  description?: string
  query: string
  connectionType?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface SavedQueriesPanelProps {
  connectionId: string
  onSelectQuery: (query: string, name?: string) => void
  onRunQuery?: (query: string) => void
}

export function SavedQueriesPanel({
  connectionId,
  onSelectQuery,
  onRunQuery
}: SavedQueriesPanelProps) {
  const [queries, setQueries] = useState<SavedQuery[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [connectionType, setConnectionType] = useState<string | undefined>()

  useEffect(() => {
    loadConnectionType()
    loadSavedQueries()
  }, [connectionId])

  const loadConnectionType = async () => {
    try {
      const result = await window.api.database.getConnectionInfo(connectionId)
      if (result.success && result.info) {
        setConnectionType(result.info.type)
      }
    } catch (error) {
      console.error('Failed to load connection type:', error)
    }
  }

  const loadSavedQueries = async () => {
    setIsLoading(true)
    try {
      const result = await window.api.savedQueries.get({
        connectionType,
        limit: 100
      })
      if (result.success) {
        setQueries(result.queries)
      }
    } catch (error) {
      console.error('Failed to load saved queries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this saved query?')) {
      try {
        const result = await window.api.savedQueries.delete(id)
        if (result.success) {
          setQueries(queries.filter((query) => query.id !== id))
        }
      } catch (error) {
        console.error('Failed to delete saved query:', error)
      }
    }
  }

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }

  const filteredQueries = queries.filter(
    (query) =>
      query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (query.description && query.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      query.query.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <Flex align="center" justify="center" height="100%" p="4">
        <Text size="2" color="gray">
          Loading saved queries...
        </Text>
      </Flex>
    )
  }

  return (
    <Flex direction="column" className="saved-queries-panel" height="100%">
      <Box className="queries-header">
        <Flex justify="between" align="center" mb="1">
          <Flex align="center" gap="2">
            <BookmarkIcon />
            <Text size="1" weight="bold">
              Saved Queries
            </Text>
          </Flex>
          <Button size="1" variant="ghost" onClick={loadSavedQueries}>
            Refresh
          </Button>
        </Flex>

        <TextField.Root
          size="1"
          placeholder="Search saved queries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="queries-search"
        />
      </Box>

      <ScrollArea className="queries-list">
        {filteredQueries.length === 0 ? (
          <Flex align="center" justify="center" p="4">
            <Text size="2" color="gray">
              {searchTerm ? 'No matching queries found' : 'No saved queries yet'}
            </Text>
          </Flex>
        ) : (
          <Box p="2">
            {filteredQueries.map((query) => (
              <Box
                key={query.id}
                className={`query-item ${selectedId === query.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedId(query.id)
                  onSelectQuery(query.query, query.name)
                }}
              >
                <Flex direction="column" gap="1">
                  <Flex justify="between" align="start">
                    <Box style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                      <Text size="1" weight="medium" className="query-name">
                        {query.name}
                      </Text>
                      {query.description && (
                        <Text size="1" color="gray" className="query-description">
                          {query.description}
                        </Text>
                      )}
                    </Box>
                    <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={(e) => copyToClipboard(query.query, e)}
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
                            onRunQuery(query.query)
                          }}
                          className="action-button"
                        >
                          <PlayIcon />
                        </Button>
                      )}
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={(e) => handleDelete(query.id, e)}
                        className="action-button"
                      >
                        <TrashIcon />
                      </Button>
                    </Flex>
                  </Flex>

                  <Text size="1" className="query-preview">
                    {query.query.substring(0, 100)}...
                  </Text>

                  <Flex gap="2" align="center">
                    {query.tags && query.tags.length > 0 && (
                      <>
                        {query.tags.map((tag, index) => (
                          <Badge key={index} size="1" variant="soft">
                            {tag}
                          </Badge>
                        ))}
                      </>
                    )}
                    <Text size="1" color="gray" ml="auto">
                      {formatDate(query.updatedAt)}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Box>
        )}
      </ScrollArea>
    </Flex>
  )
}

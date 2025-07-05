import { useState, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text } from '@radix-ui/themes'
import { Badge } from '../ui'
import './DatabaseExplorer.css'

interface DatabaseExplorerProps {
  connectionId: string
  connectionName: string
}

export function DatabaseExplorer({ connectionId, connectionName }: DatabaseExplorerProps) {
  const [databases, setDatabases] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDatabases()
  }, [connectionId])

  const loadDatabases = async () => {
    try {
      setLoading(true)
      const result = await window.api.database.getDatabases(connectionId)
      if (result.success && result.databases) {
        setDatabases(result.databases)
      }
    } catch (error) {
      console.error('Error loading databases:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="column" className="database-explorer">
      <Box className="explorer-header" p="3">
        <Text size="2" weight="bold">Database Explorer</Text>
        <Text size="1" color="gray" style={{ display: 'block', marginTop: 4 }}>
          {connectionName}
        </Text>
      </Box>

      <ScrollArea className="explorer-content">
        {loading ? (
          <Box p="3">
            <Text size="2" color="gray">Loading databases...</Text>
          </Box>
        ) : databases.length > 0 ? (
          <Box p="2">
            {databases.map((db) => (
              <Flex key={db} align="center" gap="2" className="database-item" p="2">
                <Text size="2">📁 {db}</Text>
                <Badge size="1" color="gray">database</Badge>
              </Flex>
            ))}
          </Box>
        ) : (
          <Box p="3">
            <Text size="2" color="gray">No databases found</Text>
          </Box>
        )}

        {/* Placeholder for future tree view implementation */}
        <Box p="3" mt="4">
          <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
            Tables, views, and functions will be displayed here in a tree view
          </Text>
        </Box>
      </ScrollArea>
    </Flex>
  )
}

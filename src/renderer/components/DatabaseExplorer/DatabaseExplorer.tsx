import { useState, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text } from '@radix-ui/themes'
import { Badge, Skeleton } from '../ui'
import './DatabaseExplorer.css'

interface DatabaseExplorerProps {
  connectionId: string
  connectionName: string
}

interface DatabaseObject {
  name: string
  type: 'table' | 'view' | 'function' | 'procedure' | 'trigger'
  schema?: string
  columns?: number
  rows?: number
}

interface Database {
  name: string
  expanded: boolean
  objects?: DatabaseObject[]
  loading?: boolean
}

const getObjectIcon = (type: DatabaseObject['type']) => {
  switch (type) {
    case 'table':
      return '📊'
    case 'view':
      return '👁️'
    case 'function':
      return '⚡'
    case 'procedure':
      return '📝'
    case 'trigger':
      return '🔔'
    default:
      return '📄'
  }
}

const getObjectColor = (type: DatabaseObject['type']) => {
  switch (type) {
    case 'table':
      return 'blue'
    case 'view':
      return 'green'
    case 'function':
      return 'orange'
    case 'procedure':
      return 'purple'
    case 'trigger':
      return 'red'
    default:
      return 'gray'
  }
}

export function DatabaseExplorer({ connectionId, connectionName }: DatabaseExplorerProps) {
  const [databases, setDatabases] = useState<Database[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadDatabases()
  }, [connectionId])

  const loadDatabases = async () => {
    try {
      setLoading(true)
      const result = await window.api.database.getDatabases(connectionId)
      if (result.success && result.databases) {
        setDatabases(
          result.databases.map((name: string) => ({
            name,
            expanded: false,
            objects: undefined
          }))
        )
      }
    } catch (error) {
      console.error('Error loading databases:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDatabase = async (dbName: string) => {
    const db = databases.find((d) => d.name === dbName)
    if (!db) return

    if (!db.expanded && !db.objects) {
      // Load database objects
      setDatabases((prev) => prev.map((d) => (d.name === dbName ? { ...d, loading: true } : d)))

      // Simulate loading database objects
      setTimeout(() => {
        const mockObjects: DatabaseObject[] = [
          { name: 'users', type: 'table', columns: 8, rows: 1250 },
          { name: 'products', type: 'table', columns: 12, rows: 450 },
          { name: 'orders', type: 'table', columns: 15, rows: 3200 },
          { name: 'active_users_view', type: 'view' },
          { name: 'calculate_total', type: 'function' },
          { name: 'update_inventory', type: 'procedure' },
          { name: 'audit_trigger', type: 'trigger' }
        ]

        setDatabases((prev) =>
          prev.map((d) =>
            d.name === dbName ? { ...d, expanded: true, objects: mockObjects, loading: false } : d
          )
        )
      }, 800)
    } else {
      setDatabases((prev) =>
        prev.map((d) => (d.name === dbName ? { ...d, expanded: !d.expanded } : d))
      )
    }
  }

  const filteredDatabases = databases.filter(
    (db) =>
      db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.objects?.some((obj) => obj.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Flex direction="column" className="database-explorer">
      <Box className="explorer-header" p="3">
        <input
          type="text"
          placeholder="Search objects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="explorer-search"
        />
      </Box>

      <ScrollArea className="explorer-content">
        {loading ? (
          <Flex direction="column" gap="2" p="3">
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
          </Flex>
        ) : filteredDatabases.length > 0 ? (
          <Box className="database-list">
            {filteredDatabases.map((db) => (
              <Box key={db.name} className="database-group">
                <Flex
                  align="center"
                  gap="2"
                  className={`database-item ${db.expanded ? 'expanded' : ''}`}
                  p="2"
                  onClick={() => toggleDatabase(db.name)}
                >
                  <Text size="1" className="expand-icon">
                    {db.expanded ? '▼' : '▶'}
                  </Text>
                  <Text size="2">🗄️ {db.name}</Text>
                  <Badge size="1" color="gray">
                    database
                  </Badge>
                </Flex>

                {db.loading && (
                  <Box p="3" pl="6">
                    <Flex direction="column" gap="2">
                      <Skeleton height={24} width="80%" />
                      <Skeleton height={24} width="70%" />
                      <Skeleton height={24} width="85%" />
                    </Flex>
                  </Box>
                )}

                {db.expanded && db.objects && (
                  <Box className="object-list" pl="4">
                    {db.objects.map((obj) => (
                      <Flex
                        key={`${db.name}.${obj.name}`}
                        align="center"
                        gap="2"
                        className="object-item"
                        p="2"
                      >
                        <Text size="2">{getObjectIcon(obj.type)}</Text>
                        <Text size="2" className="object-name">
                          {obj.name}
                        </Text>
                        <Badge size="1" color={getObjectColor(obj.type) as any}>
                          {obj.type}
                        </Badge>
                        {obj.columns && (
                          <Text size="1" color="gray" ml="auto">
                            {obj.columns} cols
                          </Text>
                        )}
                        {obj.rows && (
                          <Text size="1" color="gray">
                            {obj.rows.toLocaleString()} rows
                          </Text>
                        )}
                      </Flex>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Box p="3">
            <Text size="2" color="gray">
              {searchQuery ? 'No matching objects found' : 'No databases found'}
            </Text>
          </Box>
        )}
      </ScrollArea>
    </Flex>
  )
}

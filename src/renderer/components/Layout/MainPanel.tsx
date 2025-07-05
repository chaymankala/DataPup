import { Box, Flex, Text, Button, ScrollArea, Heading } from '@radix-ui/themes'
import { Card } from '../ui'
import { DatabaseConnection } from '../DatabaseConnection/DatabaseConnection'
import { QueryEditor } from '../QueryEditor/QueryEditor'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { useState } from 'react'
import './MainPanel.css'

interface MainPanelProps {
  activeConnection?: {
    id: string
    name: string
  }
  onConnectionSuccess?: (connection: any) => void
  savedConnections?: any[]
  onConnectionSelect?: (connection: any) => void
  onConnectionDelete?: (connectionId: string) => void
}

interface SavedConnection {
  id: string
  name: string
  type: string
  host: string
  port: number
  database: string
  username: string
  lastUsed?: string
  createdAt: string
}

export function MainPanel({ 
  activeConnection, 
  onConnectionSuccess,
  savedConnections = [],
  onConnectionSelect,
  onConnectionDelete
}: MainPanelProps) {
  const [showConnectionForm, setShowConnectionForm] = useState(false)

  // Sort connections by last used (most recent first)
  const sortedConnections = [...savedConnections].sort((a, b) => {
    const aDate = a.lastUsed ? new Date(a.lastUsed).getTime() : new Date(a.createdAt).getTime()
    const bDate = b.lastUsed ? new Date(b.lastUsed).getTime() : new Date(b.createdAt).getTime()
    return bDate - aDate
  })

  const handleNewConnection = () => {
    setShowConnectionForm(true)
  }

  const handleConnectionSuccess = (connection: any) => {
    setShowConnectionForm(false)
    if (onConnectionSuccess) {
      onConnectionSuccess(connection)
    }
  }

  const handleCancelConnection = () => {
    setShowConnectionForm(false)
  }

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getDatabaseIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clickhouse': return '🔍'
      case 'postgresql': return '🐘'
      case 'mysql': return '🐬'
      case 'sqlite': return '💾'
      default: return '🗄️'
    }
  }

  if (!activeConnection) {
    return (
      <Box className="main-panel">
        <Flex direction="column" height="100%">
          {/* Header */}
          <Flex justify="between" align="center" p="6">
            {/* Top Left - Title and Icon */}
            <Flex align="center" gap="3">
              <Text size="6">🐶</Text>
              <Heading size="6" weight="bold">
                Data-Pup
              </Heading>
            </Flex>

            {/* Top Right - Theme Switcher */}
            <ThemeSwitcher />
          </Flex>

          {/* Main Content */}
          <Flex direction="column" height="100%" justify="center" align="center" gap="8">
            {/* New Connection Section - Centered */}
            <Flex direction="column" gap="4" align="center">
              <Text size="4" weight="medium">
                New Connection
              </Text>
              
              {showConnectionForm ? (
                <Box style={{ maxWidth: '600px' }}>
                  <DatabaseConnection 
                    onConnectionSuccess={handleConnectionSuccess}
                    onCancel={handleCancelConnection}
                    inline={true}
                  />
                </Box>
              ) : (
                <Button size="4" onClick={handleNewConnection} style={{ width: 'fit-content' }}>
                  + New Connection
                </Button>
              )}
            </Flex>

            {/* Saved Connections */}
            <Flex direction="column" gap="4" style={{ width: '100%', maxWidth: '800px' }}>
              <Text size="4" weight="medium" style={{ textAlign: 'left', width: '100%' }}>
                Saved Connections
              </Text>
              
              {sortedConnections.length > 0 ? (
                <Flex gap="4" wrap="wrap" justify="center">
                  {sortedConnections.map((connection) => (
                    <Card 
                      key={connection.id} 
                      style={{ 
                        minWidth: '280px', 
                        maxWidth: '320px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      onClick={() => onConnectionSelect?.(connection)}
                    >
                      <Flex direction="column" gap="3">
                        <Flex justify="between" align="center">
                          <Flex align="center" gap="2">
                            <Text size="4">{getDatabaseIcon(connection.type)}</Text>
                            <Text size="3" weight="medium">
                              {connection.name}
                            </Text>
                          </Flex>
                          <Text size="1" color="gray" style={{ 
                            backgroundColor: 'var(--gray-3)', 
                            padding: '2px 6px', 
                            borderRadius: '4px' 
                          }}>
                            {connection.type}
                          </Text>
                        </Flex>
                        
                        <Flex direction="column" gap="1">
                          <Text size="2" color="gray">
                            {connection.host}:{connection.port}
                          </Text>
                          <Text size="2" color="gray">
                            Database: {connection.database}
                          </Text>
                          <Text size="2" color="gray">
                            User: {connection.username}
                          </Text>
                        </Flex>

                        <Flex justify="between" align="center">
                          <Text size="1" color="gray">
                            Last used {formatLastUsed(connection.lastUsed || connection.createdAt)}
                          </Text>
                          <Button 
                            size="1" 
                            variant="soft" 
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation()
                              onConnectionDelete?.(connection.id)
                            }}
                          >
                            Delete
                          </Button>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              ) : (
                <Flex direction="column" align="center" gap="3" py="8">
                  <Text size="6" color="gray">🗄️</Text>
                  <Text size="3" color="gray">No saved connections</Text>
                  <Text size="2" color="gray">Create your first connection to get started</Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Box>
    )
  }

  return (
    <Box className="main-panel">
      <QueryEditor 
        connectionId={activeConnection.id}
        connectionName={activeConnection.name}
      />
    </Box>
  )
}

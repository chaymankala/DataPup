import { Box, Flex, Text, Button, ScrollArea, Heading } from '@radix-ui/themes'
import { Card } from '../ui'
import { DatabaseConnection } from '../DatabaseConnection/DatabaseConnection'
import { QueryEditor } from '../QueryEditor/QueryEditor'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { ActiveConnectionLayout } from '../ActiveConnectionLayout'
import { ConnectionCard, ConnectionCardSkeleton } from '../ConnectionCard'
import { useState, useEffect } from 'react'
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
  onDisconnect?: () => void
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
  onConnectionDelete,
  onDisconnect
}: MainPanelProps) {
  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)

  // Simulate loading state for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingConnections(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

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

  const handleConnectionSelect = (connection: any) => {
    console.log('Connection:', connection)

    // Trigger database connection for the selected saved connection
    if (onConnectionSelect) {
      onConnectionSelect(connection)
    }
  }

  const handleConnectionDelete = (connectionId: string) => {
    if (onConnectionDelete) {
      onConnectionDelete(connectionId)
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

              {isLoadingConnections ? (
                <Flex gap="4" wrap="wrap" justify="center">
                  {[1, 2, 3].map((i) => (
                    <ConnectionCardSkeleton key={i} />
                  ))}
                </Flex>
              ) : sortedConnections.length > 0 ? (
                <Flex gap="4" wrap="wrap" justify="center">
                  {sortedConnections.map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      onSelect={handleConnectionSelect}
                      onDelete={handleConnectionDelete}
                    />
                  ))}
                </Flex>
              ) : (
                <Flex direction="column" align="center" gap="3" py="8">
                  <Text size="6" color="gray">
                    🗄️
                  </Text>
                  <Text size="3" color="gray">
                    No saved connections
                  </Text>
                  <Text size="2" color="gray">
                    Create your first connection to get started
                  </Text>
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
      <ActiveConnectionLayout
        connectionId={activeConnection.id}
        connectionName={activeConnection.name}
        onDisconnect={onDisconnect}
      />
    </Box>
  )
}

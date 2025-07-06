import { Box, Flex, Text, Button, ScrollArea, Heading } from '@radix-ui/themes'
import { Card, Logo } from '../ui'
import { DatabaseConnection } from '../DatabaseConnection/DatabaseConnection'
import { QueryEditor } from '../QueryEditor/QueryEditor'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { ActiveConnectionLayout } from '../ActiveConnectionLayout'
import { ConnectionCard, ConnectionCardSkeleton } from '../ConnectionCard'
import { useState, useEffect } from 'react'
import './MainPanel.css'
import { v4 as uuidv4 } from 'uuid'

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
          <Flex justify="between" align="center" p="4">
            <Flex align="center" gap="2">
              <Logo size={32} />
              <Heading size="5" weight="bold">
                DataPup
              </Heading>
            </Flex>
            <ThemeSwitcher />
          </Flex>

          {/* Main Content */}
          <Box flex="1" p="6">
            {showConnectionForm ? (
              <Flex justify="center">
                <Box style={{ maxWidth: '600px', width: '100%' }}>
                  <DatabaseConnection
                    onConnectionSuccess={handleConnectionSuccess}
                    onCancel={handleCancelConnection}
                    inline={true}
                  />
                </Box>
              </Flex>
            ) : sortedConnections.length > 0 || isLoadingConnections ? (
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center" mb="2">
                  <Text size="3" weight="medium">
                    Connections
                  </Text>
                  <Button size="2" onClick={handleNewConnection}>
                    + New Connection
                  </Button>
                </Flex>

                {isLoadingConnections ? (
                  <Flex gap="4" wrap="wrap">
                    {[1, 2, 3].map((i) => (
                      <ConnectionCardSkeleton key={i} />
                    ))}
                  </Flex>
                ) : (
                  <Flex gap="4" wrap="wrap">
                    {sortedConnections.map((connection) => (
                      <ConnectionCard
                        key={connection.id}
                        connection={connection}
                        onSelect={handleConnectionSelect}
                        onDelete={handleConnectionDelete}
                      />
                    ))}
                  </Flex>
                )}
              </Flex>
            ) : (
              <Flex direction="column" align="center" justify="center" height="100%" gap="4">
                <Text size="6" color="gray">
                  🗄️
                </Text>
                <Text size="3" color="gray">
                  No connections yet
                </Text>
                <Button size="3" onClick={handleNewConnection}>
                  Create your first connection
                </Button>
              </Flex>
            )}
          </Box>
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

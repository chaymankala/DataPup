import { useState } from 'react'
import { Container, Flex, Box } from '@radix-ui/themes'
import { Sidebar } from './components/Layout/Sidebar'
import { MainPanel } from './components/Layout/MainPanel'
import { ActiveConnectionLayout } from './components/ActiveConnectionLayout'
import './App.css'

interface Connection {
  id: string
  name: string
  type: string
  host: string
  port: number
  database: string
  username: string
  createdAt: string
  lastUsed?: string
}

function App() {
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null)

  const handleConnectionSelect = (connection: Connection) => {
    setActiveConnection(connection)
  }

  const handleConnectionDelete = (connectionId: string) => {
    if (activeConnection?.id === connectionId) {
      setActiveConnection(null)
    }
  }

  const handleDisconnect = async () => {
    if (activeConnection) {
      try {
        // Call the disconnect API
        await window.api.database.disconnect(activeConnection.id)
        setActiveConnection(null)
      } catch (error) {
        console.error('Error disconnecting:', error)
      }
    }
  }

  // If there's an active connection, show only the ActiveConnectionLayout
  if (activeConnection) {
    return (
      <Box className="app-container">
        <ActiveConnectionLayout 
          connectionId={activeConnection.id}
          connectionName={activeConnection.name}
          onDisconnect={handleDisconnect}
        />
      </Box>
    )
  }

  // Otherwise, show the sidebar and empty state
  return (
    <Container size="4" className="app-container">
      <Flex className="app-layout">
        <Sidebar 
          onConnectionSelect={handleConnectionSelect}
          onConnectionDelete={handleConnectionDelete}
        />
        <MainPanel activeConnection={undefined} />
      </Flex>
    </Container>
  )
}

export default App

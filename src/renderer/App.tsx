import { useState } from 'react'
import { Box } from '@radix-ui/themes'
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
  const [savedConnections, setSavedConnections] = useState<Connection[]>([])

  const handleConnectionSelect = (connection: Connection) => {
    setActiveConnection(connection)
  }

  const handleConnectionDelete = (connectionId: string) => {
    if (activeConnection?.id === connectionId) {
      setActiveConnection(null)
    }
    setSavedConnections(prev => prev.filter(conn => conn.id !== connectionId))
  }

  const handleConnectionSuccess = (connection: Connection) => {
    // Add to saved connections if not already present
    setSavedConnections(prev => {
      const exists = prev.find(conn => conn.id === connection.id)
      if (!exists) {
        return [...prev, connection]
      }
      return prev
    })
    setActiveConnection(connection)
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

  // Otherwise, show the connection selection view
  return (
    <div className="app-container">
      <MainPanel 
        activeConnection={activeConnection ? { id: activeConnection.id, name: activeConnection.name } : undefined}
        onConnectionSuccess={handleConnectionSuccess}
        savedConnections={savedConnections}
        onConnectionSelect={handleConnectionSelect}
        onConnectionDelete={handleConnectionDelete}
      />
    </div>
  )
}

export default App

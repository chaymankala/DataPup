import { useState } from 'react'
import { Container, Flex } from '@radix-ui/themes'
import { Sidebar } from './components/Layout/Sidebar'
import { MainPanel } from './components/Layout/MainPanel'
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

  return (
    <Container size="4" className="app-container">
      <Flex className="app-layout">
        <Sidebar 
          onConnectionSelect={handleConnectionSelect}
          onConnectionDelete={handleConnectionDelete}
        />
        <MainPanel activeConnection={activeConnection ? { id: activeConnection.id, name: activeConnection.name } : undefined} />
      </Flex>
    </Container>
  )
}

export default App
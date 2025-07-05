import { useState, useEffect } from 'react'
import { Button, Dialog, Flex, Select, Text, TextField, Checkbox } from '@radix-ui/themes'
import './DatabaseConnection.css'

interface DatabaseConnectionProps {
  onConnectionSuccess?: (connection: any) => void
}

export function DatabaseConnection({ onConnectionSuccess }: DatabaseConnectionProps) {
  const [open, setOpen] = useState(false)
  const [dbType, setDbType] = useState('clickhouse')
  const [saveConnection, setSaveConnection] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [supportedTypes] = useState<string[]>(['clickhouse'])
  const [connectionData, setConnectionData] = useState({
    host: 'localhost',
    port: '8123',
    database: 'default',
    username: 'default',
    password: ''
  })

  // Load supported database types on component mount
  useEffect(() => {
    const loadSupportedTypes = async () => {
      try {
        // TODO: Uncomment when getSupportedTypes is properly typed
        // const result = await window.api.database.getSupportedTypes()
        // if (result.success) {
        //   setSupportedTypes(result.types)
        // }
      } catch (error) {
        console.error('Error loading supported database types:', error)
      }
    }
    loadSupportedTypes()
  }, [])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      const result = await window.api.database.connect({
        type: dbType,
        ...connectionData,
        port: parseInt(connectionData.port),
        saveConnection
      })
      
      if (result.success) {
        console.log('Connected:', result.message)
        setOpen(false)
        // Reset form
        setConnectionData({
          host: 'localhost',
          port: '8123',
          database: 'default',
          username: 'default',
          password: ''
        })
        // Notify parent component
        if (onConnectionSuccess && result.connectionId) {
          // Create a connection object for the parent component
          const connection = {
            id: result.connectionId,
            name: `${dbType} - ${connectionData.host}:${connectionData.port}`,
            type: dbType,
            host: connectionData.host,
            port: parseInt(connectionData.port),
            database: connectionData.database,
            username: connectionData.username,
            createdAt: new Date().toISOString()
          }
          onConnectionSuccess(connection)
        }
      } else {
        console.error('Connection failed:', result.message)
        alert(`Connection failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Connection error:', error)
      alert('Connection error occurred')
    } finally {
      setIsConnecting(false)
    }
  }

  const getDefaultPort = (type: string) => {
    switch (type) {
      case 'clickhouse': return '8123'
      case 'postgresql': return '5432'
      case 'mysql': return '3306'
      case 'sqlite': return ''
      default: return '5432'
    }
  }

  const handleDbTypeChange = (type: string) => {
    setDbType(type)
    setConnectionData(prev => ({
      ...prev,
      port: getDefaultPort(type)
    }))
  }

  return (
    <>
      <Button size="3" onClick={() => setOpen(true)}>
        Connect to Database
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Connect to Database</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Enter your database connection details
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Database Type
              </Text>
              <Select.Root value={dbType} onValueChange={handleDbTypeChange}>
                <Select.Trigger className="full-width" />
                <Select.Content>
                  {supportedTypes.map(type => (
                    <Select.Item key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Host
              </Text>
              <TextField.Root
                value={connectionData.host}
                onChange={(e) => setConnectionData({...connectionData, host: e.target.value})}
                placeholder="localhost"
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Port
              </Text>
              <TextField.Root
                value={connectionData.port}
                onChange={(e) => setConnectionData({...connectionData, port: e.target.value})}
                placeholder={getDefaultPort(dbType)}
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Database
              </Text>
              <TextField.Root
                value={connectionData.database}
                onChange={(e) => setConnectionData({...connectionData, database: e.target.value})}
                placeholder="default"
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Username
              </Text>
              <TextField.Root
                value={connectionData.username}
                onChange={(e) => setConnectionData({...connectionData, username: e.target.value})}
                placeholder="default"
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Password
              </Text>
              <TextField.Root
                type="password"
                value={connectionData.password}
                onChange={(e) => setConnectionData({...connectionData, password: e.target.value})}
                placeholder="password"
              />
            </label>

            <label>
              <Flex gap="2" align="center">
                <Checkbox 
                  checked={saveConnection} 
                  onCheckedChange={(checked) => setSaveConnection(checked as boolean)}
                />
                <Text size="2">Save connection for future use</Text>
              </Flex>
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isConnecting}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}
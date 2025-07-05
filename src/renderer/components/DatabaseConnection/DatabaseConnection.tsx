import { useState } from 'react'
import { Dialog, Flex, Select } from '@radix-ui/themes'
import { Button, Input, Label } from '../ui'
import './DatabaseConnection.css'

export function DatabaseConnection() {
  const [open, setOpen] = useState(false)
  const [dbType, setDbType] = useState('postgresql')
  const [connectionData, setConnectionData] = useState({
    host: 'localhost',
    port: '5432',
    database: '',
    username: '',
    password: ''
  })

  const handleConnect = async () => {
    try {
      const result = await window.api.database.connect({
        type: dbType,
        ...connectionData,
        port: parseInt(connectionData.port)
      })
      
      if (result.success) {
        console.log('Connected:', result.message)
        setOpen(false)
      }
    } catch (error) {
      console.error('Connection error:', error)
    }
  }

  return (
    <>
      <Button size="1" onClick={() => setOpen(true)}>
        Connect to Database
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Connect to Database</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Enter your database connection details
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Label htmlFor="db-type">Database Type</Label>
              <Select.Root value={dbType} onValueChange={setDbType}>
                <Select.Trigger id="db-type" className="full-width" />
                <Select.Content>
                  <Select.Item value="postgresql">PostgreSQL</Select.Item>
                  <Select.Item value="mysql">MySQL</Select.Item>
                  <Select.Item value="sqlite">SQLite</Select.Item>
                  <Select.Item value="clickhouse">ClickHouse</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>

            <Input
              label="Host"
              value={connectionData.host}
              onChange={(e) => setConnectionData({...connectionData, host: e.target.value})}
              placeholder="localhost"
            />

            <Input
              label="Port"
              value={connectionData.port}
              onChange={(e) => setConnectionData({...connectionData, port: e.target.value})}
              placeholder="5432"
            />

            <Input
              label="Database"
              value={connectionData.database}
              onChange={(e) => setConnectionData({...connectionData, database: e.target.value})}
              placeholder="my_database"
            />

            <Input
              label="Username"
              value={connectionData.username}
              onChange={(e) => setConnectionData({...connectionData, username: e.target.value})}
              placeholder="username"
            />

            <Input
              label="Password"
              type="password"
              value={connectionData.password}
              onChange={(e) => setConnectionData({...connectionData, password: e.target.value})}
              placeholder="password"
            />
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleConnect}>
              Connect
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}
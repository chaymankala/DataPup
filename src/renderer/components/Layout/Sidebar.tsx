import { Box, Flex, Heading, ScrollArea, Separator, Text } from '@radix-ui/themes'
import { DatabaseConnection } from '../DatabaseConnection/DatabaseConnection'
import { ConnectionList } from '../ConnectionList/ConnectionList'
import './Sidebar.css'

interface SidebarProps {
  onConnectionSelect?: (connection: any) => void
  onConnectionDelete?: (connectionId: string) => void
}

export function Sidebar({ onConnectionSelect, onConnectionDelete }: SidebarProps) {
  return (
    <Box className="sidebar">
      <Flex direction="column" gap="4" p="4" height="100%">
        <Heading size="4" weight="bold">
          🐶 Data-Pup
        </Heading>
        
        <DatabaseConnection onConnectionSuccess={onConnectionSelect} />
        
        <Separator size="4" />
        
        <Box style={{ flex: 1, minHeight: 0 }}>
          <Text size="2" weight="medium" color="gray" mb="2">
            Saved Connections
          </Text>
          <ScrollArea className="connections-list">
            <ConnectionList 
              onConnectionSelect={onConnectionSelect}
              onConnectionDelete={onConnectionDelete}
            />
          </ScrollArea>
        </Box>
        
        <Separator size="4" />
        
        <Box>
          <Text size="2" weight="medium" color="gray">
            Saved Queries
          </Text>
          <ScrollArea className="queries-list">
            <Text size="1" color="gray">
              No saved queries
            </Text>
          </ScrollArea>
        </Box>
      </Flex>
    </Box>
  )
}
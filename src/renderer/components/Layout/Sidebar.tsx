import { Box, Flex, Heading, ScrollArea, Text } from '@radix-ui/themes'
import { DatabaseConnection } from '../DatabaseConnection/DatabaseConnection'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { Separator } from '../ui'
import './Sidebar.css'

export function Sidebar() {
  return (
    <Box className="sidebar">
      <Flex direction="column" gap="4" p="4">
        <Flex justify="between" align="center">
          <Heading size="4" weight="bold">
            🐶 Data-Pup
          </Heading>
          <ThemeSwitcher />
        </Flex>
        
        <DatabaseConnection />
        
        <Separator size="4" />
        
        <Box>
          <Text size="2" weight="medium" color="gray">
            Connections
          </Text>
          <ScrollArea className="connections-list">
            <Text size="1" color="gray">
              No connections yet
            </Text>
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

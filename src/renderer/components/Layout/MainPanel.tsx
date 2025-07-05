import { Box, Flex, Text } from '@radix-ui/themes'
import { ActiveConnectionLayout } from '../ActiveConnectionLayout'
import './MainPanel.css'

interface MainPanelProps {
  activeConnection?: {
    id: string
    name: string
  }
}

export function MainPanel({ activeConnection }: MainPanelProps) {
  if (!activeConnection) {
    return (
      <Box className="main-panel">
        <Flex align="center" justify="center" height="100%">
          <Text size="5" color="gray">
            Connect to a database to get started
          </Text>
        </Flex>
      </Box>
    )
  }

  return (
    <Box className="main-panel">
      <ActiveConnectionLayout 
        connectionId={activeConnection.id}
        connectionName={activeConnection.name}
      />
    </Box>
  )
}

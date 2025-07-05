import { Box, Flex, Text } from '@radix-ui/themes'
import './MainPanel.css'

export function MainPanel() {
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

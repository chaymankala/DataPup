import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box, Flex, Text } from '@radix-ui/themes'
import { Button } from '../ui'
import { DatabaseExplorer } from '../DatabaseExplorer/DatabaseExplorer'
import { QueryWorkspace } from '../QueryWorkspace/QueryWorkspace'
import './ActiveConnectionLayout.css'

interface ActiveConnectionLayoutProps {
  connectionId: string
  connectionName: string
  onDisconnect?: () => void
}

export function ActiveConnectionLayout({
  connectionId,
  connectionName,
  onDisconnect
}: ActiveConnectionLayoutProps) {
  return (
    <Box className="active-connection-layout">
      {/* Header bar */}
      <Flex className="connection-header" justify="between" align="center" p="2">
        <Flex align="center" gap="2">
          <Text size="2" weight="bold">
            Connected to:
          </Text>
          <Text size="2">{connectionName}</Text>
        </Flex>
        <Button size="1" variant="soft" color="red" onClick={onDisconnect}>
          Disconnect
        </Button>
      </Flex>

      <PanelGroup direction="horizontal" className="panel-group">
        {/* Left sidebar with database explorer */}
        <Panel defaultSize={20} minSize={15} maxSize={40} className="explorer-panel">
          <DatabaseExplorer connectionId={connectionId} connectionName={connectionName} />
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        {/* Right side with query workspace */}
        <Panel defaultSize={80} className="workspace-panel">
          <QueryWorkspace connectionId={connectionId} connectionName={connectionName} />
        </Panel>
      </PanelGroup>
    </Box>
  )
}

import { useState } from 'react'
import { Box, Flex } from '@radix-ui/themes'
import { Button } from '../ui'
import { DatabaseExplorer } from '../DatabaseExplorer/DatabaseExplorer'
import { AIAssistant } from '../AIAssistant'
import { QueryHistoryPanel } from '../QueryHistoryPanel'
import { SavedQueriesPanel } from '../SavedQueriesPanel'
import {
  TableIcon as DatabaseIcon,
  MagicWandIcon,
  ClockIcon,
  BookmarkIcon
} from '@radix-ui/react-icons'
import './LeftSidebar.css'

type ViewType = 'explorer' | 'ai' | 'history' | 'saved'

interface LeftSidebarProps {
  connectionId: string
  connectionName: string
  onTableDoubleClick?: (database: string, tableName: string) => void
  onSelectQuery?: (query: string, name?: string) => void
  onRunQuery?: (query: string) => void
  onExecuteQueryFromAI?: (query: string) => void
}

export function LeftSidebar({
  connectionId,
  connectionName,
  onTableDoubleClick,
  onSelectQuery,
  onRunQuery,
  onExecuteQueryFromAI
}: LeftSidebarProps) {
  const [activeView, setActiveView] = useState<ViewType>('explorer')

  const iconButtons = [
    { view: 'explorer' as ViewType, icon: DatabaseIcon, tooltip: 'Database Explorer' },
    { view: 'ai' as ViewType, icon: MagicWandIcon, tooltip: 'AI Assistant' },
    { view: 'history' as ViewType, icon: ClockIcon, tooltip: 'Query History' },
    { view: 'saved' as ViewType, icon: BookmarkIcon, tooltip: 'Saved Queries' }
  ]

  return (
    <Flex direction="column" className="left-sidebar" height="100%">
      {/* Icon bar */}
      <Box className="sidebar-icon-bar">
        <Flex direction="row" align="center" gap="1" p="2">
          {iconButtons.map(({ view, icon: Icon, tooltip }) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className="sidebar-icon-button"
              title={tooltip}
              data-state={activeView === view ? 'on' : 'off'}
            >
              <Icon />
            </button>
          ))}
        </Flex>
      </Box>

      {/* Content area */}
      <Box className="sidebar-content" style={{ flex: 1, overflow: 'hidden' }}>
        {activeView === 'explorer' && (
          <DatabaseExplorer
            connectionId={connectionId}
            connectionName={connectionName}
            onTableDoubleClick={onTableDoubleClick}
          />
        )}
        {activeView === 'ai' && (
          <AIAssistant context={{ connectionId }} onExecuteQuery={onExecuteQueryFromAI} />
        )}
        {activeView === 'history' && (
          <QueryHistoryPanel
            connectionId={connectionId}
            onSelectQuery={(query) => onSelectQuery?.(query)}
            onRunQuery={onRunQuery}
          />
        )}
        {activeView === 'saved' && (
          <SavedQueriesPanel
            connectionId={connectionId}
            onSelectQuery={onSelectQuery}
            onRunQuery={onRunQuery}
          />
        )}
      </Box>
    </Flex>
  )
}

import { useState } from 'react'
import { Box, Flex, Text, IconButton, DropdownMenu } from '@radix-ui/themes'
import { Button } from '../ui'
import { Tab } from '../../types/tabs'
import './QueryTabs.css'

interface QueryTabsProps {
  tabs: Tab[]
  activeTabId: string
  onSelectTab: (tabId: string) => void
  onNewTab: () => void
  onNewNaturalLanguageTab?: () => void
  onCloseTab: (tabId: string) => void
  onUpdateTabTitle: (tabId: string, title: string) => void
}

export function QueryTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onNewNaturalLanguageTab,
  onCloseTab,
  onUpdateTabTitle
}: QueryTabsProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleStartEdit = (tab: Tab) => {
    setEditingTabId(tab.id)
    setEditingTitle(tab.title)
  }

  const handleFinishEdit = () => {
    if (editingTabId && editingTitle.trim()) {
      onUpdateTabTitle(editingTabId, editingTitle.trim())
    }
    setEditingTabId(null)
    setEditingTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit()
    } else if (e.key === 'Escape') {
      setEditingTabId(null)
      setEditingTitle('')
    }
  }

  return (
    <Flex className="query-tabs" align="center">
      <Box className="tabs-container">
        <Flex gap="1" align="center">
          {tabs.map((tab) => (
            <Box
              key={tab.id}
              className={`query-tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <Flex align="center" gap="1" style={{ width: '100%' }}>
                {editingTabId === tab.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleFinishEdit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="tab-title-input"
                    autoFocus
                  />
                ) : (
                  <>
                    <Text size="1" style={{ flexShrink: 0 }}>
                      {tab.type === 'table' ? '◆' : '▹'}
                    </Text>
                    <Text size="1" className="tab-title" onDoubleClick={() => handleStartEdit(tab)}>
                      {tab.title}
                      {tab.isDirty && <span className="dirty-indicator">•</span>}
                    </Text>
                  </>
                )}

                {tabs.length > 1 && (
                  <button
                    className="tab-close-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseTab(tab.id)
                    }}
                  >
                    ×
                  </button>
                )}
              </Flex>
            </Box>
          ))}
        </Flex>
      </Box>

      {onNewNaturalLanguageTab ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button size="1" variant="ghost" className="new-tab-button">
              +
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onClick={onNewTab}>
              SQL Query
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={onNewNaturalLanguageTab}>
              Natural Language Query
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ) : (
        <Button size="1" variant="ghost" onClick={onNewTab} className="new-tab-button">
          +
        </Button>
      )}
    </Flex>
  )
}

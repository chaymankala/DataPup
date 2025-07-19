import { useState, useRef, useEffect } from 'react'
import { Box, Flex, Text, Button, ScrollArea, TextArea, Card, Select } from '@radix-ui/themes'
import { MessageRenderer } from './MessageRenderer'
import './AIAssistant.css'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: Date
  sqlQuery?: string
  toolCall?: {
    name: string
    status: 'running' | 'completed' | 'failed'
  }
}

interface AIContext {
  connectionId?: string
  database?: string
}

interface AIAssistantProps {
  context: AIContext
  onExecuteQuery?: (query: string) => void
  onClose?: () => void
}

export function AIAssistant({ context, onExecuteQuery, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<'openai' | 'claude' | 'gemini'>(() => {
    const saved = localStorage.getItem('datapup-ai-provider')
    if (saved && ['openai', 'claude', 'gemini'].includes(saved)) {
      return saved as 'openai' | 'claude' | 'gemini'
    }
    return 'openai'
  })
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Check for API key on mount and when provider changes
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const result = await window.api.secureStorage.get(`ai-api-key-${provider}`)
        if (result.success && result.value) {
          setApiKey(result.value)
          setShowApiKeySetup(false)
        } else {
          setShowApiKeySetup(true)
        }
      } catch (error) {
        console.error('[AIAssistant] Error checking API key:', error)
        setShowApiKeySetup(true)
      }
    }
    checkApiKey()
  }, [provider])

  // Listen for tool call events from backend
  useEffect(() => {
    const handleToolCall = (event: any, data: any) => {
      const toolMessage: Message = {
        id: `tool-${Date.now()}-${Math.random()}`,
        role: 'tool',
        content: '',
        timestamp: new Date(),
        toolCall: {
          name: data.name,
          status: data.status
        }
      }

      setMessages((prev) => {
        // Update existing tool message or add new one
        const existingIndex = prev.findIndex(
          (msg) =>
            msg.role === 'tool' &&
            msg.toolCall?.name === data.name &&
            msg.toolCall?.status === 'running'
        )

        if (existingIndex >= 0 && data.status === 'completed') {
          // Update existing message
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            toolCall: { ...updated[existingIndex].toolCall!, status: 'completed' }
          }
          return updated
        } else {
          // Add new message
          return [...prev, toolMessage]
        }
      })
    }

    // Subscribe to tool call events
    const removeListener = window.api.on('ai:toolCall', handleToolCall)

    return () => {
      removeListener()
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userInput = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      // Use single AI process method
      const result = await window.api.ai.process({
        query: userInput,
        connectionId: context.connectionId || '',
        database: context.database || undefined,
        provider: provider
      })

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.message || result.explanation || 'No response generated.',
          timestamp: new Date(),
          sqlQuery: result.sqlQuery
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${result.error || 'Unknown error occurred'}`,
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleApiKeySubmit = async (key: string) => {
    try {
      const result = await window.api.secureStorage.set(`ai-api-key-${provider}`, key)
      if (result.success) {
        setApiKey(key)
        setShowApiKeySetup(false)
        setApiKeyInput('')
      }
    } catch (error) {
      console.error('[AIAssistant] Error saving API key:', error)
    }
  }

  const handleProviderChange = (newProvider: string) => {
    if (['openai', 'claude', 'gemini'].includes(newProvider)) {
      setProvider(newProvider as 'openai' | 'claude' | 'gemini')
      localStorage.setItem('datapup-ai-provider', newProvider)
    }
  }

  const renderToolCall = (toolCall: {
    name: string
    status: 'running' | 'completed' | 'failed'
  }) => {
    const statusStyles = {
      running: { color: 'blue', label: 'Running', icon: '⚡' },
      completed: { color: 'green', label: 'Completed', icon: '✓' },
      failed: { color: 'red', label: 'Failed', icon: '✗' }
    }

    const status = statusStyles[toolCall.status]

    return (
      <Card size="1" style={{ padding: '8px 12px', marginBottom: '4px' }}>
        <Flex align="center" gap="2">
          <Text size="1" color={status.color as any}>
            {status.icon}
          </Text>
          <Text size="1">{toolCall.name}</Text>
          <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>
            {status.label}
          </Text>
        </Flex>
      </Card>
    )
  }

  if (showApiKeySetup) {
    return (
      <Box className="ai-assistant">
        <Flex className="ai-header" justify="between" align="center" p="3">
          <Text size="2" weight="medium">
            AI Assistant Setup
          </Text>
          {onClose && (
            <Button size="1" variant="ghost" onClick={onClose}>
              ×
            </Button>
          )}
        </Flex>
        <Box className="ai-setup" p="3">
          <Card size="1">
            <Flex direction="column" gap="3">
              <Box>
                <Text size="2" weight="medium" mb="2">
                  Choose AI Provider
                </Text>
                <Select.Root value={provider} onValueChange={handleProviderChange}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="openai">OpenAI</Select.Item>
                    <Select.Item value="claude">Claude</Select.Item>
                    <Select.Item value="gemini">Gemini</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box>
                <Text size="2" weight="medium" mb="2">
                  API Key
                </Text>
                <TextArea
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Enter your ${provider} API key...`}
                  size="2"
                  style={{ fontFamily: 'monospace', minHeight: '60px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (apiKeyInput.trim()) handleApiKeySubmit(apiKeyInput.trim())
                    }
                  }}
                />
              </Box>

              <Button
                size="2"
                onClick={() => {
                  if (apiKeyInput.trim()) handleApiKeySubmit(apiKeyInput.trim())
                }}
                disabled={!apiKeyInput.trim()}
              >
                Save API Key
              </Button>
            </Flex>
          </Card>
        </Box>
      </Box>
    )
  }

  return (
    <Box className="ai-assistant">
      <Flex className="ai-header" justify="between" align="center" p="3">
        <Text size="2" weight="medium">
          AI Assistant
        </Text>
        <Flex align="center" gap="2">
          <Select.Root value={provider} onValueChange={handleProviderChange}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="openai">OpenAI</Select.Item>
              <Select.Item value="claude">Claude</Select.Item>
              <Select.Item value="gemini">Gemini</Select.Item>
            </Select.Content>
          </Select.Root>
          {onClose && (
            <Button size="1" variant="ghost" onClick={onClose}>
              ×
            </Button>
          )}
        </Flex>
      </Flex>

      <ScrollArea className="ai-messages" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <Flex className="ai-empty" align="center" justify="center" p="4">
            <Text size="2" color="gray">
              Ask me about your data or for help writing SQL queries
            </Text>
          </Flex>
        ) : (
          <Box p="3">
            {messages.map((message) => (
              <Box key={message.id} mb="3">
                {message.role === 'tool' && message.toolCall ? (
                  renderToolCall(message.toolCall)
                ) : (
                  <Box className={`ai-message ai-message-${message.role}`}>
                    <Text size="1" color="gray" weight="medium" mb="1">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </Text>
                    <Card size="1" className="ai-message-content">
                      <MessageRenderer
                        content={message.content}
                        sqlQuery={message.sqlQuery}
                        onRunQuery={onExecuteQuery}
                      />
                    </Card>
                  </Box>
                )}
              </Box>
            ))}
            {isLoading && (
              <Box className="ai-message ai-message-assistant" mb="3">
                <Text size="1" color="gray" weight="medium" mb="1">
                  Assistant
                </Text>
                <Card size="1">
                  <Flex align="center" gap="2">
                    <Box className="ai-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </Box>
                    <Text size="2" color="gray">
                      Thinking...
                    </Text>
                  </Flex>
                </Card>
              </Box>
            )}
          </Box>
        )}
      </ScrollArea>

      <Box className="ai-input-container" p="3">
        <Box className="ai-input-wrapper">
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data or request help..."
            size="1"
            style={{ paddingRight: '36px', width: '100%' }}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="1"
            variant="ghost"
            className="ai-send-button"
          >
            →
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Box, Flex, Text, Button, ScrollArea, TextArea, Card } from '@radix-ui/themes'
import './AIAssistant.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIContext {
  query?: string
  selectedText?: string
  results?: any[]
  filters?: any[]
  error?: string
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
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Check for API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('datapup-ai-api-key')
    if (savedKey) {
      setApiKey(savedKey)
    } else {
      setShowApiKeySetup(true)
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Placeholder for AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'This is a placeholder response. The actual AI integration will be implemented by your collaborator.',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleApiKeySubmit = (key: string) => {
    localStorage.setItem('datapup-ai-api-key', key)
    setApiKey(key)
    setShowApiKeySetup(false)
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
        <Box className="ai-setup" p="4">
          <Card>
            <Flex direction="column" gap="3">
              <Text size="2">To use the AI assistant, please configure your API key.</Text>
              <TextArea
                placeholder="Enter your OpenAI API key..."
                size="2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const value = (e.target as HTMLTextAreaElement).value
                    if (value) handleApiKeySubmit(value)
                  }
                }}
              />
              <Flex gap="2">
                <Button
                  size="2"
                  onClick={() => {
                    const input = document.querySelector('textarea')
                    if (input?.value) handleApiKeySubmit(input.value)
                  }}
                >
                  Save API Key
                </Button>
                <Button size="2" variant="soft" onClick={() => setShowApiKeySetup(false)}>
                  Skip for Now
                </Button>
              </Flex>
              <Text size="1" color="gray">
                Your API key is stored locally and never sent to our servers.
              </Text>
            </Flex>
          </Card>
        </Box>
      </Box>
    )
  }

  return (
    <Box className="ai-assistant">
      <Flex className="ai-header" justify="between" align="center" p="3">
        <Flex align="center" gap="2">
          <Text size="2" weight="medium">
            AI Assistant
          </Text>
          {context.selectedText && (
            <Text size="1" color="gray">
              • Selection
            </Text>
          )}
        </Flex>
        {onClose && (
          <Button size="1" variant="ghost" onClick={onClose}>
            ×
          </Button>
        )}
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
              <Box key={message.id} className={`ai-message ai-message-${message.role}`} mb="3">
                <Text size="1" color="gray" weight="medium" mb="1">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </Text>
                <Card size="1">
                  <Text size="2" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Text>
                </Card>
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
        <Flex gap="2">
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your query, data, or request help..."
            size="2"
            style={{ flex: 1 }}
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} size="2">
            Send
          </Button>
        </Flex>
        {apiKey && (
          <Button
            size="1"
            variant="ghost"
            onClick={() => setShowApiKeySetup(true)}
            style={{ marginTop: '8px' }}
          >
            Configure API Key
          </Button>
        )}
      </Box>
    </Box>
  )
}

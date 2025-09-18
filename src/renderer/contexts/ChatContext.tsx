import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { logger } from '../utils/logger'

export interface Message {
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

export interface AIContext {
  connectionId?: string
  database?: string
}

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'openrouter'

export type AIProviderCatalog = {
  id: AIProvider
  label: string
  models: AIModelDescriptor[]
  dynamicModels?: boolean
  dynamicModelsGetter?: () => Promise<{ success: boolean; models: AIModelDescriptor[] }>
}

export interface AIModelDescriptor {
  id: string
  label?: string
  contextLength?: number
  notes?: string
  default?: boolean
}

export const aiProviderCatalog: AIProviderCatalog[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'o4-mini', label: 'o4-mini (reasoning)' }
    ]
  },
  {
    id: 'claude',
    label: 'Claude',
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', default: true },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
    ]
  },
  {
    id: 'gemini',
    label: 'Gemini',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', default: true },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
    ]
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    models: [
      {
        id: 'openai/gpt-4o',
        label: 'OpenAI: GPT-4o',
        contextLength: 128000,
        default: true
      },
      {
        id: 'openai/gpt-4o-mini',
        label: 'OpenAI: GPT-4o-mini',
        contextLength: 128000
      },
      {
        id: 'openai/gpt-3.5-turbo',
        label: 'OpenAI: GPT-3.5 Turbo',
        contextLength: 16385
      },
      {
        id: 'openai/o1-mini',
        label: 'OpenAI: o1-mini',
        contextLength: 128000
      },
      {
        id: 'openai/o3-mini',
        label: 'OpenAI: o3 Mini',
        contextLength: 200000
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        label: 'Anthropic: Claude 3.5 Sonnet',
        contextLength: 200000
      },
      {
        id: 'anthropic/claude-3-haiku',
        label: 'Anthropic: Claude 3 Haiku',
        contextLength: 200000
      },
      {
        id: 'anthropic/claude-opus-4',
        label: 'Anthropic: Claude Opus 4',
        contextLength: 200000
      },
      {
        id: 'anthropic/claude-sonnet-4',
        label: 'Anthropic: Claude Sonnet 4',
        contextLength: 1000000
      },
      {
        id: 'google/gemini-2.5-flash',
        label: 'Google: Gemini 2.5 Flash',
        contextLength: 1048576
      },
      {
        id: 'google/gemini-2.5-pro',
        label: 'Google: Gemini 2.5 Pro',
        contextLength: 1048576
      },
      {
        id: 'google/gemini-pro-1.5',
        label: 'Google: Gemini 1.5 Pro',
        contextLength: 2000000
      },
      {
        id: 'meta-llama/llama-3.1-405b-instruct',
        label: 'Meta: Llama 3.1 405B Instruct',
        contextLength: 32768
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct',
        label: 'Meta: Llama 3.1 70B Instruct',
        contextLength: 131072
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct',
        label: 'Meta: Llama 3.1 8B Instruct',
        contextLength: 131072
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        label: 'Meta: Llama 3.3 70B Instruct',
        contextLength: 131072
      },
      {
        id: 'mistralai/mistral-large-2411',
        label: 'Mistral Large 2411',
        contextLength: 131072
      },
      {
        id: 'mistralai/mistral-medium-3',
        label: 'Mistral: Mistral Medium 3',
        contextLength: 131072
      },
      {
        id: 'mistralai/mistral-nemo',
        label: 'Mistral: Mistral Nemo',
        contextLength: 131072
      },
      {
        id: 'mistralai/mistral-7b-instruct',
        label: 'Mistral: Mistral 7B Instruct',
        contextLength: 32768
      },
      {
        id: 'qwen/qwen2.5-72b-instruct',
        label: 'Qwen2.5 72B Instruct',
        contextLength: 32768
      },
      {
        id: 'qwen/qwen3-max',
        label: 'Qwen: Qwen3 Max',
        contextLength: 256000
      },
      {
        id: 'qwen/qwq-32b',
        label: 'Qwen: QwQ 32B',
        contextLength: 32768
      },
      {
        id: 'qwen/qwen-plus',
        label: 'Qwen: Qwen-Plus',
        contextLength: 131072
      },
      {
        id: 'deepseek/deepseek-chat-v3.1',
        label: 'DeepSeek: DeepSeek V3.1',
        contextLength: 163840
      },
      {
        id: 'deepseek/deepseek-r1',
        label: 'DeepSeek: R1',
        contextLength: 163840
      },
      {
        id: 'mistralai/codestral-2501',
        label: 'Mistral: Codestral 2501',
        contextLength: 262144
      },
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        label: 'Qwen2.5 Coder 32B Instruct',
        contextLength: 32768
      },
      {
        id: 'cohere/command-r-plus',
        label: 'Cohere: Command R+',
        contextLength: 128000
      },
      {
        id: 'cohere/command-r',
        label: 'Cohere: Command R',
        contextLength: 128000
      },
      {
        id: 'nousresearch/hermes-3-llama-3.1-70b',
        label: 'Nous: Hermes 3 70B Instruct',
        contextLength: 131072
      },
      {
        id: 'microsoft/phi-3-mini-128k-instruct',
        label: 'Microsoft: Phi-3 Mini 128K Instruct',
        contextLength: 128000
      }
    ]
  }
]

interface ChatContextType {
  // State
  messages: Message[]
  isLoading: boolean
  provider: AIProvider
  model?: string
  apiKey: string | null
  showApiKeySetup: boolean
  sessionId: string
  isApiKeySetupLocked: boolean

  // Actions
  addMessage: (message: Message) => void
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  setIsLoading: (loading: boolean) => void
  setProvider: (provider: AIProvider) => void
  setModel: (model: string) => void
  setApiKey: (key: string | null) => void
  setShowApiKeySetup: (show: boolean) => void
  clearChat: () => void

  // AI Operations
  sendMessage: (
    content: string,
    context: AIContext,
    onExecuteQuery?: (query: string) => void
  ) => Promise<void>
  handleApiKeySubmit: (key: string, provider: AIProvider) => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
  connectionId: string
}

export function ChatProvider({ children, connectionId }: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProviderState] = useState<AIProvider>(() => {
    const saved = localStorage.getItem('datapup-ai-provider')
    if (saved && ['openai', 'claude', 'gemini', 'openrouter'].includes(saved)) {
      return saved as AIProvider
    }
    return 'openai'
  })
  const [model, setModelState] = useState<string>(() => {
    const saved = localStorage.getItem('datapup-ai-model')
    if (
      saved &&
      aiProviderCatalog
        .find((p: AIProviderCatalog) => p.id === provider)
        ?.models.find((m: AIModelDescriptor) => m.id === saved)
    ) {
      return saved as string
    } else {
      return (
        aiProviderCatalog
          .find((p: AIProviderCatalog) => p.id === provider)
          ?.models.find((m: AIModelDescriptor) => m.default)?.id || ''
      )
    }
  })
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKeySetupState, setShowApiKeySetupState] = useState(false)
  const apiKeySetupLockedRef = useRef(false)

  // Generate session ID that persists for the lifetime of this provider
  const sessionIdRef = useRef(
    `session-${connectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  )
  const sessionId = sessionIdRef.current

  // Check for API key on mount and when provider changes
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const result = await window.api.secureStorage.get(`ai-api-key-${provider}`)
        if (result.success && result.value) {
          setApiKey(result.value)
          if (!apiKeySetupLockedRef.current) {
            setShowApiKeySetupState(false)
          }
        } else {
          setShowApiKeySetupState(true)
        }
      } catch (error) {
        logger.error('Error checking API key:', error)
        setShowApiKeySetupState(true)
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

  // Clear chat when connection changes
  useEffect(() => {
    setMessages([])
    // Generate new session ID for new connection
    sessionIdRef.current = `session-${connectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [connectionId])

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const setProvider = (newProvider: AIProvider) => {
    setProviderState(newProvider)
    localStorage.setItem('datapup-ai-provider', newProvider)
  }

  const setModel = (newModel: string) => {
    setModelState(newModel)
    localStorage.setItem('datapup-ai-model', newModel)
  }

  const setShowApiKeySetup = (show: boolean) => {
    setShowApiKeySetupState(show)
    apiKeySetupLockedRef.current = show
  }

  const clearChat = () => {
    setMessages([])
    // Generate new session ID for fresh conversation
    sessionIdRef.current = `session-${connectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const sendMessage = async (
    content: string,
    context: AIContext,
    onExecuteQuery?: (query: string) => void
  ) => {
    if (!content.trim() || isLoading) return

    const userInput = content.trim()
    setIsLoading(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }

    addMessage(userMessage)

    try {
      // Use single AI process method with session ID
      const result = await window.api.ai.process({
        query: userInput,
        connectionId: context.connectionId || '',
        database: context.database || undefined,
        provider: provider,
        sessionId: sessionId,
        model: model
      })

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.message || result.explanation || 'No response generated.',
          timestamp: new Date(),
          sqlQuery: result.sqlQuery
        }
        addMessage(assistantMessage)
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${result.error || 'Unknown error occurred'}`,
          timestamp: new Date()
        }
        addMessage(errorMessage)
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      }
      addMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApiKeySubmit = async (key: string, currentProvider: AIProvider) => {
    try {
      const result = await window.api.secureStorage.set(`ai-api-key-${currentProvider}`, key)
      if (result.success) {
        setApiKey(key)
        setShowApiKeySetupState(false)
        apiKeySetupLockedRef.current = false
      }
    } catch (error) {
      logger.error('Error saving API key:', error)
    }
  }

  const contextValue: ChatContextType = {
    // State
    messages,
    isLoading,
    provider,
    model,
    apiKey,
    showApiKeySetup: showApiKeySetupState,
    sessionId,
    isApiKeySetupLocked: apiKeySetupLockedRef.current,

    // Actions
    addMessage,
    setMessages,
    setIsLoading,
    setProvider,
    setModel,
    setApiKey,
    setShowApiKeySetup,
    clearChat,

    // AI Operations
    sendMessage,
    handleApiKeySubmit
  }

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
}

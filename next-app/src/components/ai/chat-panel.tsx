'use client'

/**
 * AI Chat Panel Component
 *
 * A conversational AI interface using Vercel AI SDK's useChat() hook.
 * Features:
 * - Streaming responses from OpenRouter models
 * - Tool calling for web search, content extraction, and deep research
 * - Model selection
 * - Message history with role indicators
 * - Responsive design for sidebar or full-page use
 */

import { useChat, type UIMessage } from '@ai-sdk/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Send,
  Bot,
  User,
  Loader2,
  Settings2,
  Search,
  Globe,
  BookOpen,
  Sparkles,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Available AI models
 */
const AI_MODELS = [
  {
    id: 'claude-haiku-45',
    name: 'Claude Haiku 4.5',
    description: 'Fast & efficient (default)',
    icon: '⚡',
  },
  {
    id: 'grok-4-fast',
    name: 'Grok 4 Fast',
    description: 'Real-time reasoning',
    icon: '🚀',
  },
  {
    id: 'kimi-k2',
    name: 'Kimi K2 Thinking',
    description: 'Deep reasoning (cheapest)',
    icon: '🧠',
  },
  {
    id: 'minimax-m2',
    name: 'Minimax M2',
    description: 'Agentic workflows',
    icon: '🤖',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Complex tasks',
    icon: '✨',
  },
] as const

interface ChatPanelProps {
  /** Initial system prompt */
  systemPrompt?: string
  /** Workspace context for the AI */
  workspaceContext?: {
    workspaceName?: string
    workspacePhase?: string
    currentWorkItems?: Array<{ name: string; status: string }>
  }
  /** Callback when chat is minimized */
  onMinimize?: () => void
  /** Whether the panel is in compact mode */
  compact?: boolean
  /** Custom class name */
  className?: string
}

export function ChatPanel({
  systemPrompt,
  workspaceContext,
  onMinimize,
  compact = false,
  className,
}: ChatPanelProps) {
  const [selectedModel, setSelectedModel] = useState('claude-haiku-45')
  const [enableTools, setEnableTools] = useState(true)
  const [quickMode, setQuickMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [inputValue, setInputValue] = useState('')

  // Note: AI SDK v5 has different API - using type assertions for compatibility
   
  const chatHelpers = useChat({
    api: '/api/ai/sdk-chat',
    body: {
      model: selectedModel,
      enableTools,
      quickMode,
      systemPrompt,
      workspaceContext,
    },
    onError: (err: Error) => {
      console.error('[ChatPanel] Error:', err)
    },
  } as Parameters<typeof useChat>[0])

  // Extract properties with type assertions for v5 compatibility
  const messages = chatHelpers.messages as UIMessage[]
  const status = (chatHelpers as { status?: string }).status
  const error = chatHelpers.error
  const setMessages = chatHelpers.setMessages
  const stop = (chatHelpers as { stop?: () => void }).stop
  const reload = (chatHelpers as { reload?: () => void }).reload
  const submitChat = (chatHelpers as { handleSubmit?: (e: React.FormEvent) => void }).handleSubmit

  const isLoading = status === 'streaming' || status === 'submitted' || status === 'in_progress'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle form submission
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (inputValue.trim() && !isLoading && submitChat) {
        submitChat(e)
        setInputValue('')
      }
    },
    [inputValue, isLoading, submitChat]
  )

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSubmit(e as unknown as React.FormEvent)
      }
    },
    [onSubmit]
  )

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([])
  }, [setMessages])

  return (
    <div
      className={cn(
        'flex flex-col bg-background border rounded-lg shadow-lg',
        compact ? 'h-[400px]' : 'h-full min-h-[500px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Assistant</span>
          {isLoading && (
            <Badge variant="secondary" className="animate-pulse">
              Thinking...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {onMinimize && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMinimize}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel (collapsible) */}
      {showSettings && (
        <div className="px-4 py-3 border-b bg-muted/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Model
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.icon}</span>
                        <span>{model.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enableTools}
                onChange={(e) => setEnableTools(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                Web Tools
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={quickMode}
                onChange={(e) => setQuickMode(e.target.checked)}
                className="rounded border-gray-300"
                disabled={!enableTools}
              />
              <span className="text-muted-foreground">Quick Mode</span>
            </label>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <WelcomeMessage />
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                Error: {error.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => reload?.()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/30">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Shift+Enter for new line)"
            className="min-h-[44px] max-h-[120px] resize-none"
            disabled={isLoading}
            rows={1}
          />
          {isLoading ? (
            <Button type="button" variant="outline" onClick={stop}>
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>

        {enableTools && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>
              Tools enabled: Web Search, Content Extraction
              {!quickMode && ', Deep Research'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Welcome message shown when chat is empty
 */
function WelcomeMessage() {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">AI Assistant</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          I can help you with product planning, research, and analysis. I have access to web
          search and can conduct deep research on complex topics.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <SuggestionChip icon={<Search className="h-3 w-3" />}>
          Research competitors
        </SuggestionChip>
        <SuggestionChip icon={<Globe className="h-3 w-3" />}>
          Find best practices
        </SuggestionChip>
        <SuggestionChip icon={<BookOpen className="h-3 w-3" />}>
          Explain a concept
        </SuggestionChip>
      </div>
    </div>
  )
}

/**
 * Suggestion chip for quick actions
 */
function SuggestionChip({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border bg-muted/50 hover:bg-muted transition-colors">
      {icon}
      {children}
    </button>
  )
}

// Legacy message interface for v4 compatibility
interface LegacyMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  toolInvocations?: Array<{
    toolName: string
    state: 'partial-call' | 'result' | 'call'
    result?: unknown
    args?: unknown
  }>
}

/**
 * Individual message bubble
 */
function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  const [isExpanded, setIsExpanded] = useState(true)

  // Cast to legacy message format for v4/v5 compatibility
  const legacyMessage = message as unknown as LegacyMessage

  // Check if message has tool invocations
  const hasToolCalls = legacyMessage.toolInvocations && legacyMessage.toolInvocations.length > 0

  return (
    <div
      className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex-1 space-y-2 overflow-hidden',
          isUser && 'text-right'
        )}
      >
        <div
          className={cn(
            'inline-block rounded-lg px-4 py-2 max-w-[85%]',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <div className="text-sm whitespace-pre-wrap break-words">
            {legacyMessage.content || ''}
          </div>
        </div>

        {/* Tool Invocations */}
        {hasToolCalls && (
          <div className="space-y-2">
            {legacyMessage.toolInvocations?.map((tool, index: number) => (
              <ToolInvocationDisplay key={index} toolInvocation={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Display for tool invocations
 */
function ToolInvocationDisplay({
  toolInvocation,
}: {
  toolInvocation: NonNullable<LegacyMessage['toolInvocations']>[0]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toolIcons: Record<string, React.ReactNode> = {
    webSearch: <Search className="h-3 w-3" />,
    extractContent: <Globe className="h-3 w-3" />,
    deepResearch: <BookOpen className="h-3 w-3" />,
    quickAnswer: <Sparkles className="h-3 w-3" />,
  }

  const toolNames: Record<string, string> = {
    webSearch: 'Web Search',
    extractContent: 'Content Extraction',
    deepResearch: 'Deep Research',
    researchStatus: 'Research Status',
    quickAnswer: 'Quick Answer',
  }

  return (
    <div className="rounded-lg border bg-muted/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {toolIcons[toolInvocation.toolName] || <Sparkles className="h-3 w-3" />}
          <span className="text-xs font-medium">
            {toolNames[toolInvocation.toolName] || toolInvocation.toolName}
          </span>
          {toolInvocation.state === 'partial-call' && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          {toolInvocation.state === 'result' && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              Done
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {isExpanded && toolInvocation.state === 'result' && (
        <div className="px-3 py-2 border-t bg-background/50">
          <pre className="text-xs text-muted-foreground overflow-x-auto max-h-[200px]">
            {JSON.stringify(toolInvocation.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

/**
 * Compact chat trigger button
 */
export function ChatTrigger({
  onClick,
  hasUnread = false,
}: {
  onClick: () => void
  hasUnread?: boolean
}) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="h-12 w-12 rounded-full shadow-lg fixed bottom-6 right-6 z-50"
    >
      <Bot className="h-6 w-6" />
      {hasUnread && (
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
      )}
    </Button>
  )
}

export default ChatPanel

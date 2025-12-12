'use client'

/**
 * Chat Interface V2 - Built with assistant-ui
 *
 * A modern, thread-based chat interface using assistant-ui primitives.
 * Features:
 * - Thread management with history persistence
 * - Message branching (edit and regenerate)
 * - Human-in-the-Loop tool confirmations
 * - Streaming with auto-scroll
 * - Model selection and settings
 * - Rich markdown rendering with code blocks
 *
 * @see https://www.assistant-ui.com/docs
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
  useExternalStoreRuntime,
  useThread,
  type ThreadMessageLike,
  type AppendMessage,
} from '@assistant-ui/react'
// UIMessage type removed - using ThreadMessageLike from assistant-ui instead
import { useCurrentThread, useMessages, type ChatThread, type ChatMessage } from '@/hooks/use-chat-threads'
import { ThreadDropdown } from './thread-dropdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// AI Elements for enhanced code blocks and reasoning display
import { CodeBlock as AICodeBlock, CodeBlockCopyButton } from '@/components/ai-elements/code-block'
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning'
import type { BundledLanguage } from 'shiki'
import { Button } from '@/components/ui/button'
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
  Bot,
  User,
  Send,
  RefreshCw,
  Copy,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Settings,
  Sparkles,
  Zap,
  Square,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToolShortcutBar } from './tool-shortcut-bar'
import { getModelOptionsForUI, isDevMode, getChatModels } from '@/lib/ai/models-config'
import { ToolExecutionProvider } from '@/lib/ai/tool-execution-context'
import { DevDebugPanel } from './dev-debug-panel'
import type { RoutingDebugInfo } from '@/lib/ai/message-analyzer'
import { ThinkingIndicator, ImageAnalysisIndicator } from './thinking-indicator'
// Import all tool UIs for registration with assistant-ui
import {
  CreateWorkItemToolUI,
  CreateTaskToolUI,
  CreateDependencyToolUI,
  CreateTimelineItemToolUI,
  CreateInsightToolUI,
  WebSearchToolUI,
  ExtractDataToolUI,
  AnalyzeFeedbackToolUI,
} from '@/lib/ai/tool-ui-registry'
import { TaskPlanCard } from './task-plan-card'
import { ExecutionProgress } from './execution-progress'
import type { TaskPlan } from '@/lib/ai/task-planner'
import type { ExecutionResult } from '@/lib/ai/agent-loop'

// =============================================================================
// TYPES
// =============================================================================

interface ChatInterfaceV2Props {
  teamId: string
  workspaceId: string
  workspaceName?: string
  className?: string
}

// =============================================================================
// MARKDOWN COMPONENTS
// =============================================================================

/**
 * Enhanced CodeBlock using AI Elements
 * Features: Shiki syntax highlighting, light/dark theme, copy button
 */
function CodeBlock({
  language,
  children,
}: {
  language: string | undefined
  children: string
}) {
  // Map common language aliases to valid Shiki languages
  const langMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    md: 'markdown',
    json: 'json',
    css: 'css',
    html: 'html',
    sql: 'sql',
    go: 'go',
    rust: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'csharp',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    dart: 'dart',
    text: 'text',
    plaintext: 'text',
  }

  const resolvedLang = language
    ? (langMap[language.toLowerCase()] || language)
    : 'text'

  const showLineNumbers = children.split('\n').length > 3

  return (
    <div className="my-2">
      <AICodeBlock
        code={children}
        language={resolvedLang as BundledLanguage}
        showLineNumbers={showLineNumbers}
        className="text-sm"
      >
        <CodeBlockCopyButton />
      </AICodeBlock>
    </div>
  )
}

const markdownComponents = {
  p: ({ children }: { children: React.ReactNode }) => <p className="my-1">{children}</p>,
  ul: ({ children }: { children: React.ReactNode }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
  ol: ({ children }: { children: React.ReactNode }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => <li className="my-0.5">{children}</li>,
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
  code: ({ className, children, ...props }: { className?: string; children: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !className

    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs font-mono">
          {children}
        </code>
      )
    }

    return (
      <CodeBlock language={match?.[1]}>
        {String(children).replace(/\n$/, '')}
      </CodeBlock>
    )
  },
  pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-zinc-700">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-zinc-800 text-zinc-200">{children}</thead>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-3 py-2 text-left font-semibold border-b border-zinc-700">{children}</th>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody className="divide-y divide-zinc-800">{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="hover:bg-zinc-800/50 transition-colors">{children}</tr>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-3 py-2">{children}</td>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a
      href={href}
      className="text-blue-400 underline hover:text-blue-300 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="my-2 pl-3 border-l-2 border-zinc-600 text-zinc-400 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-zinc-700" />,
  h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-lg font-bold my-2">{children}</h1>,
  h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-base font-bold my-2">{children}</h2>,
  h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-bold my-1.5">{children}</h3>,
}

// =============================================================================
// REASONING COMPONENT (For thinking models like DeepSeek, Kimi K2)
// =============================================================================

/**
 * ReasoningBlock displays model thinking/reasoning with collapsible UI
 * Auto-opens while streaming, auto-closes when complete
 */
interface ReasoningBlockProps {
  content: string
  isStreaming?: boolean
}

function ReasoningBlock({ content, isStreaming = false }: ReasoningBlockProps) {
  return (
    <Reasoning
      isStreaming={isStreaming}
      defaultOpen={true}
      className="mb-4"
    >
      <ReasoningTrigger />
      <ReasoningContent>
        {content}
      </ReasoningContent>
    </Reasoning>
  )
}

// =============================================================================
// MESSAGE COMPONENTS
// =============================================================================

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex gap-3 py-4 group border-b border-border/50">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
        <User className="h-4 w-4 text-blue-400" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="text-xs text-muted-foreground mb-1">You</div>
        <div className="text-sm">
          <MessagePrimitive.Content />
        </div>
        <UserMessageActions />
      </div>
    </MessagePrimitive.Root>
  )
}

function UserMessageActions() {
  return (
    <ActionBarPrimitive.Root className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit message">
          <Pencil className="h-3.5 w-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  )
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex gap-3 py-4 group border-b border-border/50">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Bot className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="text-xs text-muted-foreground mb-1">Assistant</div>
        <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-inherit">
          <MessagePrimitive.Content
            components={{
              // Render text content as markdown
              Text: ({ text }) => (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents as never}
                >
                  {text}
                </ReactMarkdown>
              ),
              // Render reasoning/thinking from models like DeepSeek, Kimi K2
              Reasoning: ({ text, status }) => (
                <ReasoningBlock content={text} isStreaming={status.type === 'running'} />
              ),
              // Tool UIs are registered via toolUIRegistry
            }}
          />
        </div>
        <AssistantMessageActions />
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantMessageActions() {
  return (
    <ActionBarPrimitive.Root className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy message">
          <Copy className="h-3.5 w-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Regenerate">
          <RefreshCw className="h-3.5 w-3.5" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      <BranchPicker />
    </ActionBarPrimitive.Root>
  )
}

function BranchPicker() {
  return (
    <BranchPickerPrimitive.Root className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous version">
          <ChevronLeft className="h-3.5 w-3.5" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next version">
          <ChevronRight className="h-3.5 w-3.5" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  )
}

// =============================================================================
// COMPOSER (Input Area)
// =============================================================================

function Composer() {
  return (
    <ComposerPrimitive.Root className="relative flex flex-col gap-2 rounded-lg border bg-card p-3">
      <ComposerPrimitive.Input
        placeholder="Type a message... (Shift+Enter for new line)"
        className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[60px] max-h-[200px]"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>AI-powered assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Square className="h-3.5 w-3.5 mr-1" />
              Stop
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" className="h-8">
              <Send className="h-3.5 w-3.5 mr-1" />
              Send
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </div>
    </ComposerPrimitive.Root>
  )
}

// =============================================================================
// WELCOME MESSAGE
// =============================================================================

function ThreadWelcome() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Welcome to AI Assistant</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        I can help you create work items, analyze feedback, search the web, and more.
        Try typing a message or use a quick action below.
      </p>
    </div>
  )
}

// =============================================================================
// TOOLTIP ICON BUTTON
// =============================================================================

interface TooltipIconButtonProps {
  tooltip: string
  children: React.ReactNode
  onClick?: () => void
}

function TooltipIconButton({ tooltip, children, onClick }: TooltipIconButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="p-1.5 rounded hover:bg-muted transition-colors"
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// =============================================================================
// THREAD COMPONENT
// =============================================================================

// Debug component to check thread messages
function ThreadDebug() {
  const thread = useThread()
  useEffect(() => {
    console.log('[ThreadDebug] Thread state:', {
      messages: thread.messages,
      messageCount: thread.messages.length,
      isRunning: thread.isRunning,
    })
    // Log each message
    thread.messages.forEach((msg, i) => {
      console.log(`[ThreadDebug] Message ${i}:`, {
        id: msg.id,
        role: msg.role,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        partsCount: (msg as any).parts?.length || 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        partTypes: (msg as any).parts?.map((p: { type: string }) => p.type) || [],
      })
    })
  }, [thread.messages])
  return null // This component only logs, doesn't render anything
}

function Thread({ onInsertPrompt }: { onInsertPrompt?: (prompt: string) => void }) {
  return (
    <ThreadPrimitive.Root className="flex flex-col h-full">
      {/* Debug component to check what messages the runtime has */}
      <ThreadDebug />

      {/* Scrollable message area */}
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4">
        <ThreadPrimitive.Empty>
          <ThreadWelcome />
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>

      {/* Tool shortcuts */}
      {onInsertPrompt && (
        <div className="px-4 py-2 border-t">
          <ToolShortcutBar
            onInsertPrompt={onInsertPrompt}
          />
        </div>
      )}

      {/* Composer */}
      <div className="px-4 pb-4 pt-2">
        <Composer />
      </div>
    </ThreadPrimitive.Root>
  )
}

// =============================================================================
// SETTINGS PANEL
// =============================================================================

interface SettingsPanelProps {
  // Mode settings (replaces model dropdown)
  mode: 'chat' | 'agentic'
  onModeChange: (mode: 'chat' | 'agentic') => void
  quickMode: boolean
  onQuickModeChange: (enabled: boolean) => void
  // Thread props
  threads: ChatThread[]
  currentThreadId: string | null
  currentThread: ChatThread | null
  threadsLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  onSelectThread: (threadId: string | null) => void
  onNewThread: () => void
  onArchiveThread: (threadId: string) => void
  loadMore: () => void
  // Dev mode props
  userIsDevMode: boolean
  routingInfo?: RoutingDebugInfo | null
  devOverride?: string
  onDevOverrideChange?: (modelKey: string | undefined) => void
  ragUsed?: boolean
  ragItemCount?: number
  imageAnalyzed?: boolean
}

function SettingsPanel({
  mode,
  onModeChange,
  quickMode,
  onQuickModeChange,
  threads,
  currentThreadId,
  currentThread,
  threadsLoading,
  isLoadingMore,
  hasMore,
  onSelectThread,
  onNewThread,
  onArchiveThread,
  loadMore,
  userIsDevMode,
  routingInfo,
  devOverride,
  onDevOverrideChange,
  ragUsed,
  ragItemCount,
  imageAnalyzed,
}: SettingsPanelProps) {
  return (
    <div className="flex flex-col border-b bg-muted/50">
      {/* Main settings row */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Thread Dropdown */}
        <ThreadDropdown
          threads={threads}
          currentThreadId={currentThreadId}
          currentThread={currentThread}
          isLoading={threadsLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onSelectThread={onSelectThread}
          onNewThread={onNewThread}
          onArchiveThread={onArchiveThread}
          loadMore={loadMore}
        />

        {/* Separator */}
        <div className="h-4 w-px bg-border" />

        {/* Mode Toggle (Chat / Agentic) */}
        <div className="flex items-center gap-1">
          <Button
            variant={mode === 'chat' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onModeChange('chat')}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Chat
          </Button>
          <Button
            variant={mode === 'agentic' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onModeChange('agentic')}
          >
            <Zap className={cn('h-3 w-3 mr-1', mode === 'agentic' && 'text-yellow-400')} />
            Agentic
          </Button>
        </div>

        {/* Quick Mode Toggle (only in agentic mode) */}
        {mode === 'agentic' && (
          <>
            <div className="h-4 w-px bg-border" />
            <Button
              variant={quickMode ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onQuickModeChange(!quickMode)}
            >
              <Zap className={cn('h-3 w-3 mr-1', quickMode && 'text-yellow-400')} />
              Quick
            </Button>
          </>
        )}

        {/* Auto-routing badge */}
        <Badge variant="outline" className="text-xs ml-auto">
          Auto-routing
        </Badge>
      </div>

      {/* Dev Debug Panel (only for dev accounts) */}
      {userIsDevMode && (
        <div className="px-4 pb-2">
          <DevDebugPanel
            isDevMode={userIsDevMode}
            routingInfo={routingInfo}
            devOverride={devOverride}
            onDevOverrideChange={onDevOverrideChange}
            ragUsed={ragUsed}
            ragItemCount={ragItemCount}
            imageAnalyzed={imageAnalyzed}
          />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MESSAGE CONVERSION UTILITIES
// =============================================================================

// Note: convertToUIMessage has been replaced by convertMessage inside ChatRuntime
// which converts ChatMessage to ThreadMessageLike for useExternalStoreRuntime

/**
 * Extract text content from message (handles both 'parts' and 'content' structures)
 */
function extractTextContent(msg: { parts?: unknown; content?: unknown }): string | null {
  // Handle parts array (AI SDK v5 format)
  if (Array.isArray(msg.parts)) {
    const textParts = msg.parts
      .filter((part): part is { type: 'text'; text: string } =>
        typeof part === 'object' && part !== null && (part as { type?: string }).type === 'text'
      )
      .map(part => part.text)

    if (textParts.length > 0) return textParts.join('\n')
  }

  // Handle content array (assistant-ui format)
  if (Array.isArray(msg.content)) {
    const textParts = msg.content
      .filter((part): part is { type: 'text'; text: string } =>
        typeof part === 'object' && part !== null && (part as { type?: string }).type === 'text'
      )
      .map(part => part.text)

    if (textParts.length > 0) return textParts.join('\n')
  }

  // Handle string content
  if (typeof msg.content === 'string') return msg.content

  return null
}

/**
 * Convert thread message to Supabase ChatMessage format for saving
 *
 * Handles both AI SDK v5 format (parts array) and assistant-ui format (content array)
 * Saves both text content (for search) and full parts array (for complete reconstruction)
 */
function convertThreadMessageToChatMessage(
  msg: { role: string; parts?: unknown; content?: unknown }
): Omit<ChatMessage, 'id' | 'thread_id' | 'created_at'> {
  const textContent = extractTextContent(msg)

  // Determine the parts array to save
  // Priority: parts (AI SDK v5) > content array (assistant-ui) > null
  let partsToSave: ChatMessage['parts'] = null
  let source: string = 'none'

  if (Array.isArray(msg.parts) && msg.parts.length > 0) {
    // AI SDK v5 format - use parts directly
    partsToSave = msg.parts as ChatMessage['parts']
    source = 'parts'
  } else if (Array.isArray(msg.content) && msg.content.length > 0) {
    // assistant-ui format - content is the parts array
    partsToSave = msg.content as ChatMessage['parts']
    source = 'content'
  }

  // Debug logging
  const partTypes = partsToSave?.map((p: { type: string }) => p.type) || []
  console.log('[convertThreadMessageToChatMessage] Saving:', {
    role: msg.role,
    source,
    partTypes,
    hasTextContent: !!textContent,
    hasMsgParts: Array.isArray(msg.parts) && msg.parts.length > 0,
    hasMsgContent: Array.isArray(msg.content) && msg.content.length > 0,
  })

  return {
    role: msg.role as 'user' | 'assistant' | 'system',
    content: textContent,
    parts: partsToSave,
    tool_invocations: null,
    model_used: null,
    metadata: {},
  }
}

// =============================================================================
// CHAT RUNTIME INNER COMPONENT
// =============================================================================

/**
 * Inner component that creates and manages the chat runtime.
 * Uses useExternalStoreRuntime for full control over message display.
 * Messages are loaded from Supabase and displayed directly.
 */
interface ChatRuntimeProps {
  teamId: string
  workspaceId: string
  workspaceName: string
  threadId: string | null
  mode: 'chat' | 'agentic'
  quickMode: boolean
  devOverride?: string
  onInsertPrompt: (prompt: string) => void
  initialMessages: ChatMessage[]
  onSaveMessage: (message: Omit<ChatMessage, 'id' | 'thread_id' | 'created_at'>, threadId: string) => Promise<ChatMessage | null>
  onCreateThread: () => Promise<ChatThread | null>
  onThreadCreated: (threadId: string) => void
  // Callbacks for routing info (dev mode)
  onRoutingInfo?: (info: RoutingDebugInfo | null) => void
  onSlowModel?: (isSlow: boolean) => void
  onRagUsed?: (used: boolean, count: number) => void
  onImageAnalyzed?: (analyzed: boolean) => void
}

function ChatRuntime({
  teamId,
  workspaceId,
  workspaceName,
  threadId,
  mode,
  quickMode,
  devOverride,
  onInsertPrompt,
  initialMessages,
  onSaveMessage,
  onCreateThread,
  onThreadCreated,
  onRoutingInfo,
  onSlowModel,
  onRagUsed,
  onImageAnalyzed,
}: ChatRuntimeProps) {
  // Local messages state for the runtime
  const [messages, setMessages] = useState<ThreadMessageLike[]>([])
  const [isRunning, setIsRunning] = useState(false)

  // Multi-step plan state
  const [pendingPlan, setPendingPlan] = useState<TaskPlan | null>(null)
  const [executingPlan, setExecutingPlan] = useState<TaskPlan | null>(null)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [executionElapsedTime, setExecutionElapsedTime] = useState(0)
  const cancelSignalRef = useRef<{ cancelled: boolean }>({ cancelled: false })

  // Track saved message IDs to avoid duplicates
  const savedMessageIdsRef = useRef<Set<string>>(new Set())

  // Ref for dynamic body values
  const dynamicBodyRef = useRef({
    mode,
    quickMode,
    devOverride,
    threadId,
    workspaceContext: {
      workspaceId,
      workspaceName,
    },
  })

  // Keep ref in sync
  useEffect(() => {
    dynamicBodyRef.current = {
      mode,
      quickMode,
      devOverride,
      threadId,
      workspaceContext: {
        workspaceId,
        workspaceName,
      },
    }
  }, [mode, quickMode, devOverride, threadId, workspaceId, workspaceName])

  // Convert ChatMessage to ThreadMessageLike
  // Note: Assistant messages need a 'status' field for useExternalStoreRuntime
  const convertMessage = useCallback((msg: ChatMessage): ThreadMessageLike => {
    let content: ThreadMessageLike['content']

    // Valid part types for assistant-ui
    const validPartTypes = new Set(['text', 'reasoning', 'tool-invocation', 'tool-result', 'image', 'file', 'audio'])

    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
      // Filter out invalid part types (like 'step-start' from AI SDK streaming)
      const filteredParts = msg.parts.filter(part => validPartTypes.has(part.type))
      if (filteredParts.length > 0) {
        content = filteredParts as ThreadMessageLike['content']
      } else if (msg.content) {
        // If no valid parts, fall back to content string
        content = [{ type: 'text' as const, text: msg.content }]
      } else {
        content = []
      }
    } else if (msg.content) {
      // Fall back to content string as simple text
      content = [{ type: 'text' as const, text: msg.content }]
    } else {
      content = []
    }

    console.log('[convertMessage] Converting:', {
      id: msg.id,
      role: msg.role,
      contentType: Array.isArray(msg.parts) && msg.parts.length > 0 ? 'parts' : 'text',
      partTypes: Array.isArray(content) ? content.map((p: { type: string }) => p.type) : [],
    })

    // Base message - ALL messages need metadata for useExternalStoreRuntime
    const baseMessage = {
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content,
      createdAt: new Date(msg.created_at),
      metadata: {}, // Required by assistant-ui
    }

    // Assistant messages also need status field
    if (msg.role === 'assistant') {
      return {
        ...baseMessage,
        status: { type: 'complete' as const, reason: 'stop' as const },
        metadata: { unstable_state: 'complete' },
      }
    }

    return baseMessage
  }, [])

  // Initialize messages from props when component mounts or initialMessages change
  useEffect(() => {
    console.log('[ChatRuntime] Initializing messages from props, count:', initialMessages.length)

    // Mark all initial messages as saved
    initialMessages.forEach(msg => savedMessageIdsRef.current.add(msg.id))

    // Convert and set messages
    const converted = initialMessages.map(convertMessage)
    console.log('[ChatRuntime] Converted messages:', converted.length)
    setMessages(converted)
  }, [initialMessages, convertMessage])

  // Handle new message from user
  const onNew = useCallback(async (message: AppendMessage) => {
    console.log('[ChatRuntime] onNew called:', message)

    // Extract text content from message
    const textPart = message.content.find(part => part.type === 'text')
    if (!textPart || textPart.type !== 'text') {
      console.error('[ChatRuntime] No text content in message')
      return
    }

    const userText = textPart.text
    const userMessageId = Date.now().toString()

    // Add user message to local state (ALL messages need metadata for assistant-ui)
    const userMessage: ThreadMessageLike = {
      id: userMessageId,
      role: 'user',
      content: [{ type: 'text', text: userText }],
      createdAt: new Date(),
      metadata: {}, // Required by assistant-ui
    }
    setMessages(prev => [...prev, userMessage])

    // Auto-create thread if needed
    let effectiveThreadId = threadId
    let isNewThread = false
    if (!effectiveThreadId) {
      console.log('[ChatRuntime] No thread, auto-creating...')
      const newThread = await onCreateThread()
      if (newThread) {
        effectiveThreadId = newThread.id
        isNewThread = true
        console.log('[ChatRuntime] Thread created:', effectiveThreadId)
        // DON'T notify parent yet - wait until after streaming completes
        // to avoid component unmount during API call
      } else {
        console.error('[ChatRuntime] Failed to create thread')
      }
    }

    // Save user message to Supabase (now we have a thread)
    if (effectiveThreadId) {
      console.log('[ChatRuntime] Saving user message to thread:', effectiveThreadId)
      await onSaveMessage({
        role: 'user',
        content: userText,
        parts: [{ type: 'text', text: userText }],
        tool_invocations: null,
        model_used: null,
        metadata: {},
      }, effectiveThreadId)
    } else {
      console.warn('[ChatRuntime] Could not save user message - no thread')
    }

    // Call the API to get assistant response
    setIsRunning(true)
    try {
      // Build messages array in UIMessage format for AI SDK v5
      // UIMessage requires 'parts' array, not 'content' string
      const apiMessages = [...messages, userMessage].map(m => {
        // Extract text parts from content array
        let parts: Array<{ type: 'text'; text: string }> = []
        if (Array.isArray(m.content)) {
          parts = m.content
            .filter((p: { type: string }) => p.type === 'text')
            .map((p: { type: string; text?: string }) => ({
              type: 'text' as const,
              text: p.text || '',
            }))
        } else if (typeof m.content === 'string') {
          parts = [{ type: 'text', text: m.content }]
        }

        // Ensure at least one text part
        if (parts.length === 0) {
          parts = [{ type: 'text', text: '' }]
        }

        return {
          id: m.id,
          role: m.role,
          parts, // AI SDK v5 requires parts array
          createdAt: m.createdAt,
        }
      })

      const response = await fetch('/api/ai/unified-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-ID': teamId,
          'X-Workspace-ID': workspaceId,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: dynamicBodyRef.current.mode,
          quickMode: dynamicBodyRef.current.quickMode,
          devOverride: dynamicBodyRef.current.devOverride,
          workspaceContext: dynamicBodyRef.current.workspaceContext,
          teamId,
          workspaceId,
          threadId: dynamicBodyRef.current.threadId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Check for plan-created response (non-streaming JSON)
      const isPlanCreated = response.headers.get('X-Plan-Created') === 'true'
      if (isPlanCreated) {
        const planResponse = await response.json()
        if (planResponse.type === 'plan-created' && planResponse.plan) {
          console.log('[ChatRuntime] Plan created:', planResponse.plan.id)
          setPendingPlan(planResponse.plan)
          setIsRunning(false)

          // Notify parent about new thread if created
          if (isNewThread && effectiveThreadId) {
            console.log('[ChatRuntime] Notifying parent of new thread (plan):', effectiveThreadId)
            onThreadCreated(effectiveThreadId)
          }
          return // Don't process as chat stream
        }
      }

      // Extract routing info from headers (for dev mode)
      const routingDebugHeader = response.headers.get('X-Routing-Debug')
      if (routingDebugHeader && onRoutingInfo) {
        try {
          const debugInfo = JSON.parse(routingDebugHeader)
          onRoutingInfo(debugInfo)
        } catch { /* ignore parse errors */ }
      }

      // Extract other routing headers
      const isSlowModelHeader = response.headers.get('X-Is-Slow-Model')
      if (onSlowModel) {
        onSlowModel(isSlowModelHeader === 'true')
      }

      const ragUsedHeader = response.headers.get('X-RAG-Used')
      const ragItemsHeader = response.headers.get('X-RAG-Items')
      if (onRagUsed) {
        onRagUsed(ragUsedHeader === 'true', parseInt(ragItemsHeader || '0', 10))
      }

      const imageAnalyzedHeader = response.headers.get('X-Image-Analyzed')
      if (onImageAnalyzed) {
        onImageAnalyzed(imageAnalyzedHeader === 'true')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let assistantText = ''
      let reasoningText = '' // Track reasoning/thinking content separately
      const assistantMessageId = (Date.now() + 1).toString()

      // Helper to build content array with both reasoning and text parts
      // Using proper literal types for assistant-ui compatibility
      type ContentPart = { type: 'text'; text: string } | { type: 'reasoning'; text: string }
      const buildContent = (): ContentPart[] => {
        const parts: ContentPart[] = []
        if (reasoningText) {
          parts.push({ type: 'reasoning' as const, text: reasoningText })
        }
        if (assistantText) {
          parts.push({ type: 'text' as const, text: assistantText })
        }
        // Always have at least one text part for display
        if (parts.length === 0) {
          parts.push({ type: 'text' as const, text: '' })
        }
        return parts
      }

      // Add placeholder assistant message with 'running' status and metadata
      const assistantMessage: ThreadMessageLike = {
        id: assistantMessageId,
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        createdAt: new Date(),
        status: { type: 'running' as const },
        metadata: { unstable_state: 'running' },
      }
      setMessages(prev => [...prev, assistantMessage])

      // Read the stream
      // UI Message Stream format uses SSE with "data: {...json...}" format
      // Event types: start, text-start, text-delta, text-end, reasoning-delta, finish
      console.log('[ChatRuntime] Starting stream read...')
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('[ChatRuntime] Stream done, text:', assistantText.length, 'reasoning:', reasoningText.length)
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log('[ChatRuntime] Raw chunk:', chunk.substring(0, 200))

        // Parse SSE data - UI Message Stream format
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.trim()) continue // Skip empty lines

          // UI Message Stream uses "data: {...}" format
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6) // Remove "data: " prefix

            // Skip [DONE] marker
            if (jsonStr === '[DONE]') {
              console.log('[ChatRuntime] Received [DONE] marker')
              continue
            }

            try {
              const data = JSON.parse(jsonStr)
              console.log('[ChatRuntime] SSE event:', data.type)

              // Handle reasoning-delta events (Kimi K2, DeepSeek thinking)
              // AI SDK v5 uses 'delta', some versions use 'textDelta'
              if (data.type === 'reasoning-delta' && (data.delta || data.textDelta)) {
                reasoningText += data.delta || data.textDelta
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
              // Handle reasoning type (full reasoning content)
              else if (data.type === 'reasoning' && (data.reasoning || data.text || data.textDelta)) {
                reasoningText += data.reasoning || data.text || data.textDelta
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
              // Handle text-delta events - this is where the actual text comes
              else if (data.type === 'text-delta' && data.delta) {
                assistantText += data.delta
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
              // Also handle plain text type (some versions use this)
              else if (data.type === 'text' && data.text) {
                assistantText += data.text
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
            } catch (e) {
              console.log('[ChatRuntime] SSE parse error:', e, 'line:', line.substring(0, 50))
            }
          }
          // Also handle old data stream format as fallback (0: prefix)
          else if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2))
              if (typeof text === 'string') {
                assistantText += text
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
            } catch {
              // Ignore parse errors for fallback
            }
          }
        }
      }

      // Mark assistant message as complete with metadata
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? { ...m, status: { type: 'complete' as const, reason: 'stop' as const }, metadata: { unstable_state: 'complete' } }
          : m
      ))

      // Save assistant message to Supabase (use effectiveThreadId from auto-create)
      // Include both reasoning and text content
      if (effectiveThreadId && (assistantText || reasoningText)) {
        console.log('[ChatRuntime] Saving assistant message to thread:', effectiveThreadId, 'text:', assistantText.length, 'reasoning:', reasoningText.length)
        await onSaveMessage({
          role: 'assistant',
          content: assistantText, // Plain text for backwards compatibility
          parts: buildContent(), // Full parts array with reasoning + text
          tool_invocations: null,
          model_used: null, // Model is determined server-side via routing
          metadata: {},
        }, effectiveThreadId)
      }

      // NOW notify parent about new thread (after streaming complete)
      // This will update the thread dropdown but won't remount this component
      // because we've already finished streaming
      if (isNewThread && effectiveThreadId) {
        console.log('[ChatRuntime] Notifying parent of new thread:', effectiveThreadId)
        onThreadCreated(effectiveThreadId)
      }

    } catch (error) {
      console.error('[ChatRuntime] API error:', error)
      // Add error message with complete status and metadata
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        createdAt: new Date(),
        status: { type: 'complete' as const, reason: 'stop' as const },
        metadata: { unstable_state: 'complete' },
      }])

      // Still notify parent about new thread even on error
      if (isNewThread && effectiveThreadId) {
        console.log('[ChatRuntime] Notifying parent of new thread (after error):', effectiveThreadId)
        onThreadCreated(effectiveThreadId)
      }
    } finally {
      setIsRunning(false)
    }
  }, [messages, teamId, workspaceId, threadId, onSaveMessage, onCreateThread, onThreadCreated])

  // Handle reload (regenerate last assistant message)
  const onReload = useCallback(async () => {
    console.log('[ChatRuntime] onReload called')

    // Find the last assistant message index
    let lastAssistantIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        lastAssistantIndex = i
        break
      }
    }

    if (lastAssistantIndex === -1) {
      console.log('[ChatRuntime] No assistant message to reload')
      return
    }

    // Remove the last assistant message and any messages after it
    const messagesWithoutLast = messages.slice(0, lastAssistantIndex)
    setMessages(messagesWithoutLast)

    // Find the last user message to regenerate from
    const lastUserMessage = messagesWithoutLast.findLast(m => m.role === 'user')
    if (!lastUserMessage) {
      console.log('[ChatRuntime] No user message to regenerate from')
      return
    }

    // Call the API to regenerate
    setIsRunning(true)
    try {
      // Build messages array in UIMessage format for AI SDK v5
      const apiMessages = messagesWithoutLast.map(m => {
        let parts: Array<{ type: 'text'; text: string }> = []
        if (Array.isArray(m.content)) {
          parts = m.content
            .filter((p: { type: string }) => p.type === 'text')
            .map((p: { type: string; text?: string }) => ({
              type: 'text' as const,
              text: p.text || '',
            }))
        } else if (typeof m.content === 'string') {
          parts = [{ type: 'text', text: m.content }]
        }
        if (parts.length === 0) {
          parts = [{ type: 'text', text: '' }]
        }
        return {
          id: m.id,
          role: m.role,
          parts,
          createdAt: m.createdAt,
        }
      })

      const response = await fetch('/api/ai/unified-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-ID': teamId,
          'X-Workspace-ID': workspaceId,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: dynamicBodyRef.current.mode,
          quickMode: dynamicBodyRef.current.quickMode,
          devOverride: dynamicBodyRef.current.devOverride,
          workspaceContext: dynamicBodyRef.current.workspaceContext,
          teamId,
          workspaceId,
          threadId: dynamicBodyRef.current.threadId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Extract routing info from headers (for dev mode)
      const reloadRoutingDebugHeader = response.headers.get('X-Routing-Debug')
      if (reloadRoutingDebugHeader && onRoutingInfo) {
        try {
          const debugInfo = JSON.parse(reloadRoutingDebugHeader)
          onRoutingInfo(debugInfo)
        } catch { /* ignore parse errors */ }
      }

      // Extract slow model header
      const reloadSlowModelHeader = response.headers.get('X-Is-Slow-Model')
      if (onSlowModel) {
        onSlowModel(reloadSlowModelHeader === 'true')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let assistantText = ''
      let reasoningText = '' // Track reasoning/thinking content
      const assistantMessageId = Date.now().toString()

      // Helper to build content array with both reasoning and text parts
      // Using proper literal types for assistant-ui compatibility
      type ReloadContentPart = { type: 'text'; text: string } | { type: 'reasoning'; text: string }
      const buildReloadContent = (): ReloadContentPart[] => {
        const parts: ReloadContentPart[] = []
        if (reasoningText) {
          parts.push({ type: 'reasoning' as const, text: reasoningText })
        }
        if (assistantText) {
          parts.push({ type: 'text' as const, text: assistantText })
        }
        if (parts.length === 0) {
          parts.push({ type: 'text' as const, text: '' })
        }
        return parts
      }

      // Add placeholder assistant message
      const assistantMessage: ThreadMessageLike = {
        id: assistantMessageId,
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        createdAt: new Date(),
        status: { type: 'running' as const },
        metadata: { unstable_state: 'running' },
      }
      setMessages(prev => [...prev, assistantMessage])

      // Read the stream - UI Message Stream format
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          // UI Message Stream uses "data: {...}" format
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6)
            if (jsonStr === '[DONE]') continue

            try {
              const data = JSON.parse(jsonStr)
              // Handle reasoning-delta events (Kimi K2, DeepSeek thinking)
              // AI SDK v5 uses 'delta', some versions use 'textDelta'
              if (data.type === 'reasoning-delta' && (data.delta || data.textDelta)) {
                reasoningText += data.delta || data.textDelta
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildReloadContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
              // Handle reasoning type (full reasoning content)
              else if (data.type === 'reasoning' && (data.reasoning || data.text || data.textDelta)) {
                reasoningText += data.reasoning || data.text || data.textDelta
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildReloadContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
              // Handle text-delta events
              else if (data.type === 'text-delta' && data.delta) {
                assistantText += data.delta
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildReloadContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
              // Also handle plain text type
              else if (data.type === 'text' && data.text) {
                assistantText += data.text
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildReloadContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
            } catch {
              // Ignore parse errors
            }
          }
          // Fallback for old data stream format
          else if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2))
              if (typeof text === 'string') {
                assistantText += text
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: buildReloadContent(), status: { type: 'running' as const }, metadata: { unstable_state: 'running' } }
                    : m
                ))
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Mark assistant message as complete
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? { ...m, status: { type: 'complete' as const, reason: 'stop' as const }, metadata: { unstable_state: 'complete' } }
          : m
      ))

      // Save regenerated assistant message to Supabase (include reasoning)
      if (threadId && (assistantText || reasoningText)) {
        console.log('[ChatRuntime] Saving regenerated message to thread:', threadId, 'text:', assistantText.length, 'reasoning:', reasoningText.length)
        await onSaveMessage({
          role: 'assistant',
          content: assistantText, // Plain text for backwards compatibility
          parts: buildReloadContent(), // Full parts array with reasoning + text
          tool_invocations: null,
          model_used: null, // Model is determined server-side via routing
          metadata: {},
        }, threadId)
      }

    } catch (error) {
      console.error('[ChatRuntime] Reload error:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        createdAt: new Date(),
        status: { type: 'complete' as const, reason: 'stop' as const },
        metadata: { unstable_state: 'complete' },
      }])
    } finally {
      setIsRunning(false)
    }
  }, [messages, teamId, workspaceId, threadId, onSaveMessage])

  // ─────────────────────────────────────────────────────────────────────────
  // PLAN HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  // Handle plan approval - execute all steps
  const handlePlanApproveAll = useCallback(async () => {
    if (!pendingPlan || !threadId) return

    console.log('[ChatRuntime] Approving plan:', pendingPlan.id)
    setExecutingPlan(pendingPlan)
    setPendingPlan(null)
    setExecutionProgress(0)
    setExecutionElapsedTime(0)
    setExecutionResult(null)
    cancelSignalRef.current = { cancelled: false }

    // Start elapsed time timer
    const startTime = Date.now()
    const timerInterval = setInterval(() => {
      setExecutionElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    try {
      const response = await fetch('/api/ai/agent/plan/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: pendingPlan.id,
          threadId,
          mode: 'all',
        }),
      })

      if (!response.ok) {
        throw new Error(`Approval error: ${response.status}`)
      }

      // Handle SSE stream for progress updates
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let currentStepIndex = 0
      let result: ExecutionResult | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          if (jsonStr === '[DONE]') continue

          try {
            const event = JSON.parse(jsonStr)
            console.log('[ChatRuntime] Plan event:', event.type)

            if (event.type === 'step-start') {
              currentStepIndex = event.stepIndex || currentStepIndex
              setExecutionProgress(currentStepIndex)
            } else if (event.type === 'step-complete') {
              currentStepIndex = (event.stepIndex || currentStepIndex) + 1
              setExecutionProgress(currentStepIndex)
            } else if (event.type === 'execution-complete') {
              result = event.result
              setExecutionResult(result)
            } else if (event.type === 'execution-failed') {
              result = event.result
              setExecutionResult(result)
            }
          } catch (e) {
            console.warn('[ChatRuntime] Failed to parse SSE event:', e)
          }
        }
      }

      // Add completion message to chat
      if (result) {
        const completionText = result.success
          ? `✅ Plan completed successfully. ${result.completedSteps}/${result.totalSteps} steps executed.`
          : `❌ Plan failed. ${result.completedSteps}/${result.totalSteps} steps completed. Error: ${result.errors?.join(', ') || 'Unknown error'}`

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: [{ type: 'text', text: completionText }],
          createdAt: new Date(),
          status: { type: 'complete' as const, reason: 'stop' as const },
          metadata: { unstable_state: 'complete' },
        }])

        // Save completion message to thread
        await onSaveMessage({
          role: 'assistant',
          content: completionText,
          parts: [{ type: 'text', text: completionText }],
          tool_invocations: null,
          model_used: null,
          metadata: { planExecution: true, planId: pendingPlan.id },
        }, threadId)
      }
    } catch (error) {
      console.error('[ChatRuntime] Plan execution error:', error)
      setExecutionResult({
        success: false,
        completedSteps: executionProgress,
        totalSteps: pendingPlan.steps.length,
        results: {},
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: executionElapsedTime * 1000, // Convert to ms
        plan: pendingPlan,
      })
    } finally {
      clearInterval(timerInterval)
      setExecutingPlan(null)
    }
  }, [pendingPlan, threadId, executionProgress, onSaveMessage])

  // Handle plan step-by-step execution
  const handlePlanStepByStep = useCallback(() => {
    if (!pendingPlan) return
    console.log('[ChatRuntime] Step-by-step mode for plan:', pendingPlan.id)
    // TODO: Implement step-by-step mode with individual approvals
    // For now, just approve all
    handlePlanApproveAll()
  }, [pendingPlan, handlePlanApproveAll])

  // Handle plan cancel
  const handlePlanCancel = useCallback(async () => {
    if (pendingPlan) {
      console.log('[ChatRuntime] Cancelling pending plan:', pendingPlan.id)
      setPendingPlan(null)
      return
    }

    if (executingPlan && threadId) {
      console.log('[ChatRuntime] Cancelling executing plan:', executingPlan.id)
      cancelSignalRef.current.cancelled = true

      try {
        await fetch('/api/ai/agent/plan/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: executingPlan.id,
            threadId,
          }),
        })
      } catch (error) {
        console.error('[ChatRuntime] Cancel error:', error)
      }
    }
  }, [pendingPlan, executingPlan, threadId])

  // Create runtime with external store
  // Wrapper to handle readonly type conversion
  const handleSetMessages = useCallback((newMessages: readonly ThreadMessageLike[]) => {
    setMessages([...newMessages])
  }, [])

  // Identity converter - messages are already in ThreadMessageLike format
  const convertMessageForRuntime = useCallback((msg: ThreadMessageLike): ThreadMessageLike => msg, [])

  const runtime = useExternalStoreRuntime({
    messages,
    setMessages: handleSetMessages,
    convertMessage: convertMessageForRuntime,
    isRunning,
    onNew,
    onReload,
  })

  console.log('[ChatRuntime] Runtime created with', messages.length, 'messages')

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* ToolExecutionProvider must wrap tool UIs so they can access executeToolAction */}
      <ToolExecutionProvider teamId={teamId} workspaceId={workspaceId}>
        {/* Register all tool UIs with assistant-ui runtime */}
        <CreateWorkItemToolUI />
        <CreateTaskToolUI />
        <CreateDependencyToolUI />
        <CreateTimelineItemToolUI />
        <CreateInsightToolUI />
        <WebSearchToolUI />
        <ExtractDataToolUI />
        <AnalyzeFeedbackToolUI />

        {/* Pending Plan Card - shown when multi-step task plan awaits approval */}
        {pendingPlan && (
          <div className="px-4 py-3 border-b border-border/50">
            <TaskPlanCard
              plan={pendingPlan}
              onApproveAll={handlePlanApproveAll}
              onStepByStep={handlePlanStepByStep}
              onCancel={handlePlanCancel}
              isExecuting={false}
            />
          </div>
        )}

        {/* Execution Progress - shown when plan is executing */}
        {executingPlan && (
          <div className="px-4 py-3 border-b border-border/50">
            <ExecutionProgress
              plan={executingPlan}
              currentStepIndex={executionProgress}
              onCancel={handlePlanCancel}
              executionResult={executionResult || undefined}
              elapsedTime={executionElapsedTime}
            />
          </div>
        )}

        {/* Main thread */}
        <Thread onInsertPrompt={onInsertPrompt} />
      </ToolExecutionProvider>
    </AssistantRuntimeProvider>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChatInterfaceV2({
  teamId,
  workspaceId,
  workspaceName,
  className,
}: ChatInterfaceV2Props) {
  // Mode state (replaces model dropdown)
  const [mode, setMode] = useState<'chat' | 'agentic'>('chat')
  const [quickMode, setQuickMode] = useState(false)

  // Dev mode state
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [devOverride, setDevOverride] = useState<string | undefined>()
  const [routingInfo, setRoutingInfo] = useState<RoutingDebugInfo | null>(null)
  const [ragUsed, setRagUsed] = useState(false)
  const [ragItemCount, setRagItemCount] = useState(0)
  const [imageAnalyzed, setImageAnalyzed] = useState(false)
  const [isSlowModel, setIsSlowModel] = useState(false)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)

  // Check if user is dev mode
  const userIsDevMode = isDevMode(userEmail)

  // Fetch user email on mount
  useEffect(() => {
    async function fetchUserEmail() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    fetchUserEmail()
  }, [])

  // Thread management
  const {
    currentThread,
    currentThreadId,
    threads,
    threadsLoading,
    isLoadingMore,
    hasMore,
    selectThread,
    startNewThread,
    archiveThread,
    loadMore,
  } = useCurrentThread({ teamId, workspaceId })

  // Message persistence - load messages for selected thread
  const {
    messages: loadedMessages,
    isLoading: messagesLoading,
    hasLoaded: messagesHasLoaded,
    addMessage,
  } = useMessages({
    threadId: currentThreadId,
    enabled: !!currentThreadId,
  })

  // Handle tool shortcut - insert prompt template
  const handleInsertPrompt = useCallback((prompt: string) => {
    // TODO: Inject prompt into composer or send directly
    console.log('Insert prompt:', prompt)
  }, [])

  // Handle saving messages to Supabase
  // Now accepts threadId parameter to support auto-created threads
  const handleSaveMessage = useCallback(async (
    message: Omit<ChatMessage, 'id' | 'thread_id' | 'created_at'>,
    threadId: string
  ) => {
    console.log('[ChatInterfaceV2] Saving message to thread:', threadId, message.role)

    // Create client and save directly
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const newMessage = {
      id: Date.now().toString(),
      thread_id: threadId,
      ...message,
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(newMessage)
      .select()
      .single()

    if (error) {
      console.error('[ChatInterfaceV2] Save message error:', error)
      return null
    }

    console.log('[ChatInterfaceV2] Message saved:', data?.id)
    return data as ChatMessage
  }, [])

  // Handle thread creation callback
  const handleCreateThread = useCallback(async () => {
    console.log('[ChatInterfaceV2] Creating new thread...')
    const thread = await startNewThread()
    console.log('[ChatInterfaceV2] Thread created:', thread?.id)
    return thread
  }, [startNewThread])

  // Handle thread created - update parent state
  const handleThreadCreated = useCallback((threadId: string) => {
    console.log('[ChatInterfaceV2] Thread created callback, selecting:', threadId)
    selectThread(threadId)
  }, [selectThread])

  // Generate a stable key for the runtime - changes when thread changes
  // Using 'new' for null threadId ensures fresh runtime for new chats
  const runtimeKey = currentThreadId || 'new'

  // Show loading state until messages have been loaded
  // FIX: Use hasLoaded instead of messagesLoading to prevent race condition
  // where ChatRuntime mounts before messages are fetched
  const isInitializing = currentThreadId && !messagesHasLoaded

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Deep Thinking Indicator - shown when using slow model like DeepSeek */}
      {isSlowModel && (
        <ThinkingIndicator
          isThinking={true}
          variant="compact"
          className="mx-4 mt-2"
        />
      )}

      {/* Image Analysis Indicator */}
      {isAnalyzingImage && (
        <ImageAnalysisIndicator
          isAnalyzing={true}
          className="mx-4 mt-2"
        />
      )}

      {/* Settings panel - outside runtime so it persists across thread switches */}
      <SettingsPanel
        mode={mode}
        onModeChange={setMode}
        quickMode={quickMode}
        onQuickModeChange={setQuickMode}
        threads={threads}
        currentThreadId={currentThreadId}
        currentThread={currentThread}
        threadsLoading={threadsLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onSelectThread={selectThread}
        onNewThread={startNewThread}
        onArchiveThread={archiveThread}
        loadMore={loadMore}
        // Dev mode props
        userIsDevMode={userIsDevMode}
        routingInfo={routingInfo}
        devOverride={devOverride}
        onDevOverrideChange={setDevOverride}
        ragUsed={ragUsed}
        ragItemCount={ragItemCount}
        imageAnalyzed={imageAnalyzed}
      />

      {/* Chat runtime - key forces remount when thread changes */}
      <div className="flex-1 overflow-hidden">
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              <span className="text-sm">Loading messages...</span>
            </div>
          </div>
        ) : (
          <ChatRuntime
            key={runtimeKey}
            teamId={teamId}
            workspaceId={workspaceId}
            workspaceName={workspaceName || 'Workspace'}
            threadId={currentThreadId}
            mode={mode}
            quickMode={quickMode}
            devOverride={devOverride}
            onInsertPrompt={handleInsertPrompt}
            initialMessages={loadedMessages}
            onSaveMessage={handleSaveMessage}
            onCreateThread={handleCreateThread}
            onThreadCreated={handleThreadCreated}
            onRoutingInfo={setRoutingInfo}
            onSlowModel={setIsSlowModel}
            onRagUsed={(used, count) => { setRagUsed(used); setRagItemCount(count) }}
            onImageAnalyzed={setImageAnalyzed}
          />
        )}
      </div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ChatInterfaceV2

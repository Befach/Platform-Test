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

import { useRef, useState, useCallback, useEffect } from 'react'
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
} from '@assistant-ui/react'
import { useChatRuntime, AssistantChatTransport } from '@assistant-ui/react-ai-sdk'
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
import { getModelOptionsForUI } from '@/lib/ai/models-config'
import { ToolExecutionProvider } from '@/lib/ai/tool-execution-context'
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
    <MessagePrimitive.Root className="flex gap-3 py-4 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
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
    <MessagePrimitive.Root className="flex gap-3 py-4 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
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

function Thread({ onInsertPrompt }: { onInsertPrompt?: (prompt: string) => void }) {
  return (
    <ThreadPrimitive.Root className="flex flex-col h-full">
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

function SettingsPanel({
  selectedModel,
  onModelChange,
  quickMode,
  onQuickModeChange,
}: {
  selectedModel: string
  onModelChange: (model: string) => void
  quickMode: boolean
  onQuickModeChange: (enabled: boolean) => void
}) {
  const modelOptions = getModelOptionsForUI()

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/50">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Model:</span>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((option) => (
              <SelectItem key={option.id} value={option.id} className="text-xs">
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={quickMode ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onQuickModeChange(!quickMode)}
        >
          <Zap className={cn('h-3 w-3 mr-1', quickMode && 'text-yellow-400')} />
          Quick Mode
        </Button>
      </div>

      {selectedModel === 'auto' && (
        <Badge variant="secondary" className="text-xs">
          Auto-routing enabled
        </Badge>
      )}
    </div>
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
  // State for settings
  const [selectedModel, setSelectedModel] = useState('auto')
  const [quickMode, setQuickMode] = useState(false)

  // Ref for dynamic body values (passed to transport)
  const dynamicBodyRef = useRef({
    selectedModel,
    quickMode,
    workspaceContext: {
      workspaceId,
      workspaceName: workspaceName || 'Workspace',
    },
  })

  // Keep ref in sync
  useEffect(() => {
    dynamicBodyRef.current = {
      selectedModel,
      quickMode,
      workspaceContext: {
        workspaceId,
        workspaceName: workspaceName || 'Workspace',
      },
    }
  }, [selectedModel, quickMode, workspaceId, workspaceName])

  // Create runtime with custom transport
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: '/api/ai/unified-chat',
      body: () => ({
        model: dynamicBodyRef.current.selectedModel,
        quickMode: dynamicBodyRef.current.quickMode,
        workspaceContext: dynamicBodyRef.current.workspaceContext,
        teamId,
        workspaceId,
      }),
      headers: () => ({
        'X-Team-ID': teamId,
        'X-Workspace-ID': workspaceId,
      }),
    }),
  })

  // Handle tool shortcut - insert prompt template
  const handleInsertPrompt = useCallback((prompt: string) => {
    // TODO: Inject prompt into composer or send directly
    console.log('Insert prompt:', prompt)
  }, [])

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

        <div className={cn('flex flex-col h-full bg-background', className)}>
          {/* Settings panel */}
          <SettingsPanel
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            quickMode={quickMode}
            onQuickModeChange={setQuickMode}
          />

          {/* Main thread */}
          <div className="flex-1 overflow-hidden">
            <Thread onInsertPrompt={handleInsertPrompt} />
          </div>
        </div>
      </ToolExecutionProvider>
    </AssistantRuntimeProvider>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ChatInterfaceV2

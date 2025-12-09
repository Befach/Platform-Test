/**
 * AI Page Client Component
 *
 * Client-side wrapper for the AI Assistant page.
 * Uses assistant-ui based chat interface with tool confirmation support.
 *
 * Architecture:
 * - Full-width chat interface (assistant-ui)
 * - ToolShortcutBar above input for quick tool access
 * - Inline confirmation cards for agentic actions
 * - Human-in-the-loop tool execution via /api/ai/agent/execute
 * - Thread persistence with Supabase
 */

'use client'

import { ChatInterfaceV2 } from '@/components/ai/chat-interface-v2'
import { Badge } from '@/components/ui/badge'
import { Bot, Sparkles, History, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AIPageClientProps {
  workspaceId: string
  teamId: string
  workspaceName: string
  workspacePhase?: string
  teamName: string
  userRole: string
}

export function AIPageClient({
  workspaceId,
  teamId,
  workspaceName,
  workspacePhase,
  teamName,
  userRole,
}: AIPageClientProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                AI Assistant
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  Chat-First
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                {workspaceName} • {teamName}
                {workspacePhase && (
                  <span className="ml-2">
                    • <span className="capitalize">{workspacePhase}</span> Phase
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {userRole}
            </Badge>

            {/* History Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Action History</SheetTitle>
                  <SheetDescription>
                    Recent AI actions and their results
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                  <div className="space-y-3 pr-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No actions yet</p>
                      <p className="text-xs">
                        Actions will appear here after confirmation
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Settings Button (placeholder for future) */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Full-width Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterfaceV2
          teamId={teamId}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          className="h-full"
        />
      </div>
    </div>
  )
}

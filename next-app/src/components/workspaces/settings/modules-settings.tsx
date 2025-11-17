'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

const MODULES = [
  {
    id: 'research',
    name: 'AI Research',
    icon: '🔍',
    description: 'AI-powered research assistant with web search and knowledge base',
    tier: 'free',
  },
  {
    id: 'mind_map',
    name: 'Mind Map',
    icon: '🗺️',
    description: 'Visual brainstorming canvas with ReactFlow nodes',
    tier: 'free',
  },
  {
    id: 'features',
    name: 'Features',
    icon: '✨',
    description: 'Feature management with timeline items and dependencies',
    tier: 'free',
  },
  {
    id: 'dependencies',
    name: 'Dependencies',
    icon: '🔗',
    description: 'Dependency graph with 4 link types and critical path analysis',
    tier: 'free',
  },
  {
    id: 'review',
    name: 'Review',
    icon: '💬',
    description: 'External feedback system with invite-based and public links',
    tier: 'pro',
  },
  {
    id: 'execution',
    name: 'Execution',
    icon: '⚡',
    description: 'Project execution tracking with team assignment and milestones',
    tier: 'free',
  },
  {
    id: 'collaboration',
    name: 'Collaboration',
    icon: '👥',
    description: 'Real-time collaboration with live cursors and activity feed',
    tier: 'pro',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    icon: '📅',
    description: 'Gantt timeline view with drag-to-reschedule',
    tier: 'free',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: '📊',
    description: 'Metrics dashboard with 4 pre-built dashboards',
    tier: 'free',
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    icon: '🤖',
    description: 'AI chat assistant with agentic mode and tool calling',
    tier: 'free',
  },
]

interface ModulesSettingsProps {
  workspace: {
    id: string
    enabled_modules: string[] | null
  }
  teamPlan: string
}

export function ModulesSettings({ workspace, teamPlan }: ModulesSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [enabledModules, setEnabledModules] = useState<string[]>(
    workspace.enabled_modules || []
  )
  const [saved, setSaved] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const isPro = teamPlan === 'pro'

  const toggleModule = (moduleId: string, moduleTier: string) => {
    // Check if module requires Pro
    if (moduleTier === 'pro' && !isPro) {
      alert('This module requires a Pro plan. Please upgrade to enable it.')
      return
    }

    setEnabledModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          enabled_modules: enabledModules,
        })
        .eq('id', workspace.id)

      if (error) throw error

      setSaved(true)
      router.refresh()

      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error('Error updating modules:', error)
      alert(error.message || 'Failed to update modules')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Configuration</CardTitle>
        <CardDescription>
          Enable or disable features and tools for this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {MODULES.map((module) => {
              const isEnabled = enabledModules.includes(module.id)
              const requiresPro = module.tier === 'pro'
              const isLocked = requiresPro && !isPro

              return (
                <div
                  key={module.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                    isLocked
                      ? 'bg-slate-50 border-slate-200'
                      : isEnabled
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-3xl">{module.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{module.name}</h4>
                      {requiresPro && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Lock className="w-3 h-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                      {isEnabled && !isLocked && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Enabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                    {isLocked && (
                      <p className="text-xs text-yellow-700 mt-2">
                        Upgrade to Pro to unlock this module
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleModule(module.id, module.tier)}
                    disabled={loading || isLocked}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Module Configuration'
              )}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">✓ Saved successfully</span>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Enabled Modules:</strong> {enabledModules.length} / {MODULES.length}
            </p>
            <p className="text-xs">
              💡 Tip: Only enable modules you plan to use to keep your workspace clean and focused.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

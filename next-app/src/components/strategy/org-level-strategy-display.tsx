'use client'

/**
 * OrgLevelStrategyDisplay Component
 *
 * Full tree view for team/organization strategy page showing:
 * - Complete hierarchy (Pillar → Objective → Key Result → Initiative)
 * - User stories section (expandable list)
 * - Case studies section (links/cards)
 * - User examples section
 * - High-level metrics and progress
 * - Team-wide alignment percentages
 *
 * This is the ORGANIZATION-LEVEL view (comprehensive tree + context)
 * as opposed to the work-item-level view (compact alignment only)
 */

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Flag,
  Target,
  TrendingUp,
  Lightbulb,
  Users,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  Link2,
  BarChart3,
} from 'lucide-react'
import { StrategyTree } from './strategy-tree'
import { StrategyProgressCompact } from './strategy-progress'
import {
  getStrategyTypeLabel,
  STRATEGY_TYPE_COLORS,
  getDisplayProgress,
} from '@/lib/types/strategy'
import type { StrategyWithChildren, StrategyType } from '@/lib/types/strategy'

interface OrgLevelStrategyDisplayProps {
  strategies: StrategyWithChildren[]
  onSelectStrategy?: (strategy: StrategyWithChildren) => void
  onEditStrategy?: (strategy: StrategyWithChildren) => void
  onDeleteStrategy?: (strategy: StrategyWithChildren) => void
  onAddChild?: (parent: StrategyWithChildren) => void
  showUserStories?: boolean
  showCaseStudies?: boolean
  showMetrics?: boolean
  className?: string
}

export function OrgLevelStrategyDisplay({
  strategies,
  onSelectStrategy,
  onEditStrategy,
  onDeleteStrategy,
  onAddChild,
  showUserStories = true,
  showCaseStudies = true,
  showMetrics = true,
  className,
}: OrgLevelStrategyDisplayProps) {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('tree')

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    let totalStrategies = 0
    let totalAligned = 0
    let progressSum = 0
    const byType: Record<StrategyType, number> = {
      pillar: 0,
      objective: 0,
      key_result: 0,
      initiative: 0,
    }

    const traverse = (items: StrategyWithChildren[]) => {
      items.forEach((item) => {
        totalStrategies++
        byType[item.type]++
        totalAligned += item.aligned_work_items_count || 0
        progressSum += getDisplayProgress(item)
        if (item.children.length > 0) {
          traverse(item.children)
        }
      })
    }

    traverse(strategies)

    return {
      total: totalStrategies,
      aligned: totalAligned,
      avgProgress: totalStrategies > 0 ? Math.round(progressSum / totalStrategies) : 0,
      byType,
    }
  }, [strategies])

  // Collect all user stories, case studies, and examples from pillars
  const contextData = useMemo(() => {
    const userStories: { pillarTitle: string; stories: string[] }[] = []
    const caseStudies: { pillarTitle: string; studies: string[] }[] = []
    const userExamples: { pillarTitle: string; examples: string[] }[] = []

    strategies.forEach((pillar) => {
      if (pillar.type === 'pillar') {
        if (pillar.user_stories?.length > 0) {
          userStories.push({ pillarTitle: pillar.title, stories: pillar.user_stories })
        }
        if (pillar.case_studies?.length > 0) {
          caseStudies.push({ pillarTitle: pillar.title, studies: pillar.case_studies })
        }
        if (pillar.user_examples?.length > 0) {
          userExamples.push({ pillarTitle: pillar.title, examples: pillar.user_examples })
        }
      }
    })

    return { userStories, caseStudies, userExamples }
  }, [strategies])

  const handleSelect = (strategy: StrategyWithChildren) => {
    setSelectedStrategyId(strategy.id)
    onSelectStrategy?.(strategy)
  }

  if (strategies.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Flag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium mb-2">No Strategies Yet</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Create your first strategic pillar to start building your organization&apos;s
          strategy hierarchy.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Metrics Overview */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Total Strategies"
            value={metrics.total}
            color="text-primary"
          />
          <MetricCard
            icon={<Link2 className="h-4 w-4" />}
            label="Aligned Work Items"
            value={metrics.aligned}
            color="text-blue-600"
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Avg Progress"
            value={`${metrics.avgProgress}%`}
            color="text-green-600"
          />
          <MetricCard
            icon={<Flag className="h-4 w-4" />}
            label="Active Pillars"
            value={metrics.byType.pillar}
            color="text-indigo-600"
          />
        </div>
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tree" className="gap-2">
            <Target className="h-4 w-4" />
            Strategy Tree
          </TabsTrigger>
          {showUserStories && contextData.userStories.length > 0 && (
            <TabsTrigger value="stories" className="gap-2">
              <Users className="h-4 w-4" />
              User Stories
              <Badge variant="secondary" className="ml-1 text-xs">
                {contextData.userStories.reduce((acc, p) => acc + p.stories.length, 0)}
              </Badge>
            </TabsTrigger>
          )}
          {showCaseStudies && contextData.caseStudies.length > 0 && (
            <TabsTrigger value="cases" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Case Studies
              <Badge variant="secondary" className="ml-1 text-xs">
                {contextData.caseStudies.reduce((acc, p) => acc + p.studies.length, 0)}
              </Badge>
            </TabsTrigger>
          )}
          {contextData.userExamples.length > 0 && (
            <TabsTrigger value="examples" className="gap-2">
              <FileText className="h-4 w-4" />
              Examples
              <Badge variant="secondary" className="ml-1 text-xs">
                {contextData.userExamples.reduce((acc, p) => acc + p.examples.length, 0)}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tree Tab */}
        <TabsContent value="tree" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <StrategyTree
                strategies={strategies}
                selectedId={selectedStrategyId}
                onSelect={handleSelect}
                onEdit={onEditStrategy}
                onDelete={onDeleteStrategy}
                onAddChild={onAddChild}
                defaultExpanded
                enableDragDrop={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Stories Tab */}
        {showUserStories && (
          <TabsContent value="stories" className="mt-4">
            <div className="space-y-4">
              {contextData.userStories.map((pillar) => (
                <ContextSection
                  key={pillar.pillarTitle}
                  pillarTitle={pillar.pillarTitle}
                  items={pillar.stories}
                  icon={<Users className="h-4 w-4" />}
                  itemLabel="User Story"
                />
              ))}
            </div>
          </TabsContent>
        )}

        {/* Case Studies Tab */}
        {showCaseStudies && (
          <TabsContent value="cases" className="mt-4">
            <div className="space-y-4">
              {contextData.caseStudies.map((pillar) => (
                <ContextSection
                  key={pillar.pillarTitle}
                  pillarTitle={pillar.pillarTitle}
                  items={pillar.studies}
                  icon={<BookOpen className="h-4 w-4" />}
                  itemLabel="Case Study"
                />
              ))}
            </div>
          </TabsContent>
        )}

        {/* Examples Tab */}
        <TabsContent value="examples" className="mt-4">
          <div className="space-y-4">
            {contextData.userExamples.map((pillar) => (
              <ContextSection
                key={pillar.pillarTitle}
                pillarTitle={pillar.pillarTitle}
                items={pillar.examples}
                icon={<FileText className="h-4 w-4" />}
                itemLabel="Example"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Type Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Strategy Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {(['pillar', 'objective', 'key_result', 'initiative'] as StrategyType[]).map(
              (type) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: STRATEGY_TYPE_COLORS[type] }}
                  />
                  <span className="text-sm">
                    {metrics.byType[type]} {getStrategyTypeLabel(type)}
                    {metrics.byType[type] !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Metric card for overview
 */
function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={color}>{icon}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Collapsible section for user stories/case studies/examples
 */
function ContextSection({
  pillarTitle,
  items,
  icon,
  itemLabel,
}: {
  pillarTitle: string
  items: string[]
  icon: React.ReactNode
  itemLabel: string
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${STRATEGY_TYPE_COLORS.pillar}20` }}
                >
                  <Flag
                    className="h-4 w-4"
                    style={{ color: STRATEGY_TYPE_COLORS.pillar }}
                  />
                </div>
                <CardTitle className="text-sm font-medium">{pillarTitle}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {items.length} {itemLabel}
                  {items.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1 shrink-0">{icon}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

/**
 * Compact version for sidebars or smaller spaces
 */
export function OrgLevelStrategyDisplayCompact({
  strategies,
  onSelectStrategy,
  className,
}: Pick<OrgLevelStrategyDisplayProps, 'strategies' | 'onSelectStrategy' | 'className'>) {
  return (
    <OrgLevelStrategyDisplay
      strategies={strategies}
      onSelectStrategy={onSelectStrategy}
      showUserStories={false}
      showCaseStudies={false}
      showMetrics={false}
      className={className}
    />
  )
}

'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  TrendingUp,
  Clock,
  Activity,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import type { CriticalPathNode } from '@/lib/algorithms/critical-path'
import type { Cycle, CycleFix } from '@/lib/algorithms/cycle-detection'
import type { WorkItem } from '@/lib/types/work-items'
import { getItemIcon } from '@/lib/constants/work-item-types'

interface CriticalPathPanelProps {
  isOpen: boolean
  onClose: () => void
  analysis: AnalysisResult | null
  isLoading: boolean
  onWorkItemClick?: (workItemId: string) => void
  onApplyFix?: (fix: CycleFix) => void
}

interface AnalysisResult {
  hasCycles: boolean
  cycles: Cycle[]
  totalCycles: number
  affectedWorkItems: string[]
  criticalPath: string[]
  projectDuration: number
  nodes: CriticalPathNode[]
  bottlenecks: string[]
  healthScore: number
  warnings: string[]
}

export function CriticalPathPanel({
  isOpen,
  onClose,
  analysis,
  isLoading,
  onWorkItemClick,
  onApplyFix,
}: CriticalPathPanelProps) {
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null)

  if (!isOpen) return null

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white border-l shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Dependency Analysis</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!isLoading && !analysis && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Click "Analyze" to calculate the critical path and detect cycles.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && analysis && (
          <Tabs defaultValue={analysis.hasCycles ? 'cycles' : 'critical'} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="critical">Critical Path</TabsTrigger>
              <TabsTrigger value="cycles">
                Cycles
                {analysis.totalCycles > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {analysis.totalCycles}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
            </TabsList>

            {/* Critical Path Tab */}
            <TabsContent value="critical" className="space-y-4">
              {analysis.hasCycles ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cannot calculate critical path due to circular dependencies. Please
                    resolve cycles first.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Project Stats */}
                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Project Duration
                        </span>
                        <span className="text-2xl font-bold">
                          {analysis.projectDuration} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Critical Path Items
                        </span>
                        <span className="text-lg font-semibold">
                          {analysis.criticalPath.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Bottlenecks</span>
                        <span className="text-lg font-semibold">
                          {analysis.bottlenecks.length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Critical Path */}
                  {analysis.criticalPath.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        Critical Path
                      </h4>
                      <div className="space-y-2">
                        {analysis.criticalPath.map((itemId, index) => {
                          const node = analysis.nodes.find((n) => n.workItemId === itemId)
                          if (!node) return null

                          return (
                            <div
                              key={itemId}
                              className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded cursor-pointer hover:bg-red-100"
                              onClick={() => onWorkItemClick?.(itemId)}
                            >
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs font-medium text-red-600">
                                  {index + 1}
                                </span>
                                <ChevronRight className="h-3 w-3 text-red-600" />
                                <span className="text-sm">
                                  {getItemIcon(node.workItem.type)}
                                </span>
                                <span className="text-sm font-medium truncate">
                                  {node.workItem.name}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {node.earliestStart}d
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bottlenecks */}
                  {analysis.bottlenecks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Bottlenecks
                      </h4>
                      <div className="space-y-2">
                        {analysis.bottlenecks.map((itemId) => {
                          const node = analysis.nodes.find((n) => n.workItemId === itemId)
                          if (!node) return null

                          return (
                            <div
                              key={itemId}
                              className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded cursor-pointer hover:bg-orange-100"
                              onClick={() => onWorkItemClick?.(itemId)}
                            >
                              <span className="text-sm">
                                {getItemIcon(node.workItem.type)}
                              </span>
                              <span className="text-sm font-medium truncate flex-1">
                                {node.workItem.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {node.dependencyCount + node.dependentCount} links
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Cycles Tab */}
            <TabsContent value="cycles" className="space-y-4">
              {analysis.hasCycles ? (
                <>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {analysis.totalCycles} circular{' '}
                      {analysis.totalCycles === 1 ? 'dependency' : 'dependencies'} detected.
                      These must be resolved for project to proceed.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {analysis.cycles.map((cycle, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer ${
                          selectedCycle === index ? 'ring-2 ring-red-500' : ''
                        }`}
                        onClick={() => setSelectedCycle(index)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Cycle #{index + 1}</CardTitle>
                            <Badge
                              variant={
                                cycle.severity === 'high'
                                  ? 'destructive'
                                  : cycle.severity === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {cycle.severity}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Cycle Path */}
                          <div className="space-y-1">
                            {cycle.workItems.map((item, idx) => (
                              <div key={item.id} className="flex items-center gap-2 text-sm">
                                <span>{getItemIcon(item.type)}</span>
                                <span className="truncate">{item.name}</span>
                                {idx < cycle.workItems.length - 1 && (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </div>
                            ))}
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>Back to {cycle.workItems[0].name}</span>
                            </div>
                          </div>

                          {/* Suggested Fixes */}
                          {selectedCycle === index && cycle.suggestedFixes.length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground">
                                Suggested Fixes:
                              </p>
                              {cycle.suggestedFixes.slice(0, 2).map((fix, fixIdx) => (
                                <div
                                  key={fixIdx}
                                  className="p-2 bg-muted rounded space-y-1"
                                >
                                  <p className="text-xs font-medium">{fix.reason}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {fix.impact}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-1"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onApplyFix?.(fix)
                                    }}
                                  >
                                    Apply Fix
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    No circular dependencies detected. Your dependency graph is healthy!
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Health Tab */}
            <TabsContent value="health" className="space-y-4">
              {/* Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Project Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 56 * (1 - analysis.healthScore / 100)
                          }`}
                          className={
                            analysis.healthScore >= 70
                              ? 'text-green-600'
                              : analysis.healthScore >= 40
                              ? 'text-orange-600'
                              : 'text-red-600'
                          }
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold">{analysis.healthScore}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warnings */}
              {analysis.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Warnings</h4>
                  {analysis.warnings.map((warning, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{analysis.nodes.length}</p>
                      <p className="text-xs text-muted-foreground">Total Items</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{analysis.criticalPath.length}</p>
                      <p className="text-xs text-muted-foreground">Critical Items</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

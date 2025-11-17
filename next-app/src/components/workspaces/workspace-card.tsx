'use client'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

interface WorkspaceCardProps {
  workspace: {
    id: string
    name: string
    description: string | null
    phase: string
    enabled_modules: string[] | null
    created_at: string
  }
}

const PHASE_COLORS: Record<string, string> = {
  research: 'bg-blue-100 text-blue-800',
  planning: 'bg-purple-100 text-purple-800',
  review: 'bg-yellow-100 text-yellow-800',
  execution: 'bg-green-100 text-green-800',
  testing: 'bg-orange-100 text-orange-800',
  metrics: 'bg-pink-100 text-pink-800',
  complete: 'bg-gray-100 text-gray-800',
}

const PHASE_LABELS: Record<string, string> = {
  research: 'Research',
  planning: 'Planning',
  review: 'Review',
  execution: 'Execution',
  testing: 'Testing',
  metrics: 'Metrics',
  complete: 'Complete',
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const phaseColor = PHASE_COLORS[workspace.phase] || 'bg-gray-100 text-gray-800'
  const phaseLabel = PHASE_LABELS[workspace.phase] || workspace.phase

  return (
    <Link href={`/workspaces/${workspace.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{workspace.name}</CardTitle>
              {workspace.description && (
                <CardDescription className="mt-2">
                  {workspace.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className={phaseColor}>{phaseLabel}</Badge>
            {workspace.enabled_modules && workspace.enabled_modules.length > 0 && (
              <Badge variant="outline">
                {workspace.enabled_modules.length} modules
              </Badge>
            )}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Created {new Date(workspace.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

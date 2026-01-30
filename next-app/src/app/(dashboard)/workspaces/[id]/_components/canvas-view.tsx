'use client'

/**
 * Canvas View Component
 *
 * Placeholder component that redirects users to the new BlockSuite canvas system.
 * The old ReactFlow-based canvas has been deprecated in favor of BlockSuite.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Map } from 'lucide-react'

interface WorkspaceData {
  id: string
  team_id: string
}

interface WorkItemData {
  id: string
  name?: string
  type?: string
  [key: string]: unknown
}

interface LinkedItemData {
  id: string
  source_id: string
  target_id: string
  [key: string]: unknown
}

interface CanvasViewProps {
  workspace: WorkspaceData
  workItems: WorkItemData[]
  linkedItems: LinkedItemData[]
}

export function CanvasView({ workspace, workItems: _workItems, linkedItems: _linkedItems }: CanvasViewProps) {
  return (
    <div className="h-[calc(100vh-12rem)] w-full rounded-lg border bg-white shadow-sm flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Map className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Canvas Has Moved</CardTitle>
          <CardDescription>
            The canvas feature has been upgraded to use BlockSuite for better performance and collaboration.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href={`/workspaces/${workspace.id}/canvas`}>
            <Button className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Go to Canvas
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

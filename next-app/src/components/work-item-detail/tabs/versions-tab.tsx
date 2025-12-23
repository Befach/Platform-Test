'use client'

/**
 * Versions Tab Component
 *
 * Displays version history for a work item, allowing navigation
 * between different versions and creation of new enhanced versions.
 *
 * @module components/work-item-detail/tabs/versions-tab
 */

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkItemDetailContext } from '../shared/detail-context'
import { VersionHistory } from '@/components/work-items/version-history'
import { type WorkItemType } from '@/lib/constants/workspace-phases'

/**
 * Versions tab content - displays version history and allows creating new versions
 */
export function VersionsTab() {
  const router = useRouter()
  const { workItem, phase } = useWorkItemDetailContext()

  const handleVersionCreated = (newVersionId: string) => {
    // Navigate to the new version
    router.push(`/work-items/${newVersionId}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            Track the evolution of this work item through its enhanced versions.
            Each version builds upon the previous, preserving context while allowing
            fresh development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VersionHistory
            workItemId={workItem.id}
            currentVersion={workItem.version || 1}
            enhancesWorkItemId={workItem.enhances_work_item_id}
            type={(workItem.type || 'feature') as WorkItemType}
            phase={phase}
            teamId={workItem.team_id}
            onVersionCreated={handleVersionCreated}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default VersionsTab

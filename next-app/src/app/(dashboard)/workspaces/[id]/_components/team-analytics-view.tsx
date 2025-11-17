'use client'

import { PhaseLeadDashboard } from '@/components/team/phase-lead-dashboard'

interface TeamAnalyticsViewProps {
  workspace: any
}

export function TeamAnalyticsView({ workspace }: TeamAnalyticsViewProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Team Phase Analytics</h2>
        <p className="text-muted-foreground">
          Overview of phase lead distribution and team coverage for this workspace
        </p>
      </div>

      <PhaseLeadDashboard workspaceId={workspace.id} />
    </div>
  )
}

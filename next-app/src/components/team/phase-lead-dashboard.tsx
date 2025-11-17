'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, AlertTriangle, CheckCircle2, Users, Crown, TrendingUp } from 'lucide-react'
import { PHASE_CONFIG, type WorkspacePhase } from '@/lib/constants/workspace-phases'
import { Progress } from '@/components/ui/progress'

interface PhaseLeadDashboardProps {
  workspaceId: string
}

interface PhaseAnalyticsData {
  workspace_id: string
  workspace_name: string
  summary: {
    total_phases: number
    phases_with_leads: number
    coverage_percentage: number
    total_leads: number
    total_contributors: number
    total_assignments: number
  }
  lead_counts: Record<WorkspacePhase, number>
  contributor_counts: Record<WorkspacePhase, number>
  total_member_counts: Record<WorkspacePhase, number>
  phases_needing_attention: Array<{
    phase: WorkspacePhase
    lead_count: number
    issue: 'no_leads' | 'too_many_leads'
  }>
  phase_breakdown: Array<{
    phase: WorkspacePhase
    leads: number
    contributors: number
    total_members: number
    lead_details: Array<{
      user_id: string
      email: string
      name: string | null
      assigned_at: string
    }>
    status: 'needs_lead' | 'too_many_leads' | 'optimal' | 'adequate'
  }>
}

export function PhaseLeadDashboard({ workspaceId }: PhaseLeadDashboardProps) {
  const { data: analyticsResponse, isLoading, error } = useQuery({
    queryKey: ['phase-analytics', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/team/phase-analytics?workspace_id=${workspaceId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch phase analytics')
      }
      const data = await response.json()
      return data as { data: PhaseAnalyticsData; success: boolean }
    },
  })

  const analytics = analyticsResponse?.data

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'adequate':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'needs_lead':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'too_many_leads':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'optimal':
        return '✓ Optimal (1 lead)'
      case 'adequate':
        return '✓ Adequate (2 leads)'
      case 'needs_lead':
        return '⚠ Needs Lead'
      case 'too_many_leads':
        return '⚠ Too Many Leads'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load phase analytics. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Phase Coverage</CardDescription>
            <CardTitle className="text-2xl">{analytics.summary.coverage_percentage}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={analytics.summary.coverage_percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {analytics.summary.phases_with_leads} of {analytics.summary.total_phases} phases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Leads</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              {analytics.summary.total_leads}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across all {analytics.summary.total_phases} phases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Contributors</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {analytics.summary.total_contributors}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active contributors with edit access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Assignments</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              {analytics.summary.total_assignments}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total phase access assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Phases Needing Attention */}
      {analytics.phases_needing_attention.length > 0 && (
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Phases Needing Attention</AlertTitle>
          <AlertDescription className="text-amber-800">
            <div className="mt-2 space-y-1">
              {analytics.phases_needing_attention.map((item) => {
                const phaseConfig = PHASE_CONFIG[item.phase]
                return (
                  <div key={item.phase} className="flex items-center gap-2">
                    <span className="text-lg">{phaseConfig.icon}</span>
                    <span className="font-medium">{phaseConfig.name}:</span>
                    <span>
                      {item.issue === 'no_leads'
                        ? 'No leads assigned'
                        : `${item.lead_count} leads (recommended: 1-2)`}
                    </span>
                  </div>
                )
              })}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Phase Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phase-by-Phase Breakdown</CardTitle>
          <CardDescription>
            Detailed view of leads, contributors, and status for each phase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.phase_breakdown.map((phase) => {
            const phaseConfig = PHASE_CONFIG[phase.phase]
            return (
              <div key={phase.phase} className="border rounded-lg p-4 space-y-3">
                {/* Phase Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: phaseConfig.color }}
                    />
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {phaseConfig.icon} {phaseConfig.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {phase.total_members} total member{phase.total_members !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(phase.status)}>
                    {getStatusLabel(phase.status)}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Leads</p>
                    <p className="font-semibold text-lg flex items-center gap-1">
                      <Crown className="h-4 w-4 text-purple-600" />
                      {phase.leads}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Contributors</p>
                    <p className="font-semibold text-lg flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      {phase.contributors}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Members</p>
                    <p className="font-semibold text-lg">{phase.total_members}</p>
                  </div>
                </div>

                {/* Lead Details */}
                {phase.lead_details.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Phase Leads:</p>
                    <div className="flex flex-wrap gap-2">
                      {phase.lead_details.map((lead) => {
                        const displayName = lead.name || lead.email.split('@')[0]
                        const initials = getInitials(lead.name, lead.email)
                        return (
                          <div
                            key={lead.user_id}
                            className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-md px-2 py-1"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{displayName}</span>
                            <Crown className="h-3 w-3 text-purple-600" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* No Leads Warning */}
                {phase.leads === 0 && (
                  <Alert variant="default" className="bg-red-50 border-red-200 mt-2">
                    <AlertDescription className="text-red-800 text-sm">
                      This phase has no assigned leads. Consider assigning at least one team member as a phase lead.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Phase Lead Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Optimal phases (1 lead):</span>
              <span className="font-semibold">
                {analytics.phase_breakdown.filter((p) => p.status === 'optimal').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Adequate phases (2 leads):</span>
              <span className="font-semibold">
                {analytics.phase_breakdown.filter((p) => p.status === 'adequate').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phases needing leads:</span>
              <span className="font-semibold text-red-600">
                {analytics.phase_breakdown.filter((p) => p.status === 'needs_lead').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phases with too many leads:</span>
              <span className="font-semibold text-amber-600">
                {analytics.phase_breakdown.filter((p) => p.status === 'too_many_leads').length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

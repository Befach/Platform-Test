import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  Target,
  AlertCircle,
} from 'lucide-react'

interface WorkspaceStatsGridProps {
  totalFeatures: number
  completedFeatures: number
  inProgressFeatures: number
  completionPercentage: number
  teamSize: number
}

export function WorkspaceStatsGrid({
  totalFeatures,
  completedFeatures,
  inProgressFeatures,
  completionPercentage,
  teamSize,
}: WorkspaceStatsGridProps) {
  // Determine progress status
  const getProgressStatus = () => {
    if (completionPercentage === 0) return { color: 'text-slate-500', label: 'Not Started' }
    if (completionPercentage === 100) return { color: 'text-green-600', label: 'Complete' }
    if (completionPercentage >= 75) return { color: 'text-blue-600', label: 'On Track' }
    if (completionPercentage >= 50) return { color: 'text-yellow-600', label: 'In Progress' }
    return { color: 'text-orange-600', label: 'Just Started' }
  }

  const progressStatus = getProgressStatus()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Features Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Features</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalFeatures}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalFeatures === 0
              ? 'No features yet'
              : totalFeatures === 1
              ? '1 feature created'
              : `${totalFeatures} features created`}
          </p>
        </CardContent>
      </Card>

      {/* Completion Percentage Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className={`text-3xl font-bold ${progressStatus.color}`}>
              {completionPercentage}%
            </div>
            <Badge
              variant="secondary"
              className="text-xs"
            >
              {progressStatus.label}
            </Badge>
          </div>
          <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completedFeatures} of {totalFeatures} completed
          </p>
        </CardContent>
      </Card>

      {/* In Progress Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{inProgressFeatures}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {inProgressFeatures === 0
              ? 'No active work'
              : inProgressFeatures === 1
              ? '1 feature in progress'
              : `${inProgressFeatures} features active`}
          </p>
          {inProgressFeatures > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Active development</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Size Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Size</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{teamSize || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {(teamSize || 0) === 0
              ? 'No team members'
              : (teamSize || 0) === 1
              ? '1 team member'
              : `${teamSize} team members`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

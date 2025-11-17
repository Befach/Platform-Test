import { ComingSoonModule } from '@/components/workspaces/coming-soon-module'

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ComingSoonModule
      workspaceId={id}
      moduleName="Analytics"
      moduleIcon="📊"
      description="Metrics dashboard with 4 pre-built dashboards"
      plannedFeatures={[
        '4 pre-built dashboards: Overview, Team, Timeline, Business Value',
        'Custom dashboard builder with drag-and-drop widgets (Pro)',
        '10+ chart types: Bar, Line, Pie, Gauge, Heatmap, Scatter',
        'Feature velocity tracking (features/week)',
        'Team performance metrics',
        'Expected vs Actual success metrics',
        'Export reports as PDF or CSV',
      ]}
    />
  )
}

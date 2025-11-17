import { ComingSoonModule } from '@/components/workspaces/coming-soon-module'

export default async function ExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ComingSoonModule
      workspaceId={id}
      moduleName="Execution"
      moduleIcon="⚡"
      description="Project execution tracking with team assignment and milestones"
      plannedFeatures={[
        'Assign features to team members',
        'Track feature status in real-time',
        'Create execution milestones and sprints',
        'View team workload and capacity',
        'Set due dates and reminders',
        'Track blockers and risks',
        'Generate progress reports',
      ]}
    />
  )
}

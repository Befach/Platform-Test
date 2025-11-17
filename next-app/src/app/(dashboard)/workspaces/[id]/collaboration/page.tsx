import { ComingSoonModule } from '@/components/workspaces/coming-soon-module'

export default async function CollaborationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ComingSoonModule
      workspaceId={id}
      moduleName="Collaboration"
      moduleIcon="👥"
      description="Real-time collaboration with live cursors and activity feed (Pro)"
      plannedFeatures={[
        'See who\'s viewing and editing in real-time',
        'Live cursors showing team member positions',
        'Real-time feature updates via Supabase Realtime',
        'Team activity feed and notifications',
        'Comment threads on features',
        'Mention team members with @ mentions',
        '@channel notifications for urgent updates',
      ]}
    />
  )
}

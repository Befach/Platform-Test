import { ComingSoonModule } from '@/components/workspaces/coming-soon-module'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ComingSoonModule
      workspaceId={id}
      moduleName="Review"
      moduleIcon="💬"
      description="External feedback system with invite-based and public links (Pro)"
      plannedFeatures={[
        'Create shareable review links (public, invite-only, iframe embeds)',
        'Collect stakeholder feedback on features',
        'Voting and commenting system',
        'Email invitations with custom messages',
        'Track who viewed and commented',
        'Export feedback as reports',
        'Integrate feedback into feature planning',
      ]}
    />
  )
}

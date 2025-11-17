import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceGeneralSettings } from '@/components/workspaces/settings/workspace-general-settings'
import { ModulesSettings } from '@/components/workspaces/settings/modules-settings'
import { FeaturesModuleSettings } from '@/components/workspaces/settings/features-module-settings'

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Get workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !workspace) {
    notFound()
  }

  // Get team info
  const { data: team } = await supabase
    .from('teams')
    .select('name, plan')
    .eq('id', workspace.team_id)
    .single()

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <WorkspaceGeneralSettings workspace={workspace} />
      </TabsContent>

      <TabsContent value="modules" className="space-y-4">
        <ModulesSettings workspace={workspace} teamPlan={team?.plan || 'free'} />
      </TabsContent>

      <TabsContent value="features" className="space-y-4">
        <FeaturesModuleSettings workspaceId={workspace.id} />
      </TabsContent>

      <TabsContent value="permissions" className="space-y-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">Team Permissions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage team member access and roles for this workspace.
          </p>
          <p className="text-sm text-yellow-600">Coming soon</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

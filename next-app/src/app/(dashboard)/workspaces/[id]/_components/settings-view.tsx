'use client';

import { WorkspaceGeneralSettings } from '@/components/workspaces/settings/workspace-general-settings';

interface SettingsViewProps {
  workspace: any;
  team: any;
  currentUserId: string;
}

export function SettingsView({
  workspace,
  team,
  currentUserId,
}: SettingsViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-muted-foreground">
            Manage workspace configuration
          </p>
        </div>
      </div>

      {/* Settings Content */}
      <WorkspaceGeneralSettings workspace={workspace} currentUserId={currentUserId} />
    </div>
  );
}

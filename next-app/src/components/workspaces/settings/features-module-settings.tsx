'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings2 } from 'lucide-react'

interface FeaturesModuleSettingsProps {
  workspaceId: string
}

export function FeaturesModuleSettings({ workspaceId }: FeaturesModuleSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Features Module Settings
          </CardTitle>
          <CardDescription>
            Configure default settings and preferences for the Features module
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Coming Soon Section */}
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <Settings2 className="w-6 h-6 text-yellow-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Feature-specific settings will be available here soon. This will include:
                </p>
              </div>
            </div>
          </div>

          {/* Planned Features */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground">Planned Settings:</h4>

            <div className="grid gap-3">
              <SettingItem
                title="Default Status"
                description="Set the default status for new features"
                badge="Planned"
              />
              <SettingItem
                title="Custom Fields"
                description="Add custom fields to feature cards"
                badge="Planned"
              />
              <SettingItem
                title="Feature Templates"
                description="Create reusable feature templates"
                badge="Planned"
              />
              <SettingItem
                title="Auto-Numbering"
                description="Automatically number features (e.g., FEAT-001)"
                badge="Planned"
              />
              <SettingItem
                title="Required Fields"
                description="Make certain fields mandatory when creating features"
                badge="Planned"
              />
              <SettingItem
                title="Default Timeline"
                description="Set default timeline phase for new features"
                badge="Planned"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> These settings will allow you to customize the Features module to match your team's workflow and naming conventions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingItem({
  title,
  description,
  badge,
}: {
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg bg-white">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h5 className="font-medium text-sm">{title}</h5>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
            {badge}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

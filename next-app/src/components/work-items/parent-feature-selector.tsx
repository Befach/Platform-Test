'use client'

/**
 * Parent Feature Selector Component
 *
 * Combobox to select a parent feature when creating an enhancement.
 * Shows features in the same workspace with their phase and version.
 *
 * @module components/work-items/parent-feature-selector
 */

import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { getLifecycleStatusLabel, getLifecycleStatusBgColor } from '@/lib/constants/work-item-types'

interface FeatureOption {
  id: string
  name: string
  phase: string | null
  version: number | null
  is_enhancement: boolean | null
}

export interface ParentFeatureSelectorProps {
  /** Team ID for filtering */
  teamId: string
  /** Workspace ID to filter features from */
  workspaceId: string
  /** Currently selected parent feature ID */
  selectedFeatureId: string | null
  /** Callback when selection changes - provides feature ID and calculated next version */
  onFeatureChange: (featureId: string | null, nextVersion: number) => void
  /** ID to exclude from list (for edit mode - don't show self) */
  excludeId?: string
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * Selector for choosing a parent feature when creating an enhancement.
 * Auto-calculates the next version number based on parent's version.
 *
 * @example
 * ```tsx
 * <ParentFeatureSelector
 *   teamId={teamId}
 *   workspaceId={workspaceId}
 *   selectedFeatureId={formData.enhancesWorkItemId}
 *   onFeatureChange={(featureId, version) => setFormData({
 *     ...formData,
 *     enhancesWorkItemId: featureId,
 *     version: version,
 *   })}
 * />
 * ```
 */
export function ParentFeatureSelector({
  teamId,
  workspaceId,
  selectedFeatureId,
  onFeatureChange,
  excludeId,
  disabled = false,
}: ParentFeatureSelectorProps) {
  const [open, setOpen] = useState(false)
  const [features, setFeatures] = useState<FeatureOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const supabase = createClient()

  // Load features for this workspace
  const loadFeatures = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('work_items')
        .select('id, name, phase, version, is_enhancement')
        .eq('workspace_id', workspaceId)
        .eq('team_id', teamId)
        .in('type', ['feature', 'enhancement'])
        .order('name')

      // Exclude current item in edit mode
      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading features:', error)
        setFeatures([])
      } else {
        setFeatures(data || [])
      }
    } catch (error) {
      console.error('Error loading features:', error)
      setFeatures([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, teamId, excludeId, supabase])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  // Get selected feature details
  const selectedFeature = features.find((f) => f.id === selectedFeatureId)

  // Calculate next version based on parent
  const calculateNextVersion = (parentVersion: number | null): number => {
    return (parentVersion || 1) + 1
  }

  // Handle selection
  const handleSelect = (featureId: string) => {
    const feature = features.find((f) => f.id === featureId)
    if (feature) {
      const nextVersion = calculateNextVersion(feature.version)
      onFeatureChange(featureId, nextVersion)
    }
    setOpen(false)
    setSearchValue('')
  }

  // Handle clear selection
  const handleClear = () => {
    onFeatureChange(null, 1)
    setOpen(false)
  }

  // Filter features by search
  const filteredFeatures = features.filter((feature) =>
    feature.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Parent Feature</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Parent Feature <span className="text-red-500">*</span>
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedFeature ? (
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{selectedFeature.name}</span>
                {selectedFeature.phase && (
                  <Badge
                    variant="secondary"
                    className={cn('text-xs shrink-0', getLifecycleStatusBgColor(selectedFeature.phase))}
                  >
                    {getLifecycleStatusLabel(selectedFeature.phase)}
                  </Badge>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">Select parent feature...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search features..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  No features found in this workspace
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredFeatures.map((feature) => (
                  <CommandItem
                    key={feature.id}
                    value={feature.name}
                    onSelect={() => handleSelect(feature.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          selectedFeatureId === feature.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="truncate">{feature.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {feature.phase && (
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', getLifecycleStatusBgColor(feature.phase))}
                        >
                          {getLifecycleStatusLabel(feature.phase)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        v{feature.version || 1}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Show calculated version */}
      {selectedFeature && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            v{calculateNextVersion(selectedFeature.version)}
          </Badge>
          Will be created as version {calculateNextVersion(selectedFeature.version)} of this feature
        </p>
      )}

      {/* No features warning */}
      {!loading && features.length === 0 && (
        <p className="text-sm text-amber-600">
          No features found in this workspace. Create a feature first before adding enhancements.
        </p>
      )}
    </div>
  )
}

export default ParentFeatureSelector

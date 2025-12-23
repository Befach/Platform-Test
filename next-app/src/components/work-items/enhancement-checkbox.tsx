'use client'

/**
 * Enhancement Checkbox Component
 *
 * Shows only when type is 'feature' or 'enhancement'.
 * When checked, indicates this item enhances an existing feature.
 *
 * @module components/work-items/enhancement-checkbox
 */

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { GitBranch } from 'lucide-react'

export interface EnhancementCheckboxProps {
  /** Current work item type */
  type: string
  /** Whether the enhancement flag is checked */
  checked: boolean
  /** Callback when checkbox state changes */
  onCheckedChange: (checked: boolean) => void
  /** Whether the checkbox is disabled */
  disabled?: boolean
}

/**
 * Checkbox to mark a feature as an enhancement of an existing feature.
 * Only renders when type is 'feature' or 'enhancement'.
 *
 * @example
 * ```tsx
 * <EnhancementCheckbox
 *   type="feature"
 *   checked={formData.isEnhancement}
 *   onCheckedChange={(checked) => setFormData({ ...formData, isEnhancement: checked })}
 * />
 * ```
 */
export function EnhancementCheckbox({
  type,
  checked,
  onCheckedChange,
  disabled = false,
}: EnhancementCheckboxProps) {
  // Only show for feature or enhancement types
  if (type !== 'feature' && type !== 'enhancement') {
    return null
  }

  return (
    <div className="flex items-start space-x-3 pt-3 pb-1">
      <Checkbox
        id="is-enhancement"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="grid gap-1 leading-none">
        <Label
          htmlFor="is-enhancement"
          className="flex items-center gap-2 text-sm font-medium cursor-pointer"
        >
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          This is an enhancement of an existing feature
        </Label>
        <p className="text-xs text-muted-foreground">
          Link to parent feature to track version history and iterations
        </p>
      </div>
    </div>
  )
}

export default EnhancementCheckbox

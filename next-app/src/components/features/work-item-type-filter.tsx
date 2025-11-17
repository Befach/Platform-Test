'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'
import {
  getPhaseItemTypes,
  getItemLabel,
  getItemIcon,
  getPhaseHelperText,
  type WorkItemType,
  type WorkspacePhase,
} from '@/lib/constants/work-item-types'

interface WorkItemTypeFilterProps {
  phase: WorkspacePhase
  selectedType: string | 'all'
  onTypeChange: (type: string | 'all') => void
  showAllTypes: boolean
  onToggleShowAll: (show: boolean) => void
}

export function WorkItemTypeFilter({
  phase,
  selectedType,
  onTypeChange,
  showAllTypes,
  onToggleShowAll,
}: WorkItemTypeFilterProps) {
  const availableTypes = getPhaseItemTypes(phase, showAllTypes)
  const helperText = getPhaseHelperText(phase, showAllTypes)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="All Work Items" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span>📋</span>
                <span>All Work Items</span>
              </div>
            </SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  <span>{getItemIcon(type)}</span>
                  <span>{getItemLabel(type, true)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedType !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTypeChange('all')}
            className="h-9"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        <Button
          variant={showAllTypes ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToggleShowAll(!showAllTypes)}
          className="h-9"
        >
          {showAllTypes ? 'Show Phase Types' : 'Show All Types'}
        </Button>
      </div>

      {/* Helper text */}
      {helperText && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <span className="text-blue-500">ℹ️</span>
          <span>{helperText}</span>
        </div>
      )}

      {/* Active filters badge */}
      {(selectedType !== 'all' || showAllTypes) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {selectedType !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {getItemIcon(selectedType)} {getItemLabel(selectedType, true)}
            </Badge>
          )}
          {showAllTypes && (
            <Badge variant="outline" className="text-xs">
              All Types Override
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

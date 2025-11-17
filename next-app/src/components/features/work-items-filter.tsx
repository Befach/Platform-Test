'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, List, Maximize2 } from 'lucide-react'

export interface FilterState {
  search: string
  status: string
  priority: string
}

export type ViewMode = 'collapsed' | 'expanded'

interface WorkItemsFilterProps {
  onFilterChange: (filters: FilterState) => void
  onViewModeChange: (mode: ViewMode) => void
  viewMode: ViewMode
}

export function WorkItemsFilter({
  onFilterChange,
  onViewModeChange,
  viewMode
}: WorkItemsFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
  })

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="flex items-center gap-3 bg-white border rounded-lg px-4 py-3">
      {/* Search Input - Left */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter tasks..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Status Filter - Middle */}
      <Select
        value={filters.status}
        onValueChange={(v) => updateFilter('status', v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="not_started">Not Started</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="on_hold">On Hold</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter - Middle */}
      <Select
        value={filters.priority}
        onValueChange={(v) => updateFilter('priority', v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      {/* View Mode Toggle - Right */}
      <div className="flex items-center gap-1 ml-auto border rounded-md p-1">
        <Button
          variant={viewMode === 'collapsed' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('collapsed')}
          className="h-7 px-2"
          title="Collapsed view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'expanded' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('expanded')}
          className="h-7 px-2"
          title="Expanded view"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

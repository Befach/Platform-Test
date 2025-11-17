# Features Table System

**AI-Friendly Documentation for Autonomous Development**

This module implements a flexible, dual-mode table system for displaying work items (features, tasks, bugs, etc.) with advanced filtering, column visibility controls, and expandable timeline breakdowns.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ features/page.tsx (Server Component)                     │
│ - Fetches data from Supabase                            │
│ - Calculates linked items count                         │
│ - Passes data to client components                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ FeaturesViewWrapper (Client Component)                   │
│ - Manages filter state                                   │
│ - Manages view mode state (collapsed/expanded)           │
│ - Manages column visibility state                        │
│ - Applies filters to work items                          │
└───────┬─────────────────┬──────────────────────────────┘
        │                 │
        ▼                 ▼
┌──────────────┐  ┌─────────────────────────────────────┐
│ WorkItemsFilter│  │ FeaturesTableView (Client)          │
│ - Search input │  │ - Renders collapsed mode            │
│ - Status filter│  │ - Renders expanded mode             │
│ - Priority     │  │ - Handles row expansion             │
│   filter       │  │ - Respects column visibility        │
│ - View mode    │  └─────────────────────────────────────┘
│   toggle       │
└────────────────┘
        │
        ▼
┌──────────────────────────┐
│ ColumnVisibilityMenu     │
│ - Toggle column display  │
│ - Persist to localStorage│
└──────────────────────────┘
```

## Data Flow

1. **Server-Side Data Loading** (features/page.tsx)
   - Load work items from `work_items` table
   - Load timeline items from `timeline_items` table
   - Load linked items from `linked_items` table
   - Calculate bidirectional link counts at work item level
   - Load tags and join with work items
   - Pass enriched data to client components

2. **Client-Side Filtering** (FeaturesViewWrapper)
   - Apply search filter (matches name, purpose, tags)
   - Apply status filter
   - Apply priority filter
   - Pass filtered data to table

3. **Client-Side Rendering** (FeaturesTableView)
   - Render in collapsed or expanded mode
   - Show/hide columns based on visibility settings
   - Handle row expansion in expanded mode

## Configuration System

All table behavior is controlled through [`table-config.ts`](./table-config.ts):

### Adding a New Status

```typescript
// 1. Add to STATUS_CONFIG in table-config.ts
export const STATUS_CONFIG = {
  // ... existing statuses
  blocked: {
    label: 'Blocked',
    icon: StopCircle,
    color: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-700 border-red-300',
  },
}

// 2. Add to database enum (migration):
// ALTER TYPE work_item_status ADD VALUE 'blocked';

// 3. Add to filter dropdown in work-items-filter.tsx:
// <SelectItem value="blocked">Blocked</SelectItem>
```

### Adding a New Column

```typescript
// 1. Add to DEFAULT_COLUMN_VISIBILITY in table-config.ts
export const DEFAULT_COLUMN_VISIBILITY = {
  // ... existing columns
  assignee: true,
}

// 2. Update ColumnVisibility interface in column-visibility-menu.tsx
export interface ColumnVisibility {
  // ... existing columns
  assignee: boolean
}

// 3. Add menu item in column-visibility-menu.tsx:
<DropdownMenuCheckboxItem
  checked={visibility.assignee}
  onCheckedChange={() => toggleColumn('assignee')}
>
  Assignee
</DropdownMenuCheckboxItem>

// 4. Add column header in features-table-view.tsx:
{columnVisibility.assignee && <TableHead>Assignee</TableHead>}

// 5. Add column cell in both collapsed and expanded rendering functions
```

### Adding a New Filter

```typescript
// 1. Add to FILTER_CONFIG in table-config.ts
export const FILTER_CONFIG = {
  // ... existing filters
  assignee: {
    label: 'Assignee',
    defaultValue: 'all',
  },
}

// 2. Update FilterState interface in work-items-filter.tsx
export interface FilterState {
  // ... existing filters
  assignee: string
}

// 3. Add filter UI in work-items-filter.tsx (copy status filter pattern)

// 4. Add filter logic in features-view-wrapper.tsx:
if (filters.assignee !== 'all' && item.assignee_id !== filters.assignee) return false
```

## Component API Reference

### FeaturesViewWrapper

**Purpose**: Manages state and applies filters

**Props**:
```typescript
interface FeaturesViewWrapperProps {
  initialWorkItems: WorkItem[]      // Work items from server
  timelineItems: TimelineItem[]     // Timeline breakdowns from server
  workspaceId: string               // Current workspace ID
  currentUserId: string             // Current user ID
}
```

**State**:
- `filters`: Search, status, priority filters
- `viewMode`: 'collapsed' | 'expanded'
- `columnVisibility`: Which columns to show
- `deletingId`: Work item being deleted (for confirmation modal)

### FeaturesTableView

**Purpose**: Renders the table in collapsed or expanded mode

**Props**:
```typescript
interface FeaturesTableViewProps {
  workItems: WorkItem[]            // Filtered work items
  timelineItems: TimelineItem[]    // All timeline items
  workspaceId: string              // For generating links
  onDelete: (id: string) => void   // Delete handler
  viewMode: ViewMode               // 'collapsed' | 'expanded'
  columnVisibility: ColumnVisibility // Which columns to show
}
```

**Rendering Modes**:

1. **Collapsed Mode** (`renderCollapsedRow`):
   - One row per work item
   - Shows aggregated timeline badges (e.g., "MVP · easy", "SHORT · medium")
   - Compact view for scanning many items

2. **Expanded Mode** (`renderExpandedRows`):
   - Parent row with work item summary
   - Child rows for each timeline phase
   - Expandable/collapsible via chevron button
   - Shows phase-specific details (integration, description)

### WorkItemsFilter

**Purpose**: Inline filter bar with view mode toggle

**Props**:
```typescript
interface WorkItemsFilterProps {
  onFilterChange: (filters: FilterState) => void    // Called when filters change
  onViewModeChange: (mode: ViewMode) => void        // Called when view mode changes
  viewMode: ViewMode                                 // Current view mode
}
```

**Layout**:
```
[Search Input] [Status▼] [Priority▼]         [□][⛶]
└─ flex-1      └─ filters                    └─ view toggles
```

### ColumnVisibilityMenu

**Purpose**: Dropdown menu to toggle column visibility

**Props**:
```typescript
interface ColumnVisibilityMenuProps {
  onVisibilityChange: (visibility: ColumnVisibility) => void
}
```

**Storage**: Persists to localStorage with key `table-column-visibility`

## Type Definitions

```typescript
// Core work item interface
interface WorkItem {
  id: string
  name: string
  type: string                    // 'epic' | 'feature' | 'story' | 'task' | 'bug'
  purpose: string | null
  status: string                  // See STATUS_CONFIG
  priority: string                // See PRIORITY_CONFIG
  tags: string[] | null
  linkedItemsCount: number        // Calculated from linked_items
  created_at: string
  updated_at: string
  created_by: string
}

// Timeline breakdown interface
interface TimelineItem {
  id: string
  work_item_id: string
  timeline: 'MVP' | 'SHORT' | 'LONG'
  description: string | null
  difficulty: string              // 'easy' | 'medium' | 'hard'
  integration_system?: string | null
  integration_complexity?: string | null
  implementation_approach?: string | null
  implementation_tech_stack?: string[] | null
  implementation_estimated_duration?: string | null
}
```

## Database Schema (Relevant Tables)

```sql
-- Work items (features, tasks, bugs, etc.)
CREATE TABLE work_items (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL REFERENCES users(id)
);

-- Timeline breakdowns (MVP, SHORT, LONG phases)
CREATE TABLE timeline_items (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  timeline TEXT NOT NULL,  -- 'MVP' | 'SHORT' | 'LONG'
  description TEXT,
  difficulty TEXT NOT NULL,
  integration_system TEXT,
  integration_complexity TEXT,
  implementation_approach TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Links between timeline items (dependencies, related work)
CREATE TABLE linked_items (
  id TEXT PRIMARY KEY DEFAULT generate_text_id(),
  team_id TEXT NOT NULL REFERENCES teams(id),
  source_item_id TEXT NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
  target_item_id TEXT NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,  -- 'blocks' | 'depends_on' | 'relates_to'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work item tags (many-to-many)
CREATE TABLE work_item_tags (
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (work_item_id, tag_id)
);
```

## Testing

### Manual Testing Checklist

- [ ] Search filters by name, purpose, and tags
- [ ] Status filter works for all statuses
- [ ] Priority filter works for all priorities
- [ ] View mode toggle switches between collapsed and expanded
- [ ] Collapsed mode shows aggregated timeline badges
- [ ] Expanded mode shows expandable rows
- [ ] Clicking chevron expands/collapses child rows
- [ ] Child rows show phase details (integration, description)
- [ ] Column visibility menu toggles columns
- [ ] Column visibility persists to localStorage
- [ ] Delete confirmation modal works
- [ ] Links modal opens and shows related items
- [ ] Status icons display correctly
- [ ] Priority icons display correctly
- [ ] Empty state shows when no items match filters

### Test Data Generator

```typescript
// Generate test work items
const generateTestWorkItem = (overrides = {}): WorkItem => ({
  id: `work_${Date.now()}_${Math.random()}`,
  name: `Test Feature ${Math.floor(Math.random() * 1000)}`,
  type: ['epic', 'feature', 'story', 'task', 'bug'][Math.floor(Math.random() * 5)],
  purpose: 'This is a test work item for development',
  status: ['not_started', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
  priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
  tags: ['backend', 'frontend', 'database'].slice(0, Math.floor(Math.random() * 3)),
  linkedItemsCount: Math.floor(Math.random() * 5),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test_user',
  ...overrides,
})
```

## AI Assistant Guidelines

When modifying this system, follow these principles:

1. **Always use configuration objects** instead of hardcoding values
2. **Update all affected files** when adding new fields (config → interface → component)
3. **Maintain type safety** - use TypeScript strictly, avoid `any`
4. **Document changes** in this README
5. **Test both view modes** when modifying table rendering
6. **Preserve localStorage keys** to avoid breaking user preferences
7. **Keep components pure** - no side effects in render functions
8. **Use semantic HTML** - table, thead, tbody for accessibility
9. **Follow naming conventions**:
   - `handle*` for event handlers
   - `get*` for pure getter functions
   - `render*` for rendering functions
   - `*Config` for configuration objects

## Performance Considerations

- **Memoization**: Consider memoizing `getTimelinesForWorkItem` if dataset is large
- **Virtualization**: For 500+ items, implement virtual scrolling
- **Debouncing**: Search filter is debounced (300ms) to reduce re-renders
- **Lazy Rendering**: Child rows only render when expanded

## Future Enhancements (AI Todo List)

- [ ] Add bulk selection with checkbox column
- [ ] Add bulk actions (delete, change status, assign)
- [ ] Add sorting by clicking column headers
- [ ] Add pagination or infinite scroll
- [ ] Add keyboard navigation (arrow keys, enter to expand)
- [ ] Add drag-and-drop to reorder items
- [ ] Add export to CSV/Excel
- [ ] Add customizable column widths
- [ ] Add column reordering
- [ ] Add saved filter presets
- [ ] Add Kanban view mode
- [ ] Add Calendar view mode
- [ ] Add Timeline/Gantt view mode

## Questions? Issues?

When encountering issues, check:
1. Browser console for errors
2. Network tab for failed API requests
3. localStorage for corrupt data (`table-column-visibility`)
4. Supabase logs for database errors
5. TypeScript compiler for type errors

Common issues:
- **Columns not showing**: Check `columnVisibility` state and `DEFAULT_COLUMN_VISIBILITY`
- **Filters not working**: Check `FilterState` interface matches filter UI
- **Expanded mode broken**: Check `timelineItems` prop is passed correctly
- **Icons missing**: Check `lucide-react` import paths

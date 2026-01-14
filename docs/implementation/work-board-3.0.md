# Work Board 3.0 - Implementation Guide

**Created**: 2025-11-26
**Status**: Planning Complete - Ready for Implementation
**Priority**: HIGH - Core UX Improvement

---

## Vision Statement

Transform the Work Board from a simple table view into a **unified command center** for managing both Work Items and Tasks with multiple visualization modes, smart filtering, and seamless context switching.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Work Board 3.0                              [+ Quick Task] [+ New Work Item]  │
├─────────────────────────────────────────────────────────────────────────┤
│  [Search...]  [All Status ▼]  [All Types ▼]  [Manage Columns]           │
│                                                                         │
│  ┌─────────────┬─────────────┐   ┌─────────┬─────────┬─────────┐       │
│  │   Tasks     │ Work Items  │   │  Table  │  Board  │ Timeline │       │
│  └─────────────┴─────────────┘   └─────────┴─────────┴─────────┘       │
│        PRIMARY TOGGLE                  VIEW MODE TOGGLE                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         CONTENT AREA                                    │
│                   (changes based on toggles)                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Hierarchy

```
Workspace
├── Work Items (features, bugs, concepts, enhancements)
│   ├── Timeline Items (MVP → SHORT → LONG breakdowns)
│   │   └── Tasks (linked to specific timeline item)
│   └── Tasks (linked to work item, no specific timeline)
└── Tasks (standalone - Quick Tasks)
```

**Key Insight**: Tasks exist at 3 levels:
1. **Standalone Tasks** - Workspace-level quick tasks (no parent)
2. **Work Item Tasks** - Linked to a feature/bug (`work_item_id` set)
3. **Timeline Tasks** - Linked to MVP/SHORT/LONG (`timeline_item_id` set)

---

## View Matrix

| Primary Tab | View Mode | Content | Grouping |
|-------------|-----------|---------|----------|
| **Tasks** | Table | All tasks (standalone + linked) | Flat list |
| **Tasks** | Board | Tasks by status columns | todo / in_progress / done |
| **Tasks** | Timeline | Tasks with due dates | By due date |
| **Work Items** | Table | Work items with expandable timelines | Current behavior |
| **Work Items** | Board | Work items by status | planned / in_progress / completed / on_hold |
| **Work Items** | Timeline | Gantt view | By MVP/SHORT/LONG |

---

## Component Architecture

### New Components to Create

```
src/components/work-board/
├── work-board-shell.tsx        # Main container with tabs
├── work-board-toolbar.tsx      # Unified filter bar
├── work-board-tabs.tsx         # Tasks | Work Items toggle
├── view-mode-toggle.tsx        # Table | Board | Timeline toggle
│
├── tasks-view/
│   ├── tasks-table-view.tsx    # Table view for tasks
│   ├── tasks-board-view.tsx    # Kanban board for tasks
│   └── tasks-timeline-view.tsx # Timeline view for tasks
│
├── work-items-view/
│   ├── work-items-table-view.tsx   # Enhanced current table
│   ├── work-items-board-view.tsx   # Kanban by work item status
│   └── work-items-timeline-view.tsx # Existing timeline
│
└── shared/
    ├── board-column.tsx        # Reusable kanban column
    ├── draggable-card.tsx      # Unified draggable card
    └── filter-context.tsx      # Shared filter state
```

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| BoardView | `src/components/board/board-view.tsx` | dnd-kit kanban (already built) |
| BoardCard | `src/components/board/board-card.tsx` | Draggable card (already built) |
| TaskList | `src/components/product-tasks/task-list.tsx` | Has board view (reuse logic) |
| FeaturesTableView | `src/components/features/features-table-view.tsx` | Current table (enhance) |
| TimelineView | `src/components/timeline/timeline-view.tsx` | Gantt chart (reuse) |
| BulkActionBar | `src/components/board/bulk-action-bar.tsx` | Multi-select operations |

---

## Implementation Phases

### Phase H.1: Shell & Navigation (Foundation)

**Create WorkBoardShell Component**
```tsx
// src/components/work-board/work-board-shell.tsx
interface WorkBoardShellProps {
  workspace: Workspace
  team: Team
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  currentUserId: string
}

// State to manage:
// - primaryTab: 'tasks' | 'work-items'
// - viewMode: 'table' | 'board' | 'timeline'
// - filters: FilterState (search, status, type, priority, assignee)

// Persist to localStorage: view preferences per workspace
```

**Create WorkBoardToolbar**
- Search input (searches tasks OR work items based on tab)
- Status filter (task statuses OR work item statuses)
- Type filter (task types OR work item types)
- Priority filter
- Assignee filter
- Column visibility (for table views)

**Tab Navigation**
- Primary: "Tasks" | "Work Items" (styled toggle group)
- Secondary: Table | Board | Timeline icons
- Use shadcn/ui Tabs + ToggleGroup components

**Files to Create:**
- `src/components/work-board/work-board-shell.tsx`
- `src/components/work-board/work-board-toolbar.tsx`
- `src/components/work-board/work-board-tabs.tsx`
- `src/components/work-board/view-mode-toggle.tsx`
- `src/components/work-board/shared/filter-context.tsx`

---

### Phase H.2: Tasks Views

**H.2.1 Tasks Table View**
- Columns: Status, Title, Type, Priority, Due Date, Assignee, Parent (work item/timeline)
- Sortable columns
- Inline status toggle (click to cycle)
- Row actions: Edit, Delete, Convert to Work Item
- Parent badge shows link to work item or timeline item

**H.2.2 Tasks Board View (Kanban)**
```
┌─────────────┬─────────────┬─────────────┐
│    To Do    │ In Progress │    Done     │
│    (12)     │     (5)     │    (28)     │
├─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │ Task A  │ │ │ Task D  │ │ │ Task G  │ │
│ │ 🔵 Dev  │ │ │ 🟣 QA   │ │ │ ✓ Done  │ │
│ │ Feature │ │ │ Bug #12 │ │ │         │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │
└─────────────┴─────────────┴─────────────┘
```

Features:
- Drag-drop to change status (uses existing dnd-kit)
- Task cards show: title, type badge, priority icon, parent link, due date
- Filter by: standalone only, linked only, or all
- Optional secondary grouping: by Type (research/design/dev/qa/etc.)

**H.2.3 Tasks Timeline View**
- Show tasks with due dates on a timeline
- X-axis: dates, Y-axis: tasks grouped by status or type
- Drag to reschedule (updates due_date)

**Files to Create:**
- `src/components/work-board/tasks-view/tasks-table-view.tsx`
- `src/components/work-board/tasks-view/tasks-board-view.tsx`
- `src/components/work-board/tasks-view/tasks-timeline-view.tsx`

---

### Phase H.3: Work Items Views

**H.3.1 Work Items Table View (Enhanced)**
- Keep current collapsed/expanded modes
- Add: task count badge per work item
- Add: inline progress bar (based on timeline item statuses)
- New column: "Tasks" showing count of linked tasks

**H.3.2 Work Items Board View (NEW - Key Feature)**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Planned   │ In Progress │  Completed  │   On Hold   │
│     (5)     │     (3)     │    (12)     │     (1)     │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │Feature A│ │ │Feature C│ │ │Feature E│ │ │Feature G│ │
│ │ MVP ■■□ │ │ │ MVP ■■■ │ │ │ ✓ Done  │ │ │ Blocked │ │
│ │ 5 tasks │ │ │ 2 tasks │ │ │         │ │ │         │ │
│ │ @John   │ │ │ @Sarah  │ │ │         │ │ │         │ │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

Features:
- Columns: planned, in_progress, completed, on_hold
- Cards show: name, type badge, timeline progress bars, task count, assignee
- Drag-drop to change status
- Click card to expand/view details

**H.3.3 Work Items Timeline View**
- Reuse existing Gantt implementation
- Group by: phase, assignee, priority, or MVP/SHORT/LONG

**Files to Create/Modify:**
- `src/components/work-board/work-items-view/work-items-board-view.tsx` (NEW)
- `src/components/work-board/work-items-view/work-items-table-view.tsx` (extract from features-table-view)
- Wire existing `timeline-view.tsx`

---

### Phase H.4: Smart Features (3.0 Enhancements)

**H.4.1 Cross-View Intelligence**
- When viewing Tasks, show work item context badge
- When viewing Work Items, show task aggregation counts
- Clicking parent link in Tasks view → switches to Work Items and highlights

**H.4.2 Quick Actions**
- "+" button in board columns to create item directly in that status
- Inline editing in table views (click cell to edit)
- Keyboard shortcuts: N (new), E (edit), / (search), ? (help)

**H.4.3 Bulk Operations**
- Multi-select with checkboxes
- Bulk status change, assignee change, delete
- Reuse existing `bulk-action-bar.tsx` component

**H.4.4 Persistent Preferences**
- Remember: primary tab, view mode, column visibility, sort order
- localStorage key: `work-board-preferences-{workspaceId}`

**H.4.5 Empty States**
- Custom empty state per view with helpful CTA
- "No tasks yet - Create your first task" with button
- "No work items in this status - Drag items here or create new"

---

## File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `components/work-board/work-board-shell.tsx` | Main container |
| `components/work-board/work-board-toolbar.tsx` | Unified filters |
| `components/work-board/work-board-tabs.tsx` | Primary navigation |
| `components/work-board/view-mode-toggle.tsx` | Table/Board/Timeline switch |
| `components/work-board/tasks-view/tasks-table-view.tsx` | Tasks in table format |
| `components/work-board/tasks-view/tasks-board-view.tsx` | Tasks kanban |
| `components/work-board/tasks-view/tasks-timeline-view.tsx` | Tasks timeline |
| `components/work-board/work-items-view/work-items-board-view.tsx` | Work items kanban |
| `components/work-board/shared/filter-context.tsx` | Shared filter state |

### Files to Modify

| File | Changes |
|------|---------|
| `app/(dashboard)/workspaces/[id]/_components/features-view.tsx` | Replace with WorkBoardShell |
| `components/features/features-table-view.tsx` | Extract to work-items-table-view |

### Reuse As-Is

| File | Usage |
|------|-------|
| `components/board/board-view.tsx` | Kanban logic and dnd-kit |
| `components/board/board-card.tsx` | Card component |
| `components/board/bulk-action-bar.tsx` | Bulk operations |
| `components/timeline/timeline-view.tsx` | Gantt chart |
| `components/product-tasks/task-list.tsx` | Task fetching logic |
| `components/product-tasks/task-card.tsx` | Task card display |

---

## Implementation Order (Recommended)

### Week 1: Foundation (H.1)
1. ✅ Create `work-board-shell.tsx` with basic structure
2. ✅ Create `work-board-toolbar.tsx` with shared filters
3. ✅ Create tab navigation (Tasks | Work Items)
4. ✅ Create view mode toggle (Table | Board | Timeline)
5. ✅ Wire up to features-view.tsx
6. ✅ Test basic navigation works

### Week 2: Tasks Views (H.2)
1. ✅ `tasks-table-view.tsx` - Table view for tasks
2. ✅ `tasks-board-view.tsx` - Kanban with drag-drop
3. ✅ Integrate with existing TaskList/TaskCard components
4. ✅ Add filter context for cross-view filtering
5. ✅ Test all task views

### Week 3: Work Items Views (H.3)
1. ✅ `work-items-board-view.tsx` - NEW Kanban for work items
2. ✅ Enhance work-items-table-view with task counts
3. ✅ Wire up existing timeline-view.tsx
4. ✅ Add bulk operations support
5. ✅ Test all work item views

### Week 4: Polish & Advanced Features (H.4)
1. ✅ Cross-view navigation (click parent in tasks → opens work item)
2. ✅ Keyboard shortcuts
3. ✅ Persistent preferences
4. ✅ Empty states and loading states
5. ✅ Mobile responsive adjustments
6. ✅ Final testing and bug fixes

---

## Technical Decisions

### State Management
- Use React Context for shared filter state across views
- Local component state for view-specific state
- localStorage for preferences persistence

### Drag & Drop
- Continue using dnd-kit (already installed: @dnd-kit/core, @dnd-kit/sortable)
- Reuse existing board-view.tsx patterns
- Add horizontal drag for timeline rescheduling

### Performance Considerations
- Virtualize large lists (use react-window if >100 items)
- Memoize filtered results with useMemo
- Lazy load non-visible views
- Debounce search input (300ms)

### API Considerations
- No new API endpoints needed initially
- Reuse existing: `/api/product-tasks`, `/api/work-items`
- Future: Consider `/api/work-items/[id]/task-count` for efficient aggregation

---

## Success Criteria

- [ ] Toggle between Tasks and Work Items views
- [ ] Each view has Table, Board, and Timeline modes
- [ ] Tasks Board: Kanban with todo/in_progress/done columns
- [ ] Work Items Board: Kanban with status columns
- [ ] Drag-drop status changes in all board views
- [ ] Unified filter bar works across all views
- [ ] Preferences persist across sessions
- [ ] Performance: <100ms view switch time
- [ ] Mobile responsive at 768px breakpoint

---

## Design Decisions Made

### Q1: Timeline View for Tasks
**Decision**: Tasks without due dates will be hidden in timeline view (filter them out). Only tasks with `due_date` set will appear.

### Q2: Board Grouping Options
**Decision**: Start with status grouping only. Future iteration can add:
- Task Type grouping (research/design/dev/qa)
- Assignee swimlanes
- Priority lanes

### Q3: Work Item Card Detail Level
**Decision**: Standard detail level:
- Name + type badge
- Timeline progress bars (MVP/SHORT/LONG)
- Task count badge
- Assignee avatar (if assigned)

### Q4: Quick Task Scope
**Decision**: Quick Task button creates standalone tasks by default. Can optionally link to work item via dropdown in the create dialog (existing functionality).

---

## Related Documentation

- [Product Tasks System](./week-5-review-system.md) - Tasks implementation
- [Existing Board Components](../architecture/ARCHITECTURE.md) - Board/Kanban architecture
- [dnd-kit Usage](https://docs.dndkit.com/) - Drag-drop library docs

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-26 | Initial plan created | Claude |
| 2025-11-28 | Parts 1-6 completed (all 6 views, filters, Gantt, shortcuts) | Claude |
| 2025-11-29 | Added Part 7: Work Item Detail Page (8-tab structure) | Claude |
| 2025-11-29 | Added Part 8: Feedback Module Vision | Claude |
| 2025-11-29 | Added Part 9: Integrations Module Strategy | Claude |
| 2025-11-29 | Added Part 10: AI Visual Prototype Feature | Claude |

---

# Part 7: Work Item Detail Page (8-Tab Structure)

**Status**: READY FOR IMPLEMENTATION
**Target**: Week 6 Extension (Project Execution Module)
**Estimated Time**: ~20-25 hours total

---

## Vision

Transform the basic Work Item Detail Page into a **comprehensive product lifecycle command center** with progressive disclosure based on the current workspace phase.

---

## Final Tab Structure (8 Tabs)

| Tab | Phase Focus | Purpose |
|-----|-------------|---------|
| **Summary** | All | Core info, status, dependencies, quick overview |
| **Inspiration** | Research | Ideas, references, research findings |
| **Resources** | Planning | Tools, APIs, integrations to use |
| **Scope** | Planning | Validate the idea - milestones, risks, prerequisites, success criteria |
| **Tasks** | All | Universal task management with progress tracking |
| **Feedback** | Review | **Linked feedback** from the Feedback Module (not full management) |
| **Metrics** | Complete | **TBD / Coming Soon** - Post-launch performance tracking |
| **AI Copilot** | All | AI assistance throughout the lifecycle |

**Important Distinctions**:
- **Feedback Tab** = Shows feedback items **linked to this work item** (the full Feedback Module has its own page)
- **Metrics Tab** = Placeholder for now, will be designed after core tabs are complete

---

## Target Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Work Items              Feature Title                  [Edit] │
│                                   🔍 Research Phase (badge)             │
├────────────────────────────────────────────────┬────────────────────────┤
│ [Summary] [Inspiration] [Resources] [Scope]    │  TRACKING SIDEBAR      │
│           [Tasks] [Feedback] [Metrics] [AI]    │  (280px fixed)         │
├────────────────────────────────────────────────┤                        │
│                                                │  Phase: [badge]        │
│         TAB CONTENT AREA                       │  Status: [select]      │
│         (scrollable, flex-1)                   │  Priority: [select]    │
│                                                │  Health: [select]      │
│  Content varies by:                            │  ──────────────        │
│  • Current tab                                 │  Owner: [select]       │
│  • Current phase (progressive disclosure)      │  Dates: [inputs]       │
│  • Work item type                              │  ──────────────        │
│  • Soft guidance hints                         │  Progress: [====]      │
│                                                │  Story Pts: [#]        │
│                                                │  Est Hours: [#]        │
│                                                │  ──────────────        │
│                                                │  Tags: [+chips]        │
└────────────────────────────────────────────────┴────────────────────────┘
```

---

## Tracking Sidebar Fields

**Core Fields**:
- Phase indicator (auto-calculated from `calculateWorkItemPhase()`)
- Status dropdown (planned, in_progress, completed, on_hold, cancelled)
- Priority dropdown (low, medium, high, critical)
- Health indicator (on_track, at_risk, blocked)

**Assignment & Timing**:
- Owner (assigned_to user select)
- Target Release (text input)
- Planned Start/End dates (date pickers)

**Effort Tracking**:
- Story Points (1-13 Fibonacci scale)
- Estimated Hours
- Actual Hours (auto-updated from tasks)
- T-Shirt Size (XS/S/M/L/XL) - optional

**Progress**:
- Progress bar (auto-calculated from Tasks %)
- Tasks summary: "12/20 completed (60%)"

---

## Phase-Based Progressive Disclosure

Uses existing `calculateWorkItemPhase()` from `workspace-phases.tsx`:
```
Research → Planning → Execution → Review → Complete
   🔍         📋          ⚡         💬        ✓
```

| Tab | Research | Planning | Execution | Review | Complete |
|-----|----------|----------|-----------|--------|----------|
| **Summary** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Read-only |
| **Inspiration** | ✅ Active | ✅ Reference | ⚪ Archive | ⚪ Archive | ⚪ Archive |
| **Resources** | ⚪ Suggest | ✅ Define | ✅ Track | ✅ View | ✅ Read-only |
| **Scope** | ⚪ Empty | ✅ Create | ✅ Track | ✅ Validate | ✅ Read-only |
| **Tasks** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Read-only |
| **Feedback** | ⚪ Empty | ⚪ Empty | ⚪ Preview | ✅ Active | ✅ Read-only |
| **Metrics** | ⚪ TBD | ⚪ TBD | ⚪ TBD | ⚪ TBD | ✅ TBD |
| **AI Copilot** | ✅ Research | ✅ Scope | ✅ Tasks | ✅ Feedback | ⚪ None |

---

## Tasks as Universal Module

Tasks can be linked to ANY context:

```
Work Item
├── Direct Tasks (work-item level)
├── Module-linked Tasks:
│   ├── Inspiration tasks ("Research competitor X")
│   ├── Resources tasks ("Set up API integration")
│   ├── Scope tasks ("Define acceptance criteria")
│   └── Review tasks ("Get stakeholder sign-off")
└── Timeline-linked Tasks:
    ├── MVP tasks
    ├── SHORT tasks
    └── LONG tasks
```

**Task Grouping Options**:
- All (flat list)
- By Module (Inspiration/Resources/Scope/Review)
- By Timeline (MVP/SHORT/LONG)
- By Assignee

**Database Change Required**:
```sql
ALTER TABLE product_tasks
ADD COLUMN module TEXT CHECK (module IN ('inspiration', 'resources', 'scope', 'feedback', NULL));
```

---

## Implementation Sessions

### Session 1: Tab Structure + Summary + Tasks (~8-10h)
1. Create 8-Tab Structure shell (~2h)
2. Build Tracking Sidebar component (~2h)
3. Summary Tab (overview, timeline, dependencies) (~2h)
4. Tasks Tab (universal tasks with grouping) (~3-4h)

### Session 2: Scope + Feedback + Phase Progression
5. Scope Tab (milestones, risks, criteria) (~3-4h)
6. Feedback Tab (linked feedback) (~2h)
7. Phase Progression Prompts (~2h)

### Session 3: Resources + Inspiration + Polish
8. Resources Tab (~2h)
9. Inspiration Tab (~2h)
10. Soft Guidance System (~2h)
11. AI Copilot Tab (placeholder) (~1h)
12. Metrics Tab (Coming Soon) (~0.5h)

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/work-items/detail/work-item-detail-client.tsx` | Client wrapper with 8-tab structure |
| `components/work-items/detail/tracking-sidebar.tsx` | Sidebar with inline editing |
| `components/work-items/detail/tab-summary.tsx` | Overview, timeline, dependencies |
| `components/work-items/detail/tab-inspiration.tsx` | Research & reference cards |
| `components/work-items/detail/tab-resources.tsx` | Tools, APIs, integrations |
| `components/work-items/detail/tab-scope.tsx` | Milestones, risks, criteria |
| `components/work-items/detail/tab-tasks.tsx` | Universal tasks with grouping |
| `components/work-items/detail/tab-feedback.tsx` | Linked feedback |
| `components/work-items/detail/tab-metrics.tsx` | Coming Soon placeholder |
| `components/work-items/detail/tab-ai-copilot.tsx` | AI placeholder |
| `components/work-items/detail/phase-guidance.tsx` | Phase-aware empty states |
| `components/work-items/detail/dependencies-section.tsx` | Dependencies display |

---

# Part 8: Feedback Module (Full Platform)

**Status**: PLANNING COMPLETE - Future Implementation
**Target**: Week 7 (External Review System)
**Estimated Time**: ~40-50 hours total

---

## Core Concept

A **comprehensive multi-channel feedback collection platform** for gathering user insights at any product lifecycle stage.

**Important**: This is SEPARATE from the Feedback Tab:
- **Feedback Tab** = Shows feedback linked to a specific work item
- **Feedback Module** = Full platform for surveys, voting, collection

---

## Feedback Collection Channels

| Channel | Build/Integrate | Notes |
|---------|-----------------|-------|
| **Email Surveys** | 🔗 Resend | Already integrated |
| **WhatsApp** | 🔗 Twilio | API verified |
| **SMS** | 🔗 Twilio | Same provider |
| **Web Popups** | 🏗️ Build | React component |
| **iFrame Embeds** | 🏗️ Build | Embeddable widget |
| **Public Links** | 🏗️ Build | Shareable URLs |
| **API Webhooks** | 🏗️ Build | Receive external feedback |

---

## Feedback Types by Stage

| Phase | Feedback Types |
|-------|----------------|
| **Research** | Idea validation surveys, market research polls |
| **Planning** | Feature prioritization voting, concept testing |
| **Execution** | Beta tester feedback, usability testing, bug reports |
| **Review/Complete** | NPS, CSAT surveys, feature adoption feedback |

---

## Key Features

**Survey Builder** (Built In-House):
- Drag-and-drop question builder
- MCQ, rating, open-ended, NPS question types
- Logic branching and skip patterns
- Custom branding/theming

**Distribution**:
- Schedule campaigns
- Audience targeting
- Multi-channel delivery
- Reminder automation

**Embeddable Widgets**:
- Feature voting widget
- Quick feedback popup
- In-app feedback button
- Public roadmap voting

**Analysis**:
- Response aggregation
- AI sentiment analysis (OpenRouter)
- Priority scoring
- Link feedback to work items

---

## Implementation Priority

| Priority | Feature | Complexity |
|----------|---------|------------|
| **P1** | Public feedback link + basic form | Low |
| **P1** | Link feedback to work items | Low |
| **P2** | Embeddable voting widget | Medium |
| **P2** | Email survey distribution | Medium |
| **P3** | WhatsApp/SMS integration | High |
| **P3** | SurveyMonkey/Typeform import | High |
| **P4** | Survey builder with logic | High |
| **P4** | AI sentiment analysis | High |

---

# Part 9: Integrations Module

**Status**: PLANNING COMPLETE - Future Implementation
**Target**: Week 7-8
**Estimated Time**: ~34 hours total

---

## Build vs. Integrate Decision Matrix

| Feature | Recommendation | Rationale |
|---------|----------------|-----------|
| **Survey Builder** | 🏗️ BUILD | Core to platform, better UX |
| **Voting Widgets** | 🏗️ BUILD | Simple, embedded in ecosystem |
| **Email Distribution** | 🔗 Resend | Already integrated |
| **WhatsApp Surveys** | 🔗 Twilio | Complex infrastructure |
| **SMS Distribution** | 🔗 Twilio | Same provider |
| **SurveyMonkey Import** | 🔗 API | Import, not compete |
| **Typeform Import** | 🔗 API | Import, not replace |
| **AI UI Prototypes** | 🏗️ BUILD | Core differentiator |
| **NPS/CSAT Scoring** | 🏗️ BUILD | Simple calculation |
| **Sentiment Analysis** | 🏗️ BUILD | Use OpenRouter |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATIONS MODULE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  CONNECTED SERVICES (Team Settings > Integrations)                          │
│  📧 Email (Resend)         ✅ Connected     [Configure]                      │
│  📱 WhatsApp (Twilio)      ⚪ Not Connected [Connect]                        │
│  💬 SMS (Twilio)           ⚪ Not Connected [Connect]                        │
│  📋 SurveyMonkey           ⚪ Not Connected [Connect]                        │
│  📝 Typeform               ⚪ Not Connected [Connect]                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  BUILT-IN FEATURES (Always Available)                                        │
│  📊 Survey Builder         [Create Survey]                                   │
│  🗳️ Voting Widgets         [Create Widget]                                   │
│  🎨 AI UI Prototypes       [Generate Mockup]                                 │
│  📈 Analytics Dashboard    [View Analytics]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
CREATE TABLE team_integrations (
    id TEXT PRIMARY KEY,
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    connected_by TEXT REFERENCES users(id),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, provider)
);

ALTER TABLE team_integrations ENABLE ROW LEVEL SECURITY;
```

---

## Implementation Order

| Phase | Integration | Time |
|-------|-------------|------|
| **1** | Email (Resend extend) | ~2h |
| **1** | AI UI Prototypes | ~4h |
| **2** | Survey Builder | ~6h |
| **2** | Voting Widget | ~4h |
| **3** | Twilio (WhatsApp + SMS) | ~6h |
| **3** | SurveyMonkey Import | ~4h |
| **4** | Typeform Import | ~4h |
| **4** | Advanced Analytics | ~4h |

---

# Part 10: AI Visual Prototype Feature

**Status**: PLANNING COMPLETE
**Target**: Week 7 (with Feedback Module)
**Estimated Time**: ~9 hours

---

## Feature Overview

Generate UI mockups with AI from natural language descriptions.

**User Flow**:
1. User describes UI idea in natural language
2. AI generates React/HTML code via OpenRouter
3. Preview renders in iframe sandbox
4. User shares link for visual feedback voting
5. Stakeholders vote/comment on the design

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AI VISUAL PROTOTYPE GENERATOR                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Describe your UI idea:                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ "A login form with email and password fields, a 'Remember me'         │ │
│  │  checkbox, and a gradient blue submit button. Modern and minimal."     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                           [✨ Generate]      │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │          LIVE PREVIEW                    │  │  CODE (editable)         │  │
│  │  [iframe sandbox renders here]           │  │  export function Login() │  │
│  └─────────────────────────────────────────┘  └──────────────────────────┘  │
│  [💾 Save] [🔗 Share for Feedback] [📋 Copy Code] [♻️ Regenerate]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
CREATE TABLE ui_prototypes (
    id TEXT PRIMARY KEY,
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    generated_code TEXT NOT NULL,
    preview_url TEXT,
    share_token TEXT UNIQUE,
    vote_count INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prototype_votes (
    id TEXT PRIMARY KEY,
    prototype_id TEXT REFERENCES ui_prototypes(id) ON DELETE CASCADE,
    voter_email TEXT,
    vote INTEGER CHECK (vote IN (-1, 0, 1)),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Priority

| Step | Task | Time |
|------|------|------|
| 1 | API route `/api/ai/generate-prototype` | ~2h |
| 2 | Iframe sandbox renderer component | ~2h |
| 3 | Save/share prototype functionality | ~2h |
| 4 | Public voting page (no auth) | ~2h |
| 5 | Link prototypes to work items | ~1h |

---

## Related Documentation

- **Week 6**: [Timeline & Execution](week-6-timeline-execution.md) - Work Item Detail Page
- **Week 7**: [AI Integration & Analytics](week-7/README.md) - Feedback Module, AI features
- **Product Tasks**: [Week 5](week-5-review-system.md) - Tasks implementation

---

# Part 11: Feedback & Insights UI System

**Status**: ✅ IMPLEMENTATION COMPLETE
**Completed**: 2025-12-02
**Estimated Time**: ~16 hours
**Actual Time**: ~14 hours (2 sessions)

---

## Overview

A comprehensive system for collecting public feedback, managing customer insights, and enabling stakeholder voting—all without requiring authentication for external users.

**Key Design Decisions**:
- **Security**: Multi-layer (honeypot + time check + rate limiting), CAPTCHA-ready
- **Widget**: Enabled by default with easy disable toggle
- **Voting**: Team-configurable verification (teams choose if email required)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PUBLIC ROUTES (No Auth Required)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  /feedback/[workspaceId]    → Public feedback form                       │
│  /widget/[workspaceId]      → Embeddable iframe widget                   │
│  /vote/[insightId]          → Public voting page                         │
├─────────────────────────────────────────────────────────────────────────┤
│  PUBLIC API ROUTES                                                        │
│  POST /api/public/feedback        → Submit anonymous feedback             │
│  GET  /api/public/workspaces/[id] → Validate workspace + get settings     │
│  GET  /api/public/insights/[id]   → Get sanitized insight for voting      │
│  POST /api/public/insights/[id]/vote → Submit vote                        │
├─────────────────────────────────────────────────────────────────────────┤
│  SECURITY LAYER                                                           │
│  🍯 Honeypot Fields    → Hidden inputs bots fill out                      │
│  ⏱️ Time Validation    → Reject submissions < 3 seconds                   │
│  🚦 Rate Limiting      → 10 feedback / 30 votes per 15 min per IP         │
│  🔒 CAPTCHA Ready      → Interface for reCAPTCHA/hCaptcha integration     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components Created

### Security Utilities (`src/lib/security/`)

| File | Purpose |
|------|---------|
| `honeypot.ts` | Spam prevention with hidden fields + time check |
| `rate-limit.ts` | In-memory rate limiting with auto-cleanup |
| `index.ts` | Security exports |

### Insights Dashboard (`src/components/insights/`)

| File | Purpose |
|------|---------|
| `insights-dashboard.tsx` | Main dashboard with tabs (all/triage/linked) |
| `insights-dashboard-stats.tsx` | Stats cards with clickable filters |
| `insight-detail-sheet.tsx` | Slide-over panel for insight details |
| `insight-triage-queue.tsx` | Keyboard-driven rapid review UI |
| `hooks/use-insight-shortcuts.ts` | Vim-style keyboard navigation |
| `public-vote-card.tsx` | External voting UI with configurable verification |

### Feedback Components (`src/components/feedback/`)

| File | Purpose |
|------|---------|
| `public-feedback-form.tsx` | Simplified form with honeypot integration |
| `feedback-thank-you.tsx` | Success confirmation component |
| `feedback-widget-embed.tsx` | Embed code generator with live preview |

### Work Item Integration (`src/components/work-items/`)

| File | Purpose |
|------|---------|
| `linked-insights-section.tsx` | Shows/manages insights linked to work item |

### Settings (`src/components/settings/`)

| File | Purpose |
|------|---------|
| `workspace-feedback-settings.tsx` | Full admin panel for feedback config |

### Public Pages (`src/app/(public)/`)

| Path | Purpose |
|------|---------|
| `layout.tsx` | Minimal layout with gradient background |
| `feedback/[workspaceId]/page.tsx` | Public feedback submission |
| `widget/[workspaceId]/page.tsx` | Embeddable widget with URL params |
| `vote/[insightId]/page.tsx` | Public voting page |

### Insights Dashboard Page (`src/app/(dashboard)/`)

| Path | Purpose |
|------|---------|
| `workspaces/[id]/insights/page.tsx` | Dashboard route for insights |

---

## Keyboard Shortcuts (Triage Queue)

| Key | Action |
|-----|--------|
| `j` / `↓` | Next insight |
| `k` / `↑` | Previous insight |
| `R` | Mark as Reviewed |
| `A` | Mark as Actionable |
| `D` | Archive (Dismiss) |
| `L` | Link to work item |
| `Enter` | Open detail sheet |
| `/` | Focus search |
| `?` | Show help |

---

## Database Migration

**Migration**: `20251202120000_add_public_feedback_settings.sql`

```sql
-- Added to workspaces table:
ALTER TABLE workspaces ADD COLUMN public_feedback_settings JSONB DEFAULT '{
  "enabled": true,
  "widget_enabled": true,
  "voting_enabled": true,
  "require_email_verification": false
}'::jsonb;

-- Public helper functions with security:
CREATE FUNCTION check_public_feedback_enabled(workspace_id TEXT) ...
CREATE FUNCTION get_workspace_public_settings(workspace_id TEXT) ...
```

---

## Widget Embed System

### URL Parameters
```
/widget/[workspaceId]?theme=light|dark|auto
                     &primaryColor=#3B82F6
                     &requireEmail=true|false
```

### PostMessage Communication
```javascript
// Widget → Parent: Notify success
window.parent.postMessage({
  type: 'feedback-submitted',
  workspaceId: '...',
  timestamp: Date.now()
}, '*')
```

### Generated Embed Code
```html
<button id="feedback-widget-btn">Feedback</button>
<script>
document.getElementById('feedback-widget-btn').onclick = function() {
  var iframe = document.createElement('iframe');
  iframe.src = 'https://yourapp.com/widget/abc123?theme=auto';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;...';
  document.body.appendChild(iframe);
};
</script>
```

---

## Rate Limiting Strategy

```typescript
const LIMITS = {
  feedback: { requests: 10, window: 15 * 60 * 1000 },  // 10 per 15 min
  vote: { requests: 30, window: 15 * 60 * 1000 },      // 30 per 15 min
}

// In-memory store with automatic cleanup every 5 minutes
const ipStore = new Map<string, { count: number, resetAt: number }>()
```

---

## CAPTCHA-Ready Architecture

```typescript
interface CaptchaProvider {
  name: 'recaptcha' | 'hcaptcha' | 'turnstile'
  siteKey: string
  verify: (token: string) => Promise<boolean>
}

// Placeholder for future integration
export function verifyCaptcha(
  provider: CaptchaProvider,
  token: string
): Promise<boolean> {
  // TODO: Implement provider-specific verification
  return Promise.resolve(true)
}
```

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-02 | Session 1: Database migration, dashboard stats, detail sheet | Claude |
| 2025-12-02 | Session 2: Triage queue, public pages, widget, voting, settings | Claude |

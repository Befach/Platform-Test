# **WEEK 6: Timeline Visualization & Execution**

**Last Updated:** 2025-11-29
**Status:** 🟡 In Planning

[← Previous: Week 5](week-5-review-system.md) | [Back to Plan](README.md) | [Next: Week 7 →](week-7/README.md)

---

## Goal
Gantt chart, team assignment, task tracking, **Work Item Detail Page (8-Tab Structure)**

---

## Related Documentation

| Document | Section | Description |
|----------|---------|-------------|
| [work-board-3.0.md](work-board-3.0.md#part-7-work-item-detail-page-8-tab-structure) | Part 7 | **Work Item Detail Page** - Complete 8-tab structure design |
| [work-board-3.0.md](work-board-3.0.md#part-1-work-board-enhanced-list-view-with-inline-actions) | Parts 1-6 | Work Board views, Gantt, filters (✅ Completed) |

---

## Tasks

### Day 1-3: Timeline Library
- [ ] Choose library (react-big-calendar recommended)
- [ ] Install:
  ```bash
  npm install react-big-calendar date-fns
  ```
- [ ] Create timeline page: `/app/(dashboard)/timeline/page.tsx`
- [ ] Render features as events (horizontal bars)
- [ ] Quarter-based view (Q1, Q2, Q3, Q4 columns)

### Day 4-5: Drag-to-Reschedule
- [ ] Enable drag-and-drop on timeline
- [ ] Update feature dates when dragged
- [ ] Show date picker on click (precise dates)
- [ ] Validate dependencies (warn if violates)

### Day 6-7: Dependency Arrows
- [ ] Render SVG arrows between dependent features
- [ ] Calculate arrow paths (start/end coordinates)
- [ ] Different arrow styles per link type:
  - [ ] Solid for dependencies
  - [ ] Dashed for blocks
- [ ] Hover to highlight path

### Day 8-9: Swimlanes & Filters
- [ ] Group by:
  - [ ] Team (Backend, Frontend, Mobile)
  - [ ] Status (Not Started, In Progress, Done)
  - [ ] Category
  - [ ] Assignee
- [ ] Filter panel (multi-select dropdowns)
- [ ] Zoom levels (month/quarter/year buttons)

### Day 10-12: Work Item Detail Page (8-Tab Structure)

> **📋 Full Design Spec:** See [work-board-3.0.md Part 7](work-board-3.0.md#part-7-work-item-detail-page-8-tab-structure)

- [ ] Work Item detail page: `/app/(dashboard)/workspaces/[id]/work-items/[workItemId]/page.tsx`
- [ ] **8-Tab Structure** (Phase-based progressive disclosure):
  - [ ] **Summary** - Overview, status, timeline, health indicators
  - [ ] **Inspiration** - Research links, competitor analysis, user quotes
  - [ ] **Resources** - Figma, GitHub, docs, API specs
  - [ ] **Scope** - Problem statement, success metrics, constraints
  - [ ] **Tasks** - Universal task module (linked to work items/timelines)
  - [ ] **Feedback** - Quick link to Feedback Module
  - [ ] **Metrics** *(TBD)* - Analytics tab (future)
  - [ ] **AI Copilot** - Context-aware AI assistant
- [ ] **Tracking Sidebar** (right panel):
  - [ ] Phase indicator with color coding
  - [ ] Status, Priority, Health dropdowns
  - [ ] Owner assignment (dropdown, search)
  - [ ] Target/Due dates
  - [ ] Story Points & Time tracking (Hours Est/Actual)
  - [ ] Tags
- [ ] Phase-based tab visibility using `calculateWorkItemPhase()`

### Day 13-14: Real-time Collaboration
- [ ] Supabase Realtime subscriptions
- [ ] Live cursors on timeline (see teammates)
- [ ] Presence indicators (green dot = online)
- [ ] Activity feed component: `components/shared/activity-feed.tsx`
  - [ ] Recent changes log
  - [ ] "Alex edited 'User Auth' 5 min ago"
  - [ ] "Sarah added milestone to 'Payment'"
- [ ] @mentions in comments
- [ ] Notifications (in-app + email)

---

## Module Features

### Timeline Visualization Module 📅

**Purpose:** Gantt-style view, schedule features, visualize dependencies

**Technology:** react-big-calendar or vis-timeline

**Features:**
- **Gantt Chart** - Horizontal bars showing feature duration
- **Quarter-Based View** - Q1, Q2, Q3, Q4 columns (or custom date ranges)
- **Drag-to-Reschedule** - Change dates visually (drag bar left/right)
- **Dependency Arrows** - SVG lines connecting dependent features
- **Swimlanes** - Group by:
  - Team (Backend, Frontend, Mobile)
  - Status (Not Started, In Progress, Done)
  - Category (Feature, Bug, Technical Debt)
  - Assignee (Alex, Sarah, David)
- **Zoom Levels:**
  - Day view (granular)
  - Week view
  - Month view
  - Quarter view (strategic)
  - Year view (long-term)
- **Filters** - Show/hide based on team, status, category, assignee
- **Export** - PNG, PDF, JSON

**AI Features:**
- **Suggest optimal scheduling** based on dependencies
- **Detect conflicts** (two features scheduled simultaneously with same person)
- **Predict completion dates** based on historical velocity
- **Recommend resource allocation** (who should work on what)

### Project Execution Module 🚀

> **📋 Full Design Spec:** See [work-board-3.0.md Part 7](work-board-3.0.md#part-7-work-item-detail-page-8-tab-structure)

**Purpose:** Track implementation progress, assign work, manage work item lifecycle

**Core Component:** Work Item Detail Page with 8-Tab Structure

**8 Tabs (Phase-Based Visibility):**

| Tab | Purpose | Phase Visibility |
|-----|---------|------------------|
| **Summary** | Overview, status, health | All phases |
| **Inspiration** | Research, competitors, user quotes | Research + |
| **Resources** | Design files, API docs, GitHub | Planning + |
| **Scope** | Problem statement, metrics, constraints | Planning + |
| **Tasks** | Execution checklist (Universal Module) | Execution + |
| **Feedback** | Quick link to Feedback Module | Review + |
| **Metrics** | Analytics (TBD) | Complete |
| **AI Copilot** | Context-aware assistant | All phases |

**Tracking Sidebar Features:**
- **Phase Indicator** - Visual progress through Research → Planning → Execution → Review → Complete
- **Team Assignment** - Assign to specific members or sub-teams
- **Status Tracking** - Planned → In Progress → On Hold → Completed → Cancelled
- **Effort Tracking** - Story Points + Hours (Estimated vs Actual)
- **Resource Management** - Links to Figma, API docs, GitHub repos
- **Health Indicator** - On Track / At Risk / Blocked
- **Tags** - Custom categorization

**Tasks as Universal Module:**
- Tasks can link to: Work Items, Timeline Items, or Module content (Inspiration/Resources/Scope/Feedback)
- Database: `product_tasks.module_type` + `product_tasks.module_id`
- Supports checklist-style execution with subtasks

### Collaboration Module 🤝 **[PRO TIER ONLY]**

**Purpose:** Real-time teamwork, reduce silos

**Features:**

#### Real-time Editing:
- **Live Cursors** - See where teammates are working (like Figma)
- **Presence Indicators** - Green dot = online
- **Instant Updates** - See changes immediately (no refresh)

#### Communication:
- **Team Chat** - Per-workspace chat room
- **Activity Feed** - Recent changes log ("Alex edited 'User Auth' 5 min ago")
- **@Mentions** - Notify specific team members in comments
- **Notifications:**
  - In-app notifications (bell icon)
  - Email notifications (configurable)

**Technology:** Supabase Realtime subscriptions (WebSocket-based)

---

## Deliverables

✅ Interactive timeline (Gantt chart)
✅ Drag-to-reschedule
✅ Dependency arrows (visual)
✅ Swimlanes and filters
✅ Team assignment and task tracking
✅ Real-time collaboration (cursors, activity feed)

---

## Testing

- [ ] Create 15 features with dates spanning 4 quarters
- [ ] Open timeline view
- [ ] Drag feature to new quarter
- [ ] Verify dependency arrows update
- [ ] Group by team, verify swimlanes
- [ ] Assign feature to team member
- [ ] Add execution steps (5 tasks)
- [ ] Open in 2 tabs, verify real-time updates
- [ ] Check activity feed shows recent actions

---

[← Previous: Week 5](week-5-review-system.md) | [Back to Plan](README.md) | [Next: Week 7 →](week-7/README.md)

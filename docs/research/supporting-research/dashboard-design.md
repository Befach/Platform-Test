# B2B SaaS Dashboard Design Research

**Research Date**: 2025-12-01
**Category**: Analytics & Visualization
**Key Finding**: 6-step process for thoughtful dashboards, role-based dashboard types

---

## Executive Summary

Effective B2B dashboards are not just about displaying data—they're about enabling decisions. Research shows that dashboards designed with specific user roles and decisions in mind dramatically outperform generic "data dump" dashboards. This document outlines the 6-step design process and role-specific patterns.

---

## 6 Steps for Thoughtful B2B Dashboards

Based on UX Collective research:

### Step 1: Define Purpose

| Question | Answer For |
|----------|------------|
| What are the user's goals? | User-centric design |
| What are the business goals? | Stakeholder alignment |
| What are the usage patterns? | Interaction design |

**Example for Our Platform**:
```
User Goal: Understand project health at a glance
Business Goal: Reduce time spent in status meetings
Usage Pattern: Daily check-in, 2-3 minutes
```

### Step 2: Identify Key Decisions

Dashboards should answer questions, not just show numbers.

| Don't Ask | Ask Instead |
|-----------|-------------|
| "What data should we show?" | "What decisions do users need to make?" |
| "What metrics are available?" | "What questions need answering?" |

**Example Decisions**:
- "Is my project on track?" → Need: Progress vs. plan comparison
- "What needs my attention today?" → Need: Blockers, overdue items
- "How is my team performing?" → Need: Velocity, completion rates

### Step 3: Select KPIs

Align metrics with goals and decisions:

```
Decision: "Is my project on track?"

Supporting KPIs:
├─ Overall progress % (primary)
├─ Items completed vs. planned
├─ Blockers count
└─ Days to deadline

Avoid:
├─ Total items ever created (vanity)
├─ Average item age (not actionable)
└─ Login count (irrelevant)
```

### Step 4: Map Layout and Flow

Surface the right insights at the right time:

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Layout Hierarchy                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Zone A: Critical Alerts (Top)                              │
│  ├─ Blockers requiring attention                            │
│  ├─ Overdue items                                           │
│  └─ At-risk timelines                                       │
│                                                             │
│  Zone B: Key Metrics (Upper Middle)                         │
│  ├─ Primary KPI (large, prominent)                          │
│  └─ Supporting KPIs (smaller, contextual)                   │
│                                                             │
│  Zone C: Trends & Comparisons (Lower Middle)                │
│  ├─ Progress over time chart                                │
│  └─ Plan vs. actual comparison                              │
│                                                             │
│  Zone D: Details on Demand (Bottom)                         │
│  ├─ Recent activity                                         │
│  ├─ Upcoming deadlines                                      │
│  └─ Team workload                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Involve Stakeholders Early

> "Stakeholder feedback early prevents surprise revelations late."

**Feedback Checkpoints**:
1. After defining purpose → "Did we capture your goals?"
2. After selecting KPIs → "Are these the right metrics?"
3. Before development → "Does this layout work?"
4. After prototype → "Can you find what you need?"

### Step 6: Validate with Users

**Don't Ask**: "Is this dashboard neat?"

**Do Ask**: Task-based questions:
- "Can you tell me if Project X is on track?"
- "What would you do first after seeing this?"
- "What information is missing?"

---

## Dashboard Types by User Role

### Role-Dashboard Matrix

| User Role | Dashboard Type | Focus | Refresh Rate |
|-----------|---------------|-------|--------------|
| **CFO/CEO** | Strategic | Financial health, OKRs | Weekly |
| **VP Product** | Portfolio | Cross-product progress | Daily |
| **Product Manager** | Operational | Project health, velocity | Real-time |
| **Team Lead** | Tactical | Today's work, blockers | Real-time |
| **Data Analyst** | Analytical | Trends, patterns, drill-downs | On-demand |

### Dashboard Designs by Role

#### Executive Dashboard (Leadership)

```
┌─────────────────────────────────────────────────────────────┐
│  Executive Overview                      Q4 2025            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PORTFOLIO HEALTH                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │  4 of 6    │ │  2 at risk │ │  85%       │               │
│  │  on track  │ │            │ │  on-time   │               │
│  │  ✅        │ │  ⚠️        │ │  delivery  │               │
│  └────────────┘ └────────────┘ └────────────┘               │
│                                                             │
│  OKR PROGRESS                                               │
│  Objective 1: █████████░░░░░░░ 60%                         │
│  Objective 2: ████████████░░░░ 80%                         │
│  Objective 3: ██████░░░░░░░░░░ 40% ⚠️ Behind               │
│                                                             │
│  ATTENTION NEEDED                                           │
│  • Product Y: 2 weeks behind schedule                       │
│  • Product Z: Key dependency unresolved                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Product Manager Dashboard (Operational)

```
┌─────────────────────────────────────────────────────────────┐
│  Product Dashboard: OAuth Feature                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OVERALL PROGRESS        │  TIMELINE                        │
│  ┌──────────────────┐    │  Dec 1 ──────────▶ Dec 15       │
│  │     75%          │    │     ████████████░░░░░            │
│  │  ████████░░░     │    │     Today: Day 10 of 15          │
│  │                  │    │                                  │
│  │  15 of 20 tasks  │    │  Status: On Track ✅             │
│  └──────────────────┘    │                                  │
│                                                             │
│  BY PHASE                                                   │
│  Research:   ██████████ 100%                               │
│  Planning:   ██████████ 100%                               │
│  Execution:  ████████░░  80%                               │
│  Review:     ██░░░░░░░░  20%                               │
│                                                             │
│  BLOCKERS (2)                                               │
│  🔴 Auth0 rate limit issue - @alice investigating          │
│  🟡 Design review pending - Due today                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Team Lead Dashboard (Tactical)

```
┌─────────────────────────────────────────────────────────────┐
│  Today's Focus                          Mon, Dec 1          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  YOUR TASKS                │  TEAM WORKLOAD                 │
│  ┌──────────────────────┐  │  Alice:  ████████░░ 4 tasks   │
│  │ 🔴 Fix auth bug      │  │  Bob:    ██████░░░░ 3 tasks   │
│  │ 🟡 Review PR #123    │  │  Carol:  ████░░░░░░ 2 tasks   │
│  │ ⚪ Update docs       │  │  Dave:   ██████████ 5 tasks ⚠️│
│  └──────────────────────┘  │                                │
│                                                             │
│  NEEDS ATTENTION                                            │
│  • PR #121 waiting for review (2 days)                     │
│  • Dave is overloaded - reassign?                          │
│                                                             │
│  COMPLETED TODAY: 3 tasks ✅                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Widget Library

### Metric Widgets

| Widget | Use Case | Data Needed |
|--------|----------|-------------|
| **Big Number** | Primary KPI | Single value + trend |
| **Progress Ring** | Completion % | Current/total |
| **Comparison** | Plan vs actual | Two values |
| **Spark Line** | Trend indicator | Time series |
| **Status Grid** | Multiple project status | Array of statuses |

### Chart Widgets

| Widget | Use Case | Best For |
|--------|----------|----------|
| **Line Chart** | Trends over time | Velocity, burndown |
| **Bar Chart** | Comparisons | Team performance |
| **Stacked Bar** | Composition | Work by phase |
| **Donut Chart** | Distribution | Status breakdown |
| **Gantt** | Timeline view | Project schedule |

### List Widgets

| Widget | Use Case | Features |
|--------|----------|----------|
| **Alert List** | Attention needed | Priority sorting |
| **Activity Feed** | Recent changes | Filtering |
| **Leaderboard** | Performance ranking | Gamification |
| **Upcoming** | Deadlines | Date grouping |

---

## Dashboard Configuration

### User Customization Options

```typescript
interface DashboardConfig {
  // Layout
  layout: 'fixed' | 'grid' | 'flexible'
  columns: 2 | 3 | 4

  // Widgets
  widgets: WidgetConfig[]

  // Filters
  defaultTimeRange: '7d' | '30d' | '90d' | 'custom'
  defaultFilters: Filter[]

  // Refresh
  refreshInterval: number  // seconds, 0 = manual
  showLastUpdated: boolean

  // Personalization
  savedViews: SavedView[]
  defaultView: string
}

interface WidgetConfig {
  id: string
  type: WidgetType
  position: { row: number; col: number; width: number; height: number }
  title: string
  dataSource: DataQuery
  visualization: VisualizationConfig
  interactivity: {
    clickAction: 'drill-down' | 'filter' | 'navigate' | 'none'
    hoverAction: 'tooltip' | 'highlight' | 'none'
  }
}
```

### Preset Dashboards

| Preset | Target User | Widgets |
|--------|-------------|---------|
| **Launch Tracker** | Launch Mode PM | Countdown, MVP progress, blockers |
| **Release Manager** | Dev Mode PM | Release progress, velocity, bugs |
| **Executive Summary** | Leadership | Portfolio health, OKRs, attention needed |
| **Team Workload** | Team Lead | Task distribution, capacity, blockers |
| **Personal Focus** | Individual | My tasks, deadlines, activity |

---

## Implementation Recommendations

### Phase 1: Core Dashboards
- [ ] Implement Executive Summary dashboard
- [ ] Build PM Operational dashboard
- [ ] Create Team Workload view
- [ ] Add Personal Focus dashboard

### Phase 2: Widget Library
- [ ] Build metric widgets (big number, progress, comparison)
- [ ] Implement chart widgets (line, bar, donut)
- [ ] Create list widgets (alerts, activity, upcoming)
- [ ] Add interactivity (drill-down, filtering)

### Phase 3: Customization
- [ ] Allow widget rearrangement
- [ ] Enable saved views
- [ ] Add custom date ranges
- [ ] Implement export/share

---

## Related Research

- [Progressive Disclosure UX](../core-research/progressive-disclosure-ux.md) - Role-based interfaces
- [Cross-Team Collaboration](../core-research/cross-team-collaboration.md) - Team-specific views
- [Flexibility vs Simplicity](flexibility-vs-simplicity.md) - Customization limits

---

## Sources

- UX Collective: B2B SaaS Dashboard Design
- Nielsen Norman Group: Dashboard Design Guidelines
- BCG: B2B SaaS Winning Strategies
- Geckoboard: Dashboard Best Practices

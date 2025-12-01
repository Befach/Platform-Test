# Progressive Disclosure & Role-Based UX Design

**Decision ID(s)**: UX-004
**Status**: Accepted
**Research Date**: 2025-12-01
**Last Reviewed**: 2025-12-01
**Category**: User Experience Patterns
**Key Finding**: 52% improvement in user adoption with role-based interfaces

---

## Executive Summary

Progressive disclosure and role-based interfaces are critical UX patterns for complex B2B SaaS products. Research shows that tailoring the interface to user roles dramatically improves adoption, while progressive disclosure prevents cognitive overload. Effective onboarding and in-app guidance can reduce user churn by up to 75% and support tickets by 25-87%.

---

## Key Statistics

| Statistic | Impact | Source |
|-----------|--------|--------|
| **75%** of new users churn within first week | Without effective onboarding | AnnounceKit SaaS Analysis |
| **63%** say onboarding support affects product perception | Customer experience research | CustomerThermometer |
| **52%** improvement in user adoption | Role-based interfaces | Enterprise PM platform case study |
| **67%** of B2B buyers abandon evaluations | Due to poor UX | UXPin Research |
| **90%** form completion rate | With on-blur validation | Baymard Institute |
| **22%** better form completion | On-blur vs on-change | Baymard Institute |
| **25-87%** support ticket reduction | With in-app resource centers | Userpilot Case Studies |
| **50%** of dev time spent on rework | Without good UX | Codilime Research |
| **40%** of employees feel disconnected | From company strategy | Gallup |
| **70%** of transformations fail | Due to lack of alignment | McKinsey |

---

## Industry Leaders Analyzed

Research shows how leading B2B platforms approach progressive disclosure and user experience:

### Linear (Engineering-First)
- **Speed obsession**: Everything < 100ms
- **Keyboard-first**: Power users never touch mouse
- **Triage Intelligence**: AI auto-assigns based on patterns
- **Cycles**: Time-boxed work periods for focus

### Notion (Cross-Functional)
- **Flexibility**: Same tool for docs, wikis, databases
- **Views**: Same data, different visualizations per team
- **Templates**: Team-specific starting points
- **Relations**: Connect any database to any other

### Figma (Design-Centric)
- **Real-time collaboration**: Multiple cursors, live editing
- **Dev handoff**: Different views for designers vs developers
- **Components**: Reusable, connected elements
- **Branching**: Explore without breaking main

### Productboard (Strategy-Connected)
- **Feedback-first**: Everything links to user requests
- **Insights**: Connect features to customer quotes
- **Portals**: Customer-facing roadmap views
- **Scoring**: Quantified prioritization

### Asana (Portfolio-Level)
- **Portfolios**: Cross-project visibility
- **Goals**: OKR alignment
- **Workload**: Resource management
- **Approvals**: Cross-team handoffs

---

## User Archetypes for B2B Products

Based on UXPin research, B2B products should design for four primary archetypes:

| Role | Needs | UX Pattern | Example Actions |
|------|-------|------------|-----------------|
| **Administrative Users** | Comprehensive control, configuration | Full access, settings panels | Team settings, billing, permissions |
| **Power Users** | Advanced features, efficiency | Progressive reveal, keyboard shortcuts | Bulk operations, custom filters, exports |
| **Occasional Users** | Guided experiences, clear navigation | Tooltips, step-by-step wizards | Create work item, view dashboard |
| **Executive Users** | High-level dashboards, summary info | Overview-first, drill-down optional | KPI dashboard, progress reports |

### Recommendations for Our Platform

```
Administrative User (Team Admin):
├─ Full workspace configuration
├─ Team member management
├─ Custom field builder
└─ Integration settings

Power User (Senior PM):
├─ Keyboard shortcuts enabled
├─ Advanced filters visible
├─ Bulk operations available
└─ Custom views/saved filters

Occasional User (Contributor):
├─ Simplified work item creation
├─ Guided task completion
├─ Contextual tooltips
└─ Pre-filled defaults

Executive User (Leadership):
├─ Dashboard-first view
├─ Summary metrics
├─ Drill-down on demand
└─ Export/share capabilities
```

---

## 8 Types of In-App Guidance

| Type | Purpose | Best For | Implementation |
|------|---------|----------|----------------|
| **Tooltips** | Small hints on hover/focus | Explaining UI elements | `trigger: 'hover'/'focus'` |
| **Walkthroughs** | Step-by-step guides | First-time user flows | `steps: [{target, action}]` |
| **Checklists** | Task lists toward goals | Onboarding completion | `items: [{label, condition}]` |
| **Modals** | Full-screen announcements | Feature launches, critical actions | `priority: 'blocking'` |
| **Banners** | Persistent messages | System updates, celebrations | `position: 'top'/'bottom'` |
| **Slideouts** | Partial screen panels | Tips, contextual help | `position: 'right'` |
| **Resource Centers** | Self-service hub | Knowledge base, tutorials | `searchEnabled: true` |
| **Micro Surveys** | Short contextual surveys | Real-time feedback, NPS | `trigger: 'after_action'` |

---

## Progressive Disclosure Best Practices

### The 3-Level Model

Based on research, implement disclosure in three levels:

```
Level 1: Essential (Always Visible)
├─ Name
├─ Type
└─ Description

Level 2: Common (One Click to Reveal)
├─ Effort
├─ Timeline
├─ Phase
└─ Assignee

Level 3: Advanced (Explicit Action Required)
├─ Custom fields
├─ Dependencies
├─ Strategy alignment
└─ Cross-team contexts
```

### Disclosure Triggers

| Level | Trigger Condition | Fields Shown |
|-------|-------------------|--------------|
| Level 1 | First visit / New user | Basic 3 fields |
| Level 2 | After 5+ work items created | + effort, timeline, phase |
| Level 3 | After 20+ work items OR explicit enable | All fields |

### Implementation Pattern

```typescript
const DISCLOSURE_RULES = {
  level_1: {
    trigger: 'first_visit',
    visible_fields: ['name', 'type', 'description'],
    hidden_fields: ['effort', 'phase', 'dependencies', 'custom_fields'],
    show_hint: "Keep it simple! You can add more details later.",
    auto_values: { effort: 'm', phase: 'research' }
  },
  level_2: {
    trigger: 'work_items_count >= 5',
    visible_fields: ['name', 'type', 'description', 'effort', 'phase', 'timeline'],
    hidden_fields: ['dependencies', 'custom_fields'],
    show_hint: "Pro tip: Effort estimates help with planning.",
    auto_values: { phase: 'planning' }
  },
  level_3: {
    trigger: 'work_items_count >= 20 || user_preference',
    visible_fields: 'all',
    hidden_fields: [],
    show_hint: null,  // Power user, no hints needed
    auto_values: {}
  }
}

// Alternative implementation with expander labels
const DISCLOSURE_LEVEL = {
  beginner: {
    visible: ['name', 'type', 'description'],
    autoValues: { effort: 'm', phase: 'research' },
    expanderLabel: 'Add more details (optional)'
  },
  intermediate: {
    visible: ['name', 'type', 'description', 'effort', 'timeline', 'phase'],
    autoValues: { phase: 'planning' },
    expanderLabel: 'Advanced options'
  },
  power: {
    visible: 'all',
    autoValues: {},
    expanderLabel: 'Custom fields'
  }
}
```

---

## Navigation Patterns

### Hub-and-Spoke Model

Research recommends the hub-and-spoke pattern for complex applications:

```
Dashboard Home (Hub)
├─ Essential functions visible immediately
├─ Key metrics at a glance
└─ Spokes (expandable/linkable):
    ├─ Work Items
    ├─ Timelines
    ├─ Team Settings
    ├─ Analytics
    └─ Integrations
```

### Summary-to-Detail Pattern

1. **Overview First**: Show aggregated information
2. **Expand for Context**: One click reveals more
3. **Deep Dive Available**: Full detail on demand

Example:
```
Work Item Card (Summary)
├─ Title, Status, Assignee
├─ [Expand] → Shows description, effort, timeline
└─ [Open] → Full detail page with all fields
```

---

## Role-Based Views Implementation

### Detect User Role

```typescript
// On signup/invite, detect or ask for role
const USER_ROLES = [
  { id: 'admin', name: 'Team Administrator', disclosure_level: 3 },
  { id: 'pm', name: 'Product Manager', disclosure_level: 2 },
  { id: 'engineer', name: 'Engineering', disclosure_level: 2 },
  { id: 'designer', name: 'Design', disclosure_level: 2 },
  { id: 'executive', name: 'Leadership', disclosure_level: 1 },
  { id: 'contributor', name: 'Contributor', disclosure_level: 1 },
]
```

### Pre-Configure Based on Role

| Role | Default View | Default Filters | Visible Panels |
|------|--------------|-----------------|----------------|
| Product Manager | Board | All work items | Strategy, Timeline, Tasks |
| Engineering | List | My assignments | Technical fields, Dependencies |
| Design | Gallery | Design work items | Design status, Figma links |
| Leadership | Dashboard | High-level metrics | Charts, Progress, Blockers |

---

## Contextual Help Patterns

### Inline Instructions (Always Visible)

Subtle text below or beside inputs:

```typescript
const FIELD_HINTS = {
  work_item_name: {
    launch_mode: "Keep it focused on user value",
    development_mode: "Include ticket reference if from feedback"
  },
  effort: {
    launch_mode: "Smaller is better for MVP - break down L/XL items",
    development_mode: "Use historical data: similar features took ~X days"
  },
  timeline: {
    launch_mode: "Only add to MVP if critical for launch",
    development_mode: "Consider impact vs effort for release planning"
  }
}
```

### Native Tooltips (On Hover)

```
┌─────────────────────────────────────────────────────────────┐
│ Effort: [M - Medium ▼]                                      │
│         ┌────────────────────────────────────────┐          │
│         │ ℹ️ Medium = 1-2 days of work           │          │
│         │                                        │          │
│         │ Based on your team's velocity:         │          │
│         │ • Last 5 Medium tasks: avg 1.8 days   │          │
│         │ • Completion rate: 94%                 │          │
│         │                                        │          │
│         │ Tip: If this feels bigger, break it    │          │
│         │ into smaller tasks first.              │          │
│         └────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Form Validation Timing

### Research Findings

| Timing | Completion Rate | User Perception |
|--------|-----------------|-----------------|
| On change (each keystroke) | 68% | "Annoying, distracting" |
| **On blur (leave field)** | **90%** | **"Helpful, non-intrusive"** |
| On submit only | 76% | "Too late, frustrating" |
| Hybrid (on blur + submit) | 92% | "Just right" |

### Recommended Implementation

```typescript
const VALIDATION_CONFIG = {
  // Default: validate on blur
  defaultTrigger: 'blur',

  // Real-time for specific cases only
  realTimeValidation: [
    'password_strength_meter',
    'username_availability',
    'duplicate_detection'
  ],

  // Error display rules
  errorDisplay: {
    showWhen: 'field_touched && invalid',
    hideWhen: 'field_valid || field_empty',
    style: 'inline_below_field',
    tone: 'helpful_not_critical'
  },

  // Success indicators
  successDisplay: {
    showWhen: 'field_touched && valid && significant_field',
    significantFields: ['name', 'timeline', 'effort'],
    message: 'checkmark_only'  // No text, just ✓
  }
}
```

---

## Empty State Design Principles

Empty states are critical moments that can guide users or cause them to abandon the product.

### Required Components

Every empty state must include:

1. **Visual**: Illustration or animation (not blank!)
2. **Headline**: What IS this space?
3. **Description**: Why is it empty?
4. **Benefit**: What value when filled?
5. **Primary CTA**: Main action to take
6. **Secondary CTA**: Alternative paths

### Example Empty State

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [Illustration of workspace]            │
│                                                     │
│           No work items yet                         │
│                                                     │
│   This is where your product features will live.    │
│   Start by adding your first work item to begin     │
│   planning your product roadmap.                    │
│                                                     │
│         [+ Create First Work Item]                  │
│                                                     │
│              Import from CSV                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Anti-Patterns

Avoid these common mistakes:

- ❌ Completely blank screens
- ❌ Generic "No data" messages
- ❌ Hidden create actions
- ❌ Fake/dummy data placeholders
- ❌ Error-style messaging for normal empty states

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Implement 3-level progressive disclosure
- [ ] Add role detection on signup/invite
- [ ] Create role-based default views
- [ ] Add field-level hints by mode
- [ ] Design empty states for all major views

### Phase 2: Enhancement
- [ ] Build smart defaults engine
- [ ] Add on-blur validation across forms
- [ ] Create contextual tooltips
- [ ] Implement hub-and-spoke navigation
- [ ] Add walkthroughs for key flows
- [ ] Create onboarding checklists

### Phase 3: Optimization
- [ ] Track disclosure level effectiveness
- [ ] A/B test field visibility
- [ ] Optimize based on user behavior data
- [ ] Add user preference overrides
- [ ] Build resource center
- [ ] Implement micro surveys for feedback

---

## Related Research

- [Cross-Team Collaboration](cross-team-collaboration.md) - Role-based team views
- [Customization Patterns](../supporting-research/customization-patterns.md) - When to add options
- [Onboarding Workflows](../supporting-research/onboarding-workflows.md) - Progressive onboarding
- [Ultra Deep Research Findings](ultra-deep-research-findings.md) - Deep dive into CX patterns

---

## Sources

- UXPin Research: B2B User Archetypes
- Baymard Institute: Form Validation Studies
- Enterprise PM Platform Case Study
- Codilime Research: UX Impact on Development
- AnnounceKit: SaaS Onboarding Analysis
- CustomerThermometer: Onboarding Support Impact
- Userpilot: In-App Guidance Case Studies
- Gallup: Employee Engagement Research
- McKinsey: Digital Transformation Studies
- Linear, Notion, Figma, Productboard, Asana: Product Analysis
- Parallel AI Search API: Industry Research

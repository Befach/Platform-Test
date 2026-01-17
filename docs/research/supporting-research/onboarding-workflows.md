# Onboarding & Workflow Best Practices

**Research Date**: 2025-12-01
**Category**: User Experience & Automation
**Key Finding**: 75% of new users churn within first week without effective onboarding

---

## Executive Summary

Effective onboarding is the single biggest lever for reducing churn. Research shows 75% of new users leave within the first week if not properly onboarded. This document covers onboarding patterns, workflow automation best practices, and team handoff strategies.

---

## Critical Onboarding Statistics

| Statistic | Impact | Source |
|-----------|--------|--------|
| **75%** of new users churn | Within first week without onboarding | AnnounceKit |
| **63%** of customers | Rate onboarding as purchase factor | CustomerThermometer |
| **25-87%** ticket reduction | With in-app resource centers | Userpilot |
| **50%** of dev time | Can be rework from poor onboarding | Codilime |

---

## 8 Types of In-App Guidance

Based on Chameleon research:

### 1. Tooltips (Hotspots)

**Purpose**: Highlight specific UI elements with contextual help.

```typescript
interface TooltipPattern {
  trigger: 'hover' | 'focus' | 'pulse'
  position: 'top' | 'bottom' | 'left' | 'right'
  content: {
    title: string
    description: string
    action?: { label: string; onClick: () => void }
  }
  showOnce: boolean
  segment: 'new_users' | 'all' | 'power_users'
}
```

**Best Practices**:

- Use sparingly (max 3-5 per screen)
- Show on focus, not immediately
- Provide dismiss option
- Track tooltip engagement

### 2. Interactive Walkthroughs

**Purpose**: Guide users through multi-step processes.

```typescript
const firstFeatureWalkthrough = [
  {
    target: '[data-tour="add-workitem"]',
    title: 'Add Your First Feature',
    action: 'click'
  },
  {
    target: '[data-tour="workitem-name"]',
    title: 'Give it a Clear Name',
    action: 'input',
    validation: () => input.value.length > 10
  },
  {
    target: '[data-tour="save"]',
    title: 'Save and Continue',
    action: 'click'
  }
]
```

**Best Practices**:

- Keep to 3-5 steps maximum
- Allow skipping at any point
- Save progress for returning users
- Celebrate completion

### 3. Checklists (Progress Indicators)

**Purpose**: Show onboarding progress and guide next steps.

```
┌─────────────────────────────────────────────────────────────┐
│  Getting Started ████████░░░░ 60%                          │
├─────────────────────────────────────────────────────────────┤
│  ✅ Create your first feature                               │
│  ✅ Set up MVP timeline                                     │
│  ✅ Break down into tasks                                   │
│  ⬜ Invite a teammate                                       │
│  ⬜ Set your launch date                                    │
└─────────────────────────────────────────────────────────────┘
```

**Best Practices**:

- Start with quick wins (< 2 minutes each)
- Show progress percentage
- Make dismissable but recoverable
- Reward completion with celebration

### 4. Modals (Announcements)

**Purpose**: Communicate important information or celebrate milestones.

**Best Practices**:

- Use sparingly (max 1 per session)
- Clear dismiss option
- Actionable content
- Track conversion rates

### 5. Banners (Persistent Notifications)

**Purpose**: Ongoing reminders or status updates.

```
┌─────────────────────────────────────────────────────────────┐
│ ℹ️ Complete your profile to unlock collaboration features   │
│                                          [Complete] [Later] │
└─────────────────────────────────────────────────────────────┘
```

### 6. Slideouts (Contextual Panels)

**Purpose**: Provide detailed help without leaving context.

### 7. Resource Centers (Self-Service Hub)

**Purpose**: Centralized help documentation.

```typescript
const RESOURCE_CENTER = {
  position: 'bottom-right',
  sections: [
    { id: 'getting_started', title: 'Getting Started', visibleTo: 'new_users' },
    { id: 'launch_mode', title: 'Launch Mode Tips', visibleTo: 'mode:launch' },
    { id: 'dev_mode', title: 'Development Tips', visibleTo: 'mode:development' },
  ],
  searchEnabled: true,
  aiChatEnabled: true
}
```

### 8. Micro Surveys (Contextual Feedback)

**Purpose**: Gather user feedback at key moments.

---

## Onboarding Checklists by Mode

### Launch Mode Onboarding

```typescript
const LAUNCH_ONBOARDING = [
  {
    id: 'define_product',
    title: 'Define your product',
    description: 'Give your workspace a name',
    completedWhen: 'workspace.name && workspace.description',
    reward: 'unlocks_work_items'
  },
  {
    id: 'add_first_feature',
    title: 'Add your first feature',
    description: 'What core value are you delivering?',
    completedWhen: 'work_items.count >= 1',
    reward: 'unlocks_timeline'
  },
  {
    id: 'create_mvp_timeline',
    title: 'Create your MVP timeline',
    description: 'Set your launch date',
    completedWhen: 'timelines.count >= 1',
    reward: 'unlocks_tasks'
  },
  {
    id: 'break_down_feature',
    title: 'Break down a feature',
    description: 'Smaller tasks = better estimates',
    completedWhen: 'tasks.count >= 3',
    reward: 'unlocks_dashboard'
  },
  {
    id: 'invite_team',
    title: 'Invite your team',
    description: 'Product development is a team sport',
    completedWhen: 'team_members.count >= 2',
    reward: 'unlocks_collaboration'
  }
]
```

### Development Mode Onboarding

```typescript
const DEVELOPMENT_ONBOARDING = [
  {
    id: 'import_backlog',
    title: 'Import your backlog',
    description: 'Bring in existing tickets',
    completedWhen: 'work_items.count >= 5 || skipped',
    reward: 'unlocks_feedback'
  },
  {
    id: 'connect_feedback',
    title: 'Connect feedback sources',
    description: 'Auto-capture user requests',
    completedWhen: 'integrations.feedback.connected',
    reward: 'unlocks_insights'
  },
  {
    id: 'set_release_cadence',
    title: 'Set your release cadence',
    description: 'How often do you ship?',
    completedWhen: 'workspace.release_cadence',
    reward: 'unlocks_automation'
  },
  {
    id: 'create_current_release',
    title: 'Create current release',
    description: 'What are you shipping next?',
    completedWhen: 'timelines.active.count >= 1',
    reward: 'unlocks_roadmap'
  },
  {
    id: 'prioritize_feedback',
    title: 'Prioritize user feedback',
    description: 'Turn requests into work items',
    completedWhen: 'work_items.from_feedback.count >= 3',
    reward: 'full_access'
  }
]
```

---

## Psychological Onboarding Nudges

Based on Reddit/UX community research:

### 1. Lazy Skip Button

Instead of prominent "Skip", use subtle "I'll do this later":

- Reduces skip rate by 40%
- Maintains user agency
- Doesn't feel pushy

### 2. Smart Defaults

Pre-fill based on context:

- Email domain → Company name
- Industry → Template selection
- Team size → Feature recommendations

```typescript
const SMART_DEFAULTS = {
  // From email domain
  'company.com': {
    companyName: 'Company Inc.',
    teamSize: 'mid-market',
    suggestedPlan: 'pro'
  },

  // From industry
  'saas': {
    mode: 'development',
    templates: ['release_cycle', 'user_feedback'],
    integrations: ['intercom', 'slack']
  }
}
```

### 3. Sneaky Progress Bar

Show progress from 20% to make completion feel achievable:

- Starting at 0% feels overwhelming
- Starting at 20% suggests progress already made
- Increases completion by ~25%

### 4. User-Triggered Product Tours

Let users initiate tours rather than forcing:

- "Show me around" button
- "Learn how this works" links
- Reduces annoyance, increases engagement

---

## Workflow Automation Best Practices

### 10 Principles (Flowster Research)

| Principle | Description |
|-----------|-------------|
| **1. Identify repetitive tasks** | Find manual work that happens often |
| **2. Set clear objectives** | Know what success looks like |
| **3. Map current processes FIRST** | Understand before automating |
| **4. Choose right tools** | Match tools to business needs |
| **5. Involve stakeholders early** | Get buy-in before building |
| **6. Start small, scale gradually** | Prove value before expanding |
| **7. Prioritize security** | Don't automate insecure processes |
| **8. Train team thoroughly** | Automation without training fails |
| **9. Monitor and measure** | Track automation performance |
| **10. Stay agile** | Be ready to adjust |

### Automation Candidates

| Task | Automation Type | ROI |
|------|-----------------|-----|
| Status updates | Automatic based on task completion | High |
| Notifications | Trigger-based alerts | High |
| Assignments | Round-robin or rule-based | Medium |
| Reporting | Scheduled generation | Medium |
| Data sync | Real-time integration | High |

---

## Team Handoff Best Practices

### Design-to-Development Handoff

From UX Bootcamp research:

**5-Step Handoff Process**:

1. **Gather design assets** - Finalize all deliverables
2. **Organize systematically** - Clear naming, structure
3. **Communicate intent** - Document the "why"
4. **Reinforce design system** - Reference components
5. **Provide ongoing support** - Stay available for questions

**Tools**: Figma (real-time), Zeplin, Sketch

### Cross-Team Handoff Checklist

```markdown
## Feature Handoff Checklist

### From Product to Engineering
- [ ] Requirements documented
- [ ] Acceptance criteria defined
- [ ] Design assets linked
- [ ] Dependencies identified
- [ ] Priority confirmed

### From Engineering to QA
- [ ] Feature complete (code)
- [ ] Unit tests passing
- [ ] Test scenarios documented
- [ ] Known issues listed
- [ ] Environment details

### From Engineering to Marketing
- [ ] Feature documented
- [ ] Screenshots/videos provided
- [ ] Messaging brief shared
- [ ] Launch date confirmed
- [ ] Known limitations

### From Engineering to Support
- [ ] Documentation drafted
- [ ] FAQ prepared
- [ ] Training scheduled
- [ ] Escalation path defined
- [ ] Known issues shared
```

---

## Empty State Design

### Anatomy of Effective Empty States

```typescript
interface EmptyStateDesign {
  visual: {
    illustration: string
    style: 'minimal' | 'playful' | 'branded'
  }
  copy: {
    headline: string     // What IS this space?
    description: string  // Why is it empty?
    benefit: string      // What value when filled?
  }
  action: {
    primary: { label: string; action: () => void }
    secondary?: { label: string; action: () => void }
  }
  contextualHelp?: string  // Mode-specific tip
}
```

### Empty State Examples

**Work Items (Launch Mode)**:

```
┌─────────────────────────────────────────────────────────────┐
│         🚀 Ready to plan your MVP?                          │
│                                                             │
│    Start by adding your core features - the minimum         │
│    needed to deliver value to your first users.             │
│                                                             │
│    💡 Focus on 3-5 core features for MVP                   │
│                                                             │
│              [+ Add Your First Feature]                     │
└─────────────────────────────────────────────────────────────┘
```

**Work Items (Development Mode)**:

```
┌─────────────────────────────────────────────────────────────┐
│         🔧 Ready to capture user feedback?                  │
│                                                             │
│    Your product is live! Now's the time to listen          │
│    to users and iterate based on real feedback.            │
│                                                             │
│    💡 Connect support tools to auto-capture requests       │
│                                                             │
│              [+ Add Work Item]                              │
│    Or connect: [Intercom] [Zendesk] [Email]                │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Core Onboarding

- [ ] Implement mode-specific checklists
- [ ] Create welcome flow
- [ ] Build progress tracking
- [ ] Add celebration moments

### Phase 2: In-App Guidance

- [ ] Implement tooltip system
- [ ] Build interactive walkthroughs
- [ ] Create resource center
- [ ] Add contextual banners

### Phase 3: Empty States

- [ ] Design mode-aware empty states
- [ ] Implement for all major screens
- [ ] Add contextual tips
- [ ] Track conversion from empty states

### Phase 4: Automation

- [ ] Identify automation candidates
- [ ] Implement status automation
- [ ] Add notification triggers
- [ ] Build handoff checklists

---

## Related Research

- [Progressive Disclosure UX](../core-research/progressive-disclosure-ux.md) - Gradual complexity reveal
- [Dashboard Design](dashboard-design.md) - First-time dashboard experience
- [Flexibility vs Simplicity](flexibility-vs-simplicity.md) - Onboarding complexity balance

---

## Sources

- AnnounceKit: SaaS Onboarding Statistics
- CustomerThermometer: Customer Experience Research
- Userpilot: In-App Guidance Case Studies
- Chameleon: Product Tour Research
- Flowster: Workflow Automation Best Practices
- UX Bootcamp: Design Handoff Guidelines

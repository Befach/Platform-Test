# UX Design Decisions

**Decision ID(s)**: UX-001, UX-002, UX-003
**Status**: Accepted
**Research Date**: 2025-12-01
**Last Reviewed**: 2025-12-01
**Next Review**: End of Week 9 / After initial user feedback on templates and menus
**Supersedes**: N/A
**Superseded By**: N/A

---

## Executive Summary

This document captures the UX design philosophy and specific decisions for the Product Lifecycle Management Platform. The core approach is "Guided Flexibility" - opinionated defaults with escape hatches for power users.

---

## Context

Building a B2B SaaS platform requires balancing multiple user types:
- New users need guidance without overwhelm
- Power users need efficiency and customization
- Different teams need different views of the same data
- Enterprise customers need configurability without chaos

Research findings (see [ultra-deep-research-findings.md](../core-research/ultra-deep-research-findings.md)):
- 75% of new users churn within first week without effective onboarding
- 67% of B2B buyers abandon evaluations due to poor UX
- 90% form completion with on-blur validation vs 68% with on-change

---

## Design Philosophy: Guided Flexibility

### The Spectrum

```
TOO RIGID ◄─────────────── ✓ SWEET SPOT ───────────────► TOO OPEN

• No customization         • Templates + Custom        • Blank slate
• One-size-fits-all        • Smart defaults            • No guidance
• Frustrates power users   • Override when needed      • Overwhelming

Example: Jira's rigid      Example: Linear's           Example: Raw
workflow requirements      opinionated simplicity      Notion/Airtable
```

### Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Templates First** | Pre-built configurations as starting points | Team templates (Engineering, Design, Product) |
| **Progressive Disclosure** | Show complexity gradually | 3-level field visibility |
| **AI as Assistant** | Suggest, don't block | Strategy alignment suggestions |
| **Visible Accountability** | Show gaps, don't hide them | Alignment score dashboards |
| **Flexible Enforcement** | Configurable strictness | Per-workspace settings |

---

## Decision 1: Team Configuration - Templates + Customization [UX-001]

### The Decision

Offer pre-built team templates (Engineering, Design, Product) as recommended starting points, with full customization available for power users.

### Why This Decision

**Research Backing**:
- BCG: "Build for your ideal customer, not every potential customer"
- 80% of teams fit into standard patterns
- Over-customization creates maintenance burden and inconsistent UX

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| Templates only | Fast setup, consistency | No flexibility | Power users frustrated |
| Custom only | Maximum flexibility | Slow setup, no guidance | Analysis paralysis |
| **Templates + Custom** | Best of both | Slightly more complex UI | ✅ SELECTED |

### Implementation

```typescript
type TemplateSource =
  | { type: 'system'; template_id: string }       // Use pre-built
  | { type: 'clone'; source_team_id: string }     // Copy existing
  | { type: 'blank' }                              // Start fresh
  | { type: 'custom'; template_id: string };       // User-saved template
```

### User Flow

1. **Option A**: Start from Template (80% of users)
   - Choose: Engineering, Design, or Product
   - Get pre-configured workflow states, fields
   - Customize later if needed

2. **Option B**: Build Your Own (20% of users)
   - Start blank or clone existing
   - Define custom workflow states
   - Add custom fields

3. **Option C**: Save as Template (Admins)
   - Save current config as reusable template
   - Share across organization

### Consequences

**Positive**:
- Fast onboarding for most users
- Consistent patterns across organizations
- Power users not limited

**Negative**:
- More complex settings UI
- Need to maintain template quality

**Risks**:
- Templates may not fit all industries
- Mitigation: Allow template customization

---

## Decision 2: Cross-Team Connections - Notion-Style Progressive Menu [UX-002]

### The Decision

Implement hierarchical menu system with hover/click reveal for cross-team connections, inspired by Notion's relation linking.

### Why This Decision

**Problem**: Cross-team dependencies are complex. Users need to:
1. Specify connection type (blocks, relates to, etc.)
2. Find the target item (potentially across teams)
3. Understand the relationship direction

**Research Backing**:
- Progressive disclosure reduces cognitive load
- Familiar pattern (Notion, Linear use similar)
- Hover preview + click for action is intuitive

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| Simple dropdown | Easy to implement | Hard to browse many items | Doesn't scale |
| Full page search | Powerful | Context switch | Disrupts flow |
| **Nested menus** | Scalable, familiar | More complex to build | ✅ SELECTED |

### Implementation

```
LEVEL 1: Basic Menu (Always Visible)
├── Blocks → [hover submenu]
├── Blocked By → [hover submenu]
├── Related → [hover submenu]
├── Parent/Child → [hover submenu]
└── Quick Link (paste URL)

LEVEL 2: Submenu (Hover/Click Reveal)
├── Search work items...
├── RECENT: [recent items]
└── BY TEAM: Engineering (12) → Design (5) → Product (8) →

LEVEL 3: Deep Navigation (Click to Enter)
├── ◂ Back
├── Filter items...
└── [Checkbox list of items]
```

### Key Behaviors

| Interaction | Action |
|-------------|--------|
| Hover on menu item | Shows submenu preview |
| Click on menu item | Enters full submenu view |
| Search anywhere | Global search across all teams |
| Recent items | Quick access to last connected items |
| Multi-select | Connect to multiple items at once |

### Consequences

**Positive**:
- Reduces cognitive load
- Scales to large item counts
- Familiar pattern

**Negative**:
- More complex to implement
- Touch devices need click-only mode

---

## Decision 3: Strategy Alignment - User-Constrained + AI-Assisted [UX-003]

### The Decision

AI suggests strategic alignment (OKRs, pillars), user has final control. Not blocking, but visible.

### Why This Decision

**Problem**: Features often ship without clear strategic connection. But blocking users creates friction.

**Research Backing**:
- "Strategy-connected execution" improves product outcomes
- Blocking workflows creates workarounds
- Visibility creates accountability without friction

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| No alignment | Maximum speed | Strategic drift | Defeats platform purpose |
| Mandatory alignment | Forces strategy | High friction, workarounds | Users hate it |
| Optional alignment | No friction | Often ignored | Defeats purpose |
| **AI-suggested, user-confirmed** | Low friction, high value | Requires AI investment | ✅ SELECTED |

### Implementation

**1. AI Suggests (Proactive)**
```
💡 "This work item seems related to OKR: Improve Onboarding"
[Link to OKR]  [Not Related]  [Remind Later]
```

**2. Soft Warning (When Missing)**
```
⚠️ No strategic alignment
This work item isn't connected to any OKR or initiative.
[Add Connection]  [Skip for Now]
```

**3. Dashboard Visibility (Accountability)**
```
📊 Strategy Alignment Score: 73%
✓ 22 work items aligned to OKRs
⚠️ 8 work items unaligned
[Review Unaligned Items]
```

**4. AI Bulk Suggestions (Periodic)**
```
🤖 AI found 5 items that might align with your OKRs:
• "User onboarding flow" → OKR: Improve Activation
• "Performance fixes" → OKR: Reduce Churn
[Review Suggestions]  [Dismiss]
```

### Enforcement Levels (Configurable)

| Level | Behavior | Best For |
|-------|----------|----------|
| **Off** | No alignment prompts | Early-stage, rapid iteration |
| **Suggest** (Default) | AI suggests, user can skip | Most teams |
| **Require** | Must link before closing | Enterprise, compliance |

### Consequences

**Positive**:
- Strategic alignment improves
- Low friction for users
- Visibility creates culture change

**Negative**:
- AI suggestions may be wrong
- Some users ignore soft warnings

**Risks**:
- Gaming the system (linking to any OKR)
- Mitigation: Alignment quality metrics

---

## Review Triggers

Reconsider these decisions when:
- [ ] User feedback indicates templates don't fit their industry
- [ ] Connection complexity becomes a barrier
- [ ] Strategy alignment is being gamed/ignored
- [ ] Enterprise customers need stricter enforcement

---

## Related Decisions

- [Linear Architecture](linear-architecture.md) - Entity hierarchy inspiration
- [Scope Decisions](scope-decisions.md) - What's in/out of scope
- [Plan File](../../.claude/plans/enumerated-stirring-starlight.md) - Full implementation plan

---

## Sources

- Parallel AI Ultra Research (see [ultra-deep-research-findings.md](../core-research/ultra-deep-research-findings.md))
- UXPin B2B SaaS Research
- BCG B2B Strategy Analysis
- Baymard Institute Form Validation Research

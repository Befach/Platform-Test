# ARCHITECTURE CONSOLIDATION - Master Reference

**Created**: 2025-12-11
**Purpose**: Single source of truth for platform architecture decisions
**Status**: CANONICAL - All other docs should align with this

---

## 1. CORE ARCHITECTURE PRINCIPLES

### 1.1 Two-Layer System (NOT Three)

```
WORKSPACE (Aggregation View)
├── mode: development | launch | growth | maintenance
├── Shows: Phase DISTRIBUTION across all work items
│   Example: "10 in research, 15 in planning, 8 in execution..."
│
└── WORK ITEMS (Each has own phase)
    ├── phase: research | planning | execution | review | complete
    │         ↑ THIS IS THE STATUS - No separate status field!
    │
    └── TIMELINE ITEMS (MVP/SHORT/LONG breakdowns)
        └── status: not_started | in_progress | blocked | completed | on_hold | cancelled
                    ↑ Separate status for task-level execution tracking
```

### 1.2 Critical Clarifications

| Concept | Correct Understanding | Common Misconception |
|---------|----------------------|---------------------|
| **Phase vs Status** | Phase IS the status for work items | They are separate fields |
| **Workspace Stage** | Shows AGGREGATION (distribution) | Has single stage value |
| **Timeline Status** | Separate field for execution tasks | Same as work item phase |
| **Design Thinking** | Methodology/framework for HOW to work | Lifecycle stages |

---

## 2. PHASE SYSTEM

### 2.1 Work Item Phases (= Status)

| Phase | Description | Focus Area |
|-------|-------------|------------|
| **research** | Initial exploration, problem understanding | Empathy, user needs |
| **planning** | Structure, scope, timeline breakdown | MVP definition, priorities |
| **execution** | Active development work | Building, coding, creating |
| **review** | Testing, validation, feedback | Quality, user testing |
| **complete** | Shipped, launched, done | Retrospective, metrics |

### 2.2 Timeline Item Status (Separate)

| Status | Description |
|--------|-------------|
| `not_started` | Task created but not begun |
| `in_progress` | Actively being worked on |
| `blocked` | Cannot proceed due to dependency |
| `completed` | Task finished |
| `on_hold` | Paused intentionally |
| `cancelled` | No longer needed |

### 2.3 Phase Transition Requirements

| From → To | Required Fields | Rationale |
|-----------|-----------------|-----------|
| research → planning | `purpose` filled, 1+ timeline items OR scope defined | Ready to plan |
| planning → execution | `target_release`, `acceptance_criteria`, `priority`, `estimated_hours` | Planning complete |
| execution → review | `progress_percent` >= 80, `actual_start_date` set | Work substantially done |
| review → complete | Feedback addressed, `status` = 'completed' | Approved |

### 2.4 Phase Upgrade Prompting

- **Threshold**: 80% field completion
- **Level**: Work item (NOT workspace)
- **Frequency**: Real-time as fields are filled
- **UI**: Banner in work item detail header

---

## 3. WORKSPACE MODES

### 3.1 Four Lifecycle Modes

| Mode | Description | Default Phase | Type Weight Focus |
|------|-------------|---------------|-------------------|
| **development** | Building from scratch | planning | feature (10), concept (9) |
| **launch** | Racing to release | execution | bug (10), feature (8) |
| **growth** | Iterating on feedback | review | enhancement (9), feature (7) |
| **maintenance** | Stability focus | execution | bug (10), enhancement (5) |

### 3.2 Workspace Does NOT Have Stage

- Workspace shows **phase distribution** across work items
- NO single `workspace.stage` or `workspace.launch_stage` field
- Dashboard displays: "Research: 10, Planning: 15, Execution: 8..."

---

## 4. DESIGN THINKING METHODOLOGY

### 4.1 What Design Thinking IS

Design Thinking is a **human-centered, iterative methodology** for HOW to implement ideas:
- NOT lifecycle stages
- NOT a replacement for phases
- GUIDES the approach at each phase

### 4.2 Major Frameworks

| Framework | Source | Key Stages |
|-----------|--------|------------|
| **d.school 5 Modes** | Stanford | Empathize → Define → Ideate → Prototype → Test |
| **Double Diamond** | British Design Council | Discover → Define → Develop → Deliver |
| **IDEO HCD** | IDEO | Inspiration → Ideation → Implementation |
| **Enterprise DT** | IBM | The Loop + Hills, Playbacks, Sponsor Users |

### 4.3 Mapping to Platform Phases

| Platform Phase | DT Methods | Guiding Questions |
|----------------|------------|-------------------|
| **Research** | Empathy Maps, Interviews, Personas | "Who has this problem?" |
| **Planning** | HMW Questions, Brainstorming, Hills | "What's the MVP?" |
| **Execution** | Rapid Prototyping, Storyboards | "How do we build it?" |
| **Review** | Usability Testing, Playbacks | "Does it solve the problem?" |
| **Complete** | Launch, Retrospectives | "What did we learn?" |

### 4.4 AI Integration

- AI ACTIVELY suggests Design Thinking methods
- Shows guiding questions as tooltips/hints
- References case studies for inspiration
- Knows other frameworks (Agile, Lean Startup, JTBD)

---

## 5. STRATEGY SYSTEM

### 5.1 Four-Tier Hierarchy (Phase-Agnostic)

```
ORGANIZATION STRATEGY (Pillars - Team-wide)
    └── TEAM STRATEGY (Objectives - Department)
         └── WORK ITEM STRATEGY (Alignment - Feature)
              └── PROCESS STRATEGY (Methodology - Execution)
```

### 5.2 Strategy Levels

| Level | Name | Fields | Display |
|-------|------|--------|---------|
| **Pillar** | Organization-wide theme | user_stories, case_studies, examples | Full tree view |
| **Objective** | Team/department goal | metrics, owners | Nested under pillar |
| **Key Result** | Measurable outcome | target, actual | Progress indicators |
| **Initiative** | Specific action | timeline, assignees | Task-like cards |

### 5.3 Different Displays by Context

**Organization Level**:
- Full strategy tree
- High-level metrics
- User stories, case studies
- Team-wide alignment

**Work Item Level**:
- Derived/aligned strategies only
- Alignment strength (weak/medium/strong)
- Specific requirements for this item
- Actionable view

### 5.4 New Database Fields (Pillar Level)

```sql
user_stories TEXT[]     -- User story examples
user_examples TEXT[]    -- Real user examples
case_studies TEXT[]     -- Reference case studies
```

---

## 6. PERIODIC ANALYSIS

### 6.1 Workspace Analysis

- **Frequency**: Every 2-3 days OR change-based
- **Purpose**: Detect phase mismatches, suggest upgrades
- **Trigger**: User button OR AI suggestion

### 6.2 Analysis Output

```typescript
interface WorkspaceAnalysis {
  phaseDistribution: Record<Phase, { count: number, percentage: number }>
  mismatchedItems: { workItemId, currentPhase, suggestedPhase, reason }[]
  upgradeOpportunities: { workItemId, canUpgradeTo, readinessPercent }[]
  healthScore: number  // 0-100
}
```

---

## 7. TAB & FIELD CONFIGURATION

### 7.1 Eight Tabs (Phase-Aware)

| Tab | research | planning | execution | review | complete |
|-----|:--------:|:--------:|:---------:|:------:|:--------:|
| Summary | ✓ | ✓ | ✓ | ✓ | ✓ |
| Inspiration | ✓ | ✓ | - | - | - |
| Resources | ✓ | ✓ | ✓ | ✓ | ✓ |
| Scope | - | ✓ | ✓ | ✓ | ✓ |
| Tasks | - | - | ✓ | ✓ | ✓ |
| Feedback | - | - | ✓ | ✓ | ✓ |
| Metrics | - | - | ✓ | ✓ | ✓ |
| AI Copilot | ✓ | ✓ | ✓ | ✓ | ✓ |

### 7.2 Three Field Groups (Progressive Disclosure)

**Group 1: Basic** (Always visible)
- name, purpose, type, tags

**Group 2: Planning** (Planning+, LOCKED from Execution+)
- target_release, acceptance_criteria, business_value, customer_impact
- strategic_alignment, estimated_hours, priority, stakeholders

**Group 3: Execution** (Execution+)
- actual_start_date, actual_end_date, actual_hours
- progress_percent, blockers

---

## 8. KNOWN ISSUES TO FIX

| Issue | Severity | Location |
|-------|----------|----------|
| Phase calculation overlap (line 167-172) | CRITICAL | workspace-phases.tsx |
| No phase transition validation | CRITICAL | work-item-types.ts |
| No phase transition timestamps | HIGH | All |
| progress_percent no 0-100 validation | MEDIUM | phase-aware-form-fields.tsx |

---

## 9. TERMINOLOGY GLOSSARY

| Term | Definition | NOT This |
|------|------------|----------|
| **Workspace** | A product/project container | Organization |
| **Work Item** | Feature, bug, enhancement, concept | Task |
| **Timeline Item** | MVP/SHORT/LONG breakdown task | Work Item |
| **Phase** | Work item lifecycle stage (= status) | Separate from status |
| **Mode** | Workspace lifecycle context | Stage |
| **Stage** | (Deprecated) Use "Phase" for work items | - |

---

## 10. IMPLEMENTATION SESSIONS

### Session 1: Fix Phase Bugs
- Fix calculation logic overlap
- Add transition validation
- Add timestamps

### Session 2: Phase Upgrade Prompts
- Create readiness calculator
- Build upgrade prompt UI
- Add guiding questions

### Session 3: Workspace Analysis
- Create analyzer service
- Build health card
- Add API endpoint

### Session 4: Design Thinking Integration
- Add methodology guidance
- Include other frameworks
- AI active integration

### Session 5: Strategy Customization
- Add new fields
- Org-level display component
- Work-item-level display component

### Session 6: Polish
- Feedback conversion
- Workspace card update
- E2E testing

---

**This document is the CANONICAL source. All other docs should reference or align with this.**

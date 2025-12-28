# ARCHITECTURE CONSOLIDATION - Master Reference

**Created**: 2025-12-11
**Updated**: 2025-12-28 (Security Sprint Complete + Next.js 16.1.1)
**Purpose**: Single source of truth for platform architecture decisions
**Status**: CANONICAL - All other docs should align with this

---

## 1. CORE ARCHITECTURE PRINCIPLES

### 1.1 Two-Layer System (NOT Three)

```
WORKSPACE (Aggregation View)
├── mode: development | launch | growth | maintenance
├── Shows: Phase DISTRIBUTION across all work items
│   Example: "5 features in build, 2 bugs in triage, 1 concept in research..."
│
└── WORK ITEMS (Each has own type-specific phase)
    ├── Feature: design → build → refine → launch (use is_enhancement flag for iterations)
    ├── Concept: ideation → research → validated | rejected
    ├── Bug: triage → investigating → fixing → verified
    │         ↑ PHASE IS THE STATUS - No separate status field!
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

## 2. PHASE SYSTEM (Type-Aware)

### 2.1 Type-Specific Phase Workflows

Different work item types follow different phase progressions:

```
FEATURE:
  design → build → refine → launch
  (Standard product development lifecycle)
  Note: Use is_enhancement flag for iterations/improvements

CONCEPT:
  ideation → research → validated | rejected
  (Exploration with terminal outcomes)

BUG:
  triage → investigating → fixing → verified
  (Issue resolution workflow)
```

### 2.2 Phase Definitions by Type

**Feature Phases** (includes enhancements via is_enhancement flag):
| Phase | Description | Focus Area |
|-------|-------------|------------|
| **design** | Research, ideation, problem definition | Empathy, user needs, scope planning |
| **build** | Active development work | Building, coding, creating |
| **refine** | Testing, validation, iteration | Quality, user testing, feedback |
| **launch** | Shipped, deployed, done | Release, retrospective, metrics |

**Concept Phases**:
| Phase | Description | Focus Area |
|-------|-------------|------------|
| **ideation** | Initial idea capture | Brainstorming, exploration |
| **research** | Validation research | User interviews, market analysis |
| **validated** | Concept approved (TERMINAL) | Ready for promotion to feature |
| **rejected** | Concept rejected (TERMINAL) | Not viable, lessons learned |

**Bug Phases**:
| Phase | Description | Focus Area |
|-------|-------------|------------|
| **triage** | Initial assessment | Severity, priority, assignment |
| **investigating** | Root cause analysis | Debugging, reproduction |
| **fixing** | Active fix development | Code changes, testing |
| **verified** | Fix confirmed (TERMINAL) | Deployed and validated |

### 2.3 Terminal Phases

Some phases are **terminal** - they cannot progress further:
- `validated` / `rejected` for concepts
- `verified` for bugs
- `launch` for features/enhancements

### 2.4 Default Phases by Type

| Type | Default Phase | Rationale |
|------|---------------|-----------|
| feature | design | Start with planning (use is_enhancement flag for iterations) |
| concept | ideation | Start with exploration |
| bug | triage | Start with assessment |

### 2.5 Phase Mapping (Migration Reference)

| Old (5-Phase) | New (4-Phase) | Rationale |
|--------------|---------------|-----------|
| research, planning | **design** | Combined into single ideation phase |
| execution | **build** | Clearer active development |
| review | **refine** | Better reflects iteration nature |
| complete | **launch** | Action-oriented completion |

### 2.6 Timeline Item Status (Separate)

| Status | Description |
|--------|-------------|
| `not_started` | Task created but not begun |
| `in_progress` | Actively being worked on |
| `blocked` | Cannot proceed due to dependency |
| `completed` | Task finished |
| `on_hold` | Paused intentionally |
| `cancelled` | No longer needed |

### 2.7 Phase Transition Requirements

**Feature/Enhancement Transitions**:
| From → To | Required Fields | Rationale |
|-----------|-----------------|-----------|
| design → build | `purpose` filled, 1+ timeline items OR scope defined | Ready to build |
| build → refine | `progress_percent` >= 80, `actual_start_date` set | Work substantially done |
| refine → launch | Feedback addressed, review approved (if enabled) | Ready to ship |

**Concept Transitions**:
| From → To | Required Fields | Rationale |
|-----------|-----------------|-----------|
| ideation → research | `purpose` filled, hypothesis defined | Ready to validate |
| research → validated | Research complete, viable confirmed | Concept approved |
| research → rejected | Research complete, not viable | Concept rejected |

**Bug Transitions**:
| From → To | Required Fields | Rationale |
|-----------|-----------------|-----------|
| triage → investigating | Priority set, assigned | Ready to investigate |
| investigating → fixing | Root cause identified | Ready to fix |
| fixing → verified | Fix deployed, review approved (if enabled) | Bug resolved |

### 2.8 Phase Upgrade Prompting

- **Threshold**: 80% field completion for current phase
- **Level**: Work item (NOT workspace)
- **Frequency**: Real-time as fields are filled
- **UI**: Banner in work item detail header
- **Type-Aware**: Different thresholds per type/phase combination

---

## 3. WORKSPACE MODES

### 3.1 Four Lifecycle Modes

| Mode | Description | Default Phase | Type Weight Focus |
|------|-------------|---------------|-------------------|
| **development** | Building from scratch | design | feature (10), concept (9) |
| **launch** | Racing to release | build | bug (10), feature (8) |
| **growth** | Iterating on feedback | refine | enhancement (9), feature (7) |
| **maintenance** | Stability focus | build | bug (10), enhancement (5) |

### 3.2 Workspace Does NOT Have Stage

- Workspace shows **phase distribution** across work items
- NO single `workspace.stage` or `workspace.launch_stage` field
- Dashboard displays: "Design: 10, Build: 15, Refine: 8..."

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
| **Design** | Empathy Maps, Interviews, Personas, HMW Questions | "Who has this problem? What's the MVP?" |
| **Build** | Rapid Prototyping, Storyboards, Sprints | "How do we build it?" |
| **Refine** | Usability Testing, Playbacks, Iteration | "Does it solve the problem?" |
| **Launch** | Release Planning, Retrospectives | "What did we learn?" |

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

## 6. VERSIONING SYSTEM

### 6.1 Version Chain Concept

Work items can be **enhanced** to create new versions, forming a version chain:

```
Original Feature (v1)
    └── Enhanced Feature (v2)
         └── Enhanced Feature (v3)
              └── ...
```

### 6.2 Database Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | INTEGER | Version number (starts at 1) |
| `enhances_work_item_id` | TEXT | Reference to previous version |
| `version_notes` | TEXT | Description of what changed |

### 6.3 Version Chain API

**GET /api/work-items/[id]/versions**
```typescript
{
  versions: WorkItemVersion[],
  current_id: string,
  original_id: string,
}
```

**POST /api/work-items/[id]/enhance**
```typescript
// Request
{
  title?: string,       // Optional new title
  description?: string, // Optional new description
  version_notes: string // Required: what changed
}

// Response
{
  work_item: WorkItem,      // New enhanced version
  previous_version: WorkItem // Original
}
```

### 6.4 Concept Promotion

Validated concepts can be **promoted** to features:

```
Concept (validated) → Feature (v1)
    └── enhances_work_item_id = concept.id
```

**UI Flow**:
1. Concept reaches `validated` phase
2. Promotion dialog appears
3. User can:
   - **Promote to Feature**: Creates linked feature
   - **Keep as Concept**: Stays as validated concept

### 6.5 Version History UI

- Shown as a **Versions tab** in work item detail
- Only visible when `version > 1` or linked items exist
- Timeline view showing version chain
- Click to navigate between versions

---

## 7. REVIEW PROCESS

### 7.1 Detached Review System

Review is **optional and detached** from phases:
- Can be enabled/disabled per work item
- Required before certain phase transitions (when enabled)
- Applies to bugs (fixing → verified) and features (refine → launch)

### 7.2 Review States

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `null` | Review not requested | Enable review |
| `pending` | Awaiting review | Approve / Reject |
| `approved` | Review passed | Proceed to next phase |
| `rejected` | Review failed | Re-request after changes |

### 7.3 Database Fields

| Field | Type | Description |
|-------|------|-------------|
| `review_enabled` | BOOLEAN | Whether review is required |
| `review_status` | TEXT | Current review status |
| `review_requested_at` | TIMESTAMPTZ | When review was requested |
| `review_completed_at` | TIMESTAMPTZ | When review was completed |
| `review_reason` | TEXT | Rejection reason (if rejected) |

### 7.4 Review Permissions

| Action | Allowed Roles |
|--------|---------------|
| Enable/disable review | owner, admin, member |
| Request review | owner, admin, member |
| Approve review | owner, admin |
| Reject review | owner, admin |

### 7.5 Phase Blocking

When `review_enabled = true`:
- **Bugs**: Cannot move from `fixing` to `verified` without approval
- **Features**: Cannot move from `refine` to `launch` without approval
- UI shows blocking message with review status

### 7.6 Review API

**POST /api/work-items/[id]/review**
```typescript
// Request
{
  action: 'approve' | 'reject' | 'request',
  reason?: string  // Required for reject
}

// Response
{
  work_item: WorkItem,
  review_history: ReviewAction[]
}
```

---

## 8. PERIODIC ANALYSIS

### 8.1 Workspace Analysis

- **Frequency**: Every 2-3 days OR change-based
- **Purpose**: Detect phase mismatches, suggest upgrades
- **Trigger**: User button OR AI suggestion

### 8.2 Analysis Output

```typescript
interface WorkspaceAnalysis {
  phaseDistribution: Record<Phase, { count: number, percentage: number }>
  mismatchedItems: { workItemId, currentPhase, suggestedPhase, reason }[]
  upgradeOpportunities: { workItemId, canUpgradeTo, readinessPercent }[]
  healthScore: number  // 0-100
}
```

---

## 9. TAB & FIELD CONFIGURATION

### 9.1 Eight Tabs (Phase-Aware)

| Tab | design | build | refine | launch |
|-----|:------:|:-----:|:------:|:------:|
| Summary | ✓ | ✓ | ✓ | ✓ |
| Inspiration | ✓ | - | - | - |
| Resources | ✓ | ✓ | ✓ | ✓ |
| Scope | ✓ | ✓ | ✓ | ✓ |
| Tasks | - | ✓ | ✓ | ✓ |
| Feedback | - | ✓ | ✓ | ✓ |
| Metrics | - | ✓ | ✓ | ✓ |
| AI Copilot | ✓ | ✓ | ✓ | ✓ |

### 9.2 Three Field Groups (Progressive Disclosure)

**Group 1: Basic** (Always visible)
- name, purpose, type, tags

**Group 2: Planning** (Design+, some fields LOCKED from Build+)
- target_release, acceptance_criteria, business_value, customer_impact
- strategic_alignment, estimated_hours, priority, stakeholders

**Group 3: Execution** (Build+)
- actual_start_date, actual_end_date, actual_hours
- progress_percent, blockers

---

## 10. KNOWN ISSUES (Session 1 Complete)

| Issue | Status | Resolution |
|-------|--------|------------|
| Phase calculation overlap | ✅ FIXED | workspace-phases.tsx updated |
| No phase transition validation | ✅ FIXED | isValidPhaseTransition() added |
| No phase transition timestamps | ✅ FIXED | phase_transitions JSONB added |
| progress_percent no 0-100 validation | ✅ FIXED | Validation in API routes |
| 5-phase to 4-phase migration | ✅ DONE | Database migration applied |

---

## 11. TERMINOLOGY GLOSSARY

| Term | Definition | NOT This |
|------|------------|----------|
| **Workspace** | A product/project container | Organization |
| **Work Item** | Feature, bug, enhancement, concept | Task |
| **Timeline Item** | MVP/SHORT/LONG breakdown task | Work Item |
| **Phase** | Work item lifecycle stage (= status), type-specific | Separate from status |
| **Mode** | Workspace lifecycle context | Stage |
| **Stage** | (Deprecated) Use "Phase" for work items | - |
| **Terminal Phase** | Phase that cannot progress further (validated, rejected, verified, launch) | Intermediate phase |
| **Version** | An iteration of a work item (v1, v2, etc.) | Copy/duplicate |
| **Enhancement** | New version that builds on previous | Replacement |
| **Review** | Optional approval process before phase transitions | Mandatory gate |
| **Concept Promotion** | Converting validated concept to feature | Type change |

---

## 12. IMPLEMENTATION SESSIONS

### Session 1: Fix Phase Bugs ✅ COMPLETE (2025-12-13)
- ✅ Fixed calculation logic overlap
- ✅ Migrated from 5-phase to 4-phase system
- ✅ Added transition validation (isValidPhaseTransition)
- ✅ Added phase_transitions JSONB column
- ✅ Applied database migration

### Session 2: Phase Upgrade Prompts ✅ COMPLETE (2025-12-16)
- ✅ Created readiness calculator (`calculatePhaseReadiness`)
- ✅ Built phase upgrade banner UI (`PhaseUpgradeBanner`)
- ✅ Added guiding questions system (`GuidingQuestionsTooltip`)
- ✅ Implemented `usePhaseReadiness` hook

### Session 3: Type-Specific UI Components ✅ COMPLETE (2025-12-18)
- ✅ Updated `PhaseContextBadge` with type awareness
- ✅ Created `ConceptPromotionDialog` for validated concepts
- ✅ Created `BugReviewToggle` for review mode
- ✅ Updated `WorkItemDetailHeader` with type-aware config

### Session 4: Versioning System ✅ COMPLETE (2025-12-19)
- ✅ Created `VersionHistory` component
- ✅ Implemented `useWorkItemVersions` hook
- ✅ Created `/api/work-items/[id]/enhance` endpoint
- ✅ Created `/api/work-items/[id]/versions` endpoint
- ✅ Added Versions tab to work item detail

### Session 5: Review Process ✅ COMPLETE (2025-12-19)
- ✅ Created `review-process.ts` configuration
- ✅ Built `ReviewStatus` component
- ✅ Created `/api/work-items/[id]/review` endpoint
- ✅ Updated phase permissions with review blocking
- ✅ Integrated feedback conversion with phase selector

### Session 6: Polish & Testing ✅ COMPLETE (2025-12-20)
- ✅ Updated `workspace-card.tsx` with type-aware distribution
- ✅ Created `TypeAwarePhaseDistribution` component
- ✅ Created E2E tests: `type-phases.spec.ts`
- ✅ Created E2E tests: `versioning.spec.ts`
- ✅ Created E2E tests: `review-process.spec.ts`
- ✅ Updated documentation (ARCHITECTURE_CONSOLIDATION.md)

### Security Sprint ✅ COMPLETE (2025-12-28)
- ✅ 67 CodeQL security vulnerabilities resolved
- ✅ 316 ESLint/TypeScript issues fixed
- ✅ Next.js upgraded to 16.1.1
- ✅ Greptile AI code review configured
- ✅ CI/CD optimization (concurrency, Vercel ignoreCommand)

---

**This document is the CANONICAL source. All other docs should reference or align with this.**

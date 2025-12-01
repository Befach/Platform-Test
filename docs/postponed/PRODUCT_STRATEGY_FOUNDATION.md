# 🎯 Product Strategy Foundation

**Created**: 2025-12-01
**Status**: PLANNING COMPLETE - Postponed for Implementation
**Priority**: MEDIUM (Valuable but not blocking launch)
**Target**: After Workspace Modes & AI Integration (Week 8+)
**Estimated Effort**: ~20 hours

[← Back to Postponed Features](README.md)

---

## Executive Summary

This feature introduces a **strategic foundation layer** that connects every product decision to customer, problem, and value proposition. It enables teams to:

1. **Define strategy once** at workspace level
2. **Align work items** to strategy components automatically
3. **Prioritize intelligently** based on strategic fit
4. **Generate context** for marketing, research, and onboarding
5. **Maintain focus** on what matters most

### Key Changes Overview

| Current State | Future State |
|---------------|--------------|
| No strategic context | Strategy defines workspace direction |
| Manual prioritization | AI-calculated priority from strategy alignment |
| Generic work items | Work items show customer impact & pillar fit |
| Ad-hoc research questions | Auto-generated questions based on target customers |
| Manual onboarding context | Strategy overview for new hires |

---

## 5-Question Framework Validation

| # | Question | Status | Notes |
|---|----------|--------|-------|
| 1 | **Data Dependencies**: Do required tables/APIs exist? | ⏳ | Needs workspace modes and AI integration |
| 2 | **Integration Points**: Are module APIs stable? | ⏳ | Work items, research, AI assistant needed |
| 3 | **Standalone Value**: Does this provide standalone value? | ✅ | Major strategic alignment feature |
| 4 | **Schema Finalized**: Are tables/columns finalized? | ✅ | Complete SQL defined |
| 5 | **Testing Feasibility**: Can this be fully tested? | ⏳ | After AI integration complete |

**Result**: ⏳ **POSTPONE** until after Workspace Modes and AI Integration

---

## Why Postponed

Strategic alignment is powerful but requires:
- ❌ **Workspace Modes** - Strategy differs by workspace type (product vs project)
- ❌ **AI Integration** - Auto-alignment and priority scoring need AI APIs
- ❌ **Work Item Detail Page** - Strategic alignment needs display location
- ❌ **Research Module** - Auto-generated research questions need research system
- ✅ Can be implemented as **non-breaking addition** later

### Dependencies (Must Complete First)

- [⏳] Workspace Modes (determine strategy fields per mode)
- [⏳] Work Item Detail Page (display alignment scores)
- [⏳] AI Integration (Week 7) - for alignment suggestions and priority scoring
- [⏳] Research Module (Week 7) - for auto-generated research questions
- [⏳] Marketing context system - for messaging generation

### When to Implement

**Target**: After Week 8 (after Workspace Modes and AI Integration)

**Review Trigger**: After Workspace Modes complete and AI Integration stable

---

## Strategy Components

### 1. Target Customer

**Purpose**: Define who you're building for (and who you're NOT for)

```typescript
interface TargetCustomer {
  primary: {
    persona_name: string          // "Enterprise Product Manager"
    job_title: string              // "Senior PM at B2B SaaS companies"
    pain_points: string[]          // ["Manual roadmap management", "Lack of stakeholder visibility"]
    goals: string[]                // ["Ship faster", "Align teams"]
    decision_criteria: string[]    // ["Ease of use", "Integration with existing tools"]
  }
  secondary?: {
    persona_name: string           // "Startup Founder"
    job_title: string
    pain_points: string[]
    goals: string[]
  }[]
  anti_personas?: string[]         // ["Individual developers", "Non-tech businesses"]
}
```

**Impact Scoring**:
- **Primary Customer**: 5 (highest priority)
- **Secondary Customer**: 3 (medium priority)
- **Anti-Persona**: -5 (avoid building for them)
- **No Impact**: 0 (neutral)

---

### 2. Core Problem

**Purpose**: Define the primary problem and competitive landscape

```typescript
interface CoreProblem {
  primary_problem: string          // "Product teams lack visibility into roadmap progress"
  related_problems: string[]       // ["Stakeholder misalignment", "Poor prioritization"]
  current_alternatives: {
    competitor_tools: string[]     // ["Productboard", "Aha!", "Linear"]
    workarounds: string[]          // ["Excel spreadsheets", "Google Docs"]
    why_insufficient: string       // "Too complex, too expensive, missing collaboration"
  }
}
```

---

### 3. Value Proposition

**Purpose**: Define what makes you unique

```typescript
interface ValueProposition {
  unique_differentiator: string    // "AI-powered mind mapping → feature planning in one platform"
  key_benefits: string[]           // ["60% faster planning", "Built-in stakeholder review", "Live collaboration"]
  positioning_statement: string    // "The only PLM platform that connects ideation to execution"
}
```

---

### 4. Strategic Pillars

**Purpose**: Core values and trade-off guidelines

```typescript
interface StrategicPillar {
  name: string                     // "Speed over features"
  description: string              // "Ship fast, iterate based on feedback"
  trade_off_guideline: string      // "When in doubt, launch with MVP and add features later"
  what_we_wont_do: string[]        // ["Build complex enterprise features before validating demand"]
}

// Example Pillars:
// 1. "Speed over features" - Ship fast, iterate
// 2. "Collaboration over individual productivity" - Multi-user focus
// 3. "Simplicity over power-user features" - Ease of use wins
// 4. "AI-assisted over manual" - Automate where possible
```

**Alignment Scoring**:
- **Supports Pillar**: +2 points
- **Neutral**: 0 points
- **Conflicts with Pillar**: -2 points

---

### 5. Success Metrics

**Purpose**: Define what success looks like

```typescript
interface SuccessMetrics {
  north_star_metric: {
    name: string                   // "Weekly Active Workspaces"
    definition: string             // "# of workspaces with 3+ users active per week"
    target_value: number           // 1000 WAW by Q2
  }
  supporting_metrics: {
    name: string                   // "Time to first feature"
    definition: string
    target_value: number
  }[]
  anti_metrics?: {                 // What we'll sacrifice
    name: string                   // "Feature count"
    why_sacrificing: string        // "We optimize for quality, not quantity"
  }[]
}
```

**North Star Impact Estimation**:
- Work items estimate expected impact: "+15% signup conversion", "-10% churn"

---

## How Strategy Flows Through Platform

### 1. Work Item Creation → Strategy Alignment

When creating a work item, user selects:

```typescript
interface StrategyAlignment {
  target_customer_impact: {
    primary: 1 | 2 | 3 | 4 | 5      // 5 = critical for primary customer
    secondary?: 1 | 2 | 3 | 4 | 5   // Impact on secondary personas
  }
  pillar_alignment: {
    pillar_id: string
    alignment: 'supports' | 'neutral' | 'conflicts'
  }[]
  north_star_impact: {
    estimated_change: string        // "+15% signup conversion"
    confidence: 'low' | 'medium' | 'high'
    reasoning: string
  }
}
```

**UI Component**: Strategy Alignment Card (3-section form)

```
┌─────────────────────────────────────────┐
│ Strategy Alignment                      │
├─────────────────────────────────────────┤
│ Customer Impact:                        │
│ ▸ Primary (Enterprise PM):    ⭐⭐⭐⭐⭐ │
│ ▸ Secondary (Startup Founder): ⭐⭐⭐☆☆ │
│                                         │
│ Strategic Pillars:                      │
│ ✓ Speed over features:      [Supports] │
│ ✓ AI-assisted over manual:  [Supports] │
│ ○ Simplicity over power:    [Neutral]  │
│                                         │
│ North Star Impact:                      │
│ Expected: +15% signup conversion        │
│ Confidence: ⭐⭐⭐ Medium                 │
│ Reasoning: Reduces onboarding friction │
└─────────────────────────────────────────┘
```

---

### 2. AI-Calculated Priority Score

**Formula**:

```typescript
function calculatePriorityScore(
  workItem: WorkItem,
  strategy: ProductStrategy
): number {
  let score = 0

  // Customer impact (max 50 points)
  const primaryImpact = workItem.strategy_alignment.target_customer_impact.primary || 0
  const secondaryImpact = workItem.strategy_alignment.target_customer_impact.secondary || 0
  score += (primaryImpact * 8) + (secondaryImpact * 3)

  // Pillar alignment (max 30 points)
  const pillarScore = workItem.strategy_alignment.pillar_alignment.reduce((sum, pa) => {
    if (pa.alignment === 'supports') return sum + 10
    if (pa.alignment === 'conflicts') return sum - 5
    return sum
  }, 0)
  score += Math.min(pillarScore, 30)

  // North star impact (max 20 points)
  const confidenceMultiplier = {
    'high': 1.0,
    'medium': 0.7,
    'low': 0.4
  }[workItem.strategy_alignment.north_star_impact.confidence]

  const estimatedImpact = parseFloat(
    workItem.strategy_alignment.north_star_impact.estimated_change.match(/[+-]?\d+/)?.[0] || '0'
  )
  score += Math.min(Math.abs(estimatedImpact) * confidenceMultiplier, 20)

  return Math.round(score)
}
```

**Priority Tiers**:
- **90-100 points**: Critical (must have)
- **70-89 points**: High (should have)
- **50-69 points**: Medium (nice to have)
- **< 50 points**: Low (consider postponing)

---

### 3. Research Phase → Auto-Generated Questions

When entering Research phase, AI generates research questions based on target customers:

```typescript
interface ResearchQuestion {
  question: string
  target_persona: string           // Which customer persona this targets
  research_type: 'user_interview' | 'survey' | 'competitive_analysis' | 'market_research'
  priority: 'high' | 'medium' | 'low'
}

// Example auto-generated questions for "Enterprise PM" persona:
[
  {
    question: "How do Enterprise PMs currently manage stakeholder visibility?",
    target_persona: "Enterprise Product Manager",
    research_type: "user_interview",
    priority: "high"
  },
  {
    question: "What tools do Enterprise PMs use for roadmap planning today?",
    target_persona: "Enterprise Product Manager",
    research_type: "competitive_analysis",
    priority: "high"
  },
  {
    question: "What's the average team size for roadmap collaboration?",
    target_persona: "Enterprise Product Manager",
    research_type: "survey",
    priority: "medium"
  }
]
```

**AI Prompt Template**:
```
Given this target customer persona:
- Name: {{persona_name}}
- Job Title: {{job_title}}
- Pain Points: {{pain_points}}
- Goals: {{goals}}

Generate 10 research questions we should answer to validate our understanding
of this persona. Categorize by research type (user interview, survey, etc).
```

---

### 4. Marketing Alignment → Auto-Generated Messaging Context

Generate messaging guidelines from strategy:

```typescript
interface MessagingContext {
  headline_formula: string         // "[Benefit] for [Target Customer] who [Pain Point]"
  key_messages: string[]           // Pulled from value proposition
  differentiation_talking_points: string[]
  customer_quotes_needed: string[] // Based on personas
  case_study_angles: string[]      // Based on goals
}

// Example:
{
  headline_formula: "AI-powered PLM for Enterprise PMs who need stakeholder visibility",
  key_messages: [
    "Ship 60% faster with integrated ideation-to-execution workflow",
    "Built-in stakeholder review eliminates status meetings",
    "Real-time collaboration keeps teams aligned"
  ],
  differentiation_talking_points: [
    "Only platform that connects mind mapping to feature planning",
    "No complex setup - launch in 5 minutes",
    "AI assistant handles repetitive planning tasks"
  ],
  customer_quotes_needed: [
    "Enterprise PM talking about time savings",
    "Startup Founder on ease of use vs competitors"
  ],
  case_study_angles: [
    "How [Company] reduced roadmap planning time by 60%",
    "How [Company] improved stakeholder alignment with real-time visibility"
  ]
}
```

---

### 5. New Hire Onboarding → Strategy Overview

When inviting team members, show strategy summary:

```
Welcome to [Workspace Name]!

🎯 Who We're Building For:
Primary: Enterprise Product Managers at B2B SaaS companies
Secondary: Startup Founders managing small teams

❌ Core Problem:
Product teams lack visibility into roadmap progress, leading to
stakeholder misalignment and poor prioritization.

✨ How We're Different:
The only PLM platform that connects AI-powered ideation (mind mapping)
to feature planning and execution - all in one place.

🏛️ Our Strategic Pillars:
1. Speed over features - Ship fast, iterate based on feedback
2. Collaboration over individual productivity - Multi-user focus
3. Simplicity over power-user features - Ease of use wins
4. AI-assisted over manual - Automate where possible

📊 What We Measure:
North Star: Weekly Active Workspaces (1000 by Q2)
Supporting: Time to first feature, Team collaboration rate

Now you know WHY we're building what we're building! 🚀
```

---

## Database Schema

### New: `product_strategies` Table

```sql
CREATE TABLE product_strategies (
    id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text),
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Target Customer
    primary_customer JSONB NOT NULL,        -- { persona_name, job_title, pain_points[], goals[], decision_criteria[] }
    secondary_customers JSONB[],            -- Same structure as primary
    anti_personas TEXT[],                   -- ["Individual developers", "Non-tech businesses"]

    -- Core Problem
    primary_problem TEXT NOT NULL,
    related_problems TEXT[],
    current_alternatives JSONB,             -- { competitor_tools[], workarounds[], why_insufficient }

    -- Value Proposition
    unique_differentiator TEXT NOT NULL,
    key_benefits TEXT[],
    positioning_statement TEXT,

    -- Strategic Pillars
    pillars JSONB[] NOT NULL,               -- [{ name, description, trade_off_guideline, what_we_wont_do[] }]

    -- Success Metrics
    north_star_metric JSONB NOT NULL,       -- { name, definition, target_value }
    supporting_metrics JSONB[],             -- [{ name, definition, target_value }]
    anti_metrics JSONB[],                   -- [{ name, why_sacrificing }]

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),

    UNIQUE(workspace_id)                    -- One strategy per workspace
);

-- Indexes
CREATE INDEX idx_product_strategies_workspace ON product_strategies(workspace_id);
CREATE INDEX idx_product_strategies_team ON product_strategies(team_id);

-- RLS
ALTER TABLE product_strategies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view strategies in their team" ON product_strategies
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage strategies" ON product_strategies
    FOR ALL USING (team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));
```

### Modify: `work_items` Table

```sql
ALTER TABLE work_items
ADD COLUMN strategy_alignment JSONB;

-- Structure: {
--   target_customer_impact: { primary: 1-5, secondary: 1-5 },
--   pillar_alignment: [{ pillar_id, alignment: 'supports' | 'neutral' | 'conflicts' }],
--   north_star_impact: { estimated_change, confidence, reasoning },
--   calculated_priority_score: 0-100
-- }

CREATE INDEX idx_work_items_strategy_alignment ON work_items USING GIN (strategy_alignment);
```

---

## Migration Strategy

### Phase 1: Add New Tables (Non-Breaking)
1. Create `product_strategies` table
2. Add `strategy_alignment` column to `work_items` (nullable)
3. Strategy setup is **optional** - platform works without it

### Phase 2: Strategy Setup Wizard
1. **Step 1**: Target Customer (primary persona)
2. **Step 2**: Core Problem & Differentiator
3. **Step 3**: Strategic Pillars (select from presets or custom)
4. **Step 4**: North Star Metric

### Phase 3: Work Item Alignment
1. Add Strategy Alignment card to Work Item Detail Page
2. Show alignment suggestions based on AI analysis
3. Calculate priority scores
4. Sort Work Board by strategic priority

### Phase 4: Integration with Other Modules
1. Research module: Auto-generate questions
2. Marketing context: Generate messaging guidelines
3. Onboarding: Show strategy summary
4. AI Assistant: Use strategy as context for suggestions

---

## UI Components

### 1. Strategy Setup Wizard

**Location**: Workspace Settings > Strategy

**4-Step Process**:

#### Step 1: Target Customer
```
Who are you building for?

Primary Customer (required):
┌───────────────────────────────────────┐
│ Persona Name: [Enterprise PM        ] │
│ Job Title:    [Senior PM at B2B SaaS] │
│ Pain Points:  [+ Add pain point     ] │
│   • Manual roadmap management         │
│   • Lack of stakeholder visibility    │
│ Goals:        [+ Add goal           ] │
│   • Ship faster                       │
│   • Align teams                       │
│ Decision Criteria: [+ Add criteria  ] │
│   • Ease of use                       │
│   • Integration with existing tools   │
└───────────────────────────────────────┘

Secondary Customers (optional): [+ Add Secondary Customer]

Anti-Personas (who you're NOT building for):
• [Individual developers          ] [×]
• [Non-tech businesses            ] [×]
[+ Add Anti-Persona]
```

#### Step 2: Core Problem & Value
```
What problem are you solving?

Primary Problem (required):
┌───────────────────────────────────────┐
│ Product teams lack visibility into    │
│ roadmap progress and stakeholder      │
│ alignment                             │
└───────────────────────────────────────┘

Current Alternatives:
Competitor Tools:  [Productboard], [Aha!], [Linear]
Workarounds:      [Excel], [Google Docs]

Why Insufficient?
┌───────────────────────────────────────┐
│ Too complex, too expensive, missing   │
│ real-time collaboration               │
└───────────────────────────────────────┘

Your Unique Differentiator (required):
┌───────────────────────────────────────┐
│ Only platform connecting AI-powered   │
│ mind mapping to feature execution     │
└───────────────────────────────────────┘
```

#### Step 3: Strategic Pillars
```
What are your core values?

Choose 3-5 pillars that guide your decisions:

☑ Speed over features
  "Ship fast, iterate based on feedback"
  Trade-off: Launch MVP, add features later

☑ Collaboration over individual productivity
  "Multi-user focus, real-time sync"
  Trade-off: Optimize for teams, not solo users

☐ Simplicity over power-user features
  "Ease of use wins"
  Trade-off: Hide advanced features behind Pro tier

☑ AI-assisted over manual
  "Automate repetitive tasks"
  Trade-off: Invest in AI before manual workflows

[+ Create Custom Pillar]
```

#### Step 4: Success Metrics
```
How will you measure success?

North Star Metric (required):
┌───────────────────────────────────────┐
│ Name:       [Weekly Active Workspaces]│
│ Definition: [# of workspaces with 3+  │
│              users active per week   ]│
│ Target:     [1000 by Q2 2025        ] │
└───────────────────────────────────────┘

Supporting Metrics (optional): [+ Add Metric]
• Time to first feature: < 10 minutes
• Team collaboration rate: 80%+ multi-user workspaces

Anti-Metrics (what you'll sacrifice):
• Feature count (optimize for quality, not quantity)
[+ Add Anti-Metric]
```

---

### 2. Strategy Alignment Card (Work Item Detail Page)

**Location**: Work Item Detail > Summary Tab (after Description)

```
┌─────────────────────────────────────────┐
│ 🎯 Strategy Alignment            [Edit] │
├─────────────────────────────────────────┤
│ Customer Impact:                        │
│ ▸ Enterprise PM (Primary):    ⭐⭐⭐⭐⭐ │
│ ▸ Startup Founder (Secondary): ⭐⭐⭐☆☆ │
│                                         │
│ Strategic Pillars:                      │
│ ✓ Speed over features       [Supports]  │
│ ✓ AI-assisted over manual   [Supports]  │
│ ○ Simplicity over power     [Neutral]   │
│                                         │
│ North Star Impact: +15% signup conversion│
│ Confidence: Medium ⭐⭐⭐                 │
│ Reasoning: Reduces onboarding friction │
│                                         │
│ 📊 Calculated Priority: 87/100 (High)  │
└─────────────────────────────────────────┘
```

---

### 3. Alignment Score Dashboard

**Location**: Workspace > Strategy Dashboard (new page)

**Metrics**:
- % of work items with strategy alignment defined
- Average customer impact score
- Strategic pillar coverage (which pillars are most/least supported)
- Estimated north star impact (sum of all work items)

```
┌─────────────────────────────────────────┐
│ Strategy Dashboard                      │
├─────────────────────────────────────────┤
│ Alignment Coverage:        78% (23/30)  │
│ Avg Customer Impact:       4.2/5.0      │
│                                         │
│ Strategic Pillar Support:               │
│ ▰▰▰▰▰▰▰▰▰▰ Speed over features    (12) │
│ ▰▰▰▰▰▰▰▱▱▱ AI-assisted           (8)  │
│ ▰▰▰▰▱▱▱▱▱▱ Collaboration          (5)  │
│ ▰▰▱▱▱▱▱▱▱▱ Simplicity             (3)  │
│                                         │
│ North Star Impact (Est):                │
│ +45% signup conversion across all items │
│                                         │
│ ⚠️ 7 work items conflict with pillars  │
│ [Review Conflicts]                      │
└─────────────────────────────────────────┘
```

---

### 4. AI Alignment Suggestions

When creating/editing work item, AI suggests alignment:

```
┌─────────────────────────────────────────┐
│ 💡 AI Alignment Suggestions             │
├─────────────────────────────────────────┤
│ Based on work item description, we      │
│ suggest:                                │
│                                         │
│ Customer Impact:                        │
│ ▸ Enterprise PM: ⭐⭐⭐⭐⭐ (High)        │
│   Reason: Directly addresses stakeholder│
│   visibility pain point                 │
│                                         │
│ Strategic Pillars:                      │
│ ✓ Speed over features: Supports         │
│   Reason: Reduces manual status updates │
│ ✓ Collaboration: Supports               │
│   Reason: Real-time team feature        │
│                                         │
│ [Accept All] [Customize]                │
└─────────────────────────────────────────┘
```

---

## API Endpoints (New)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workspaces/[id]/strategy` | Get workspace strategy |
| POST | `/api/workspaces/[id]/strategy` | Create/update strategy |
| DELETE | `/api/workspaces/[id]/strategy` | Delete strategy |
| POST | `/api/work-items/[id]/strategy-alignment` | Update work item alignment |
| POST | `/api/work-items/[id]/calculate-priority` | Recalculate priority score |
| GET | `/api/workspaces/[id]/strategy-dashboard` | Get dashboard metrics |
| POST | `/api/work-items/[id]/ai-alignment-suggestions` | Get AI alignment suggestions |

---

## TypeScript Types

```typescript
// next-app/src/lib/types/strategy-types.ts

export interface TargetCustomer {
  persona_name: string
  job_title: string
  pain_points: string[]
  goals: string[]
  decision_criteria: string[]
}

export interface CoreProblem {
  primary_problem: string
  related_problems: string[]
  current_alternatives: {
    competitor_tools: string[]
    workarounds: string[]
    why_insufficient: string
  }
}

export interface ValueProposition {
  unique_differentiator: string
  key_benefits: string[]
  positioning_statement: string
}

export interface StrategicPillar {
  id: string
  name: string
  description: string
  trade_off_guideline: string
  what_we_wont_do: string[]
}

export interface SuccessMetric {
  name: string
  definition: string
  target_value: number | string
}

export interface ProductStrategy {
  id: string
  team_id: string
  workspace_id: string

  // Target Customer
  primary_customer: TargetCustomer
  secondary_customers?: TargetCustomer[]
  anti_personas?: string[]

  // Core Problem
  primary_problem: string
  related_problems?: string[]
  current_alternatives?: {
    competitor_tools: string[]
    workarounds: string[]
    why_insufficient: string
  }

  // Value Proposition
  unique_differentiator: string
  key_benefits?: string[]
  positioning_statement?: string

  // Strategic Pillars
  pillars: StrategicPillar[]

  // Success Metrics
  north_star_metric: SuccessMetric
  supporting_metrics?: SuccessMetric[]
  anti_metrics?: Array<{
    name: string
    why_sacrificing: string
  }>

  created_at: string
  updated_at: string
  created_by: string
}

export interface StrategyAlignment {
  target_customer_impact: {
    primary: 1 | 2 | 3 | 4 | 5
    secondary?: 1 | 2 | 3 | 4 | 5
  }
  pillar_alignment: Array<{
    pillar_id: string
    alignment: 'supports' | 'neutral' | 'conflicts'
  }>
  north_star_impact: {
    estimated_change: string        // "+15% signup conversion"
    confidence: 'low' | 'medium' | 'high'
    reasoning: string
  }
  calculated_priority_score?: number  // 0-100, calculated by AI
}

export interface WorkItemWithStrategy extends WorkItem {
  strategy_alignment?: StrategyAlignment
}
```

---

## Implementation Priority

| Priority | Item | Time Est |
|----------|------|----------|
| **P1** | Create `product_strategies` table + RLS | 1h |
| **P1** | Add `strategy_alignment` column to work_items | 0.5h |
| **P2** | Strategy Setup Wizard (4 steps) | 5h |
| **P2** | Strategy Alignment Card (Work Item Detail) | 3h |
| **P3** | AI alignment suggestions API | 4h |
| **P3** | Priority score calculation | 2h |
| **P3** | Strategy Dashboard | 3h |
| **P4** | Research auto-generation integration | 2h |
| **P4** | Marketing context generation | 1.5h |
| **P4** | Onboarding strategy overview | 1h |

**Total Time**: ~20 hours

---

## Testing Strategy

### Unit Tests (Jest)
- `calculatePriorityScore()` - Test priority calculation formula
- Strategy validation (required fields, valid enums)
- Customer impact scoring logic
- Pillar alignment scoring

### Integration Tests
- Strategy setup wizard flow (4 steps)
- Work item alignment CRUD operations
- AI alignment suggestions API
- Priority recalculation on alignment change

### E2E Tests (Playwright)
- Complete strategy setup wizard
- Add strategy alignment to work item
- Accept AI alignment suggestions
- View strategy dashboard
- Sort work board by strategic priority

---

## Performance Considerations

### Caching Strategy
- Cache strategy at workspace level (React Query, 5min stale time)
- Cache calculated priority scores (recalculate on alignment change only)
- Debounce AI suggestions API (500ms)

### Optimization
- Load strategy once per workspace session
- Lazy load strategy dashboard charts
- Index `strategy_alignment` JSONB column for filtering
- Precompute pillar alignment counts (background job)

---

## Backward Compatibility

### Keep Working
- All existing work items (no strategy alignment is fine)
- Workspaces without strategy (optional feature)
- Priority still works without alignment (manual sorting)

### Graceful Degradation
- If strategy not defined: Hide alignment UI
- If AI unavailable: Manual alignment input only
- If north star impact unparseable: Show as 0 impact

---

## Review Trigger

**When**: After Workspace Modes implementation complete + AI Integration stable

**Who**: Product team + development team

**Questions to Ask**:
1. Are workspace modes stable and well-defined?
2. Is AI Integration working reliably?
3. Is the Work Item Detail Page finalized?
4. Do users understand the value of strategic alignment?
5. Is there demand for better prioritization tools?

**Decision Matrix**:
- If "YES" to all 5: ✅ **PROCEED** with implementation
- If "NO" to question 4 or 5: 🔍 **RUN USER RESEARCH** first
- If "NO" to question 1-3: ⏸️ **POSTPONE** further

---

## Related Documentation

- [Implementation Plan - Postponed Features](../implementation/postponed-features.md)
- [Workspace Modes (Postponed)](WORKSPACE_MODES.md) - DEPENDENCY
- [Week 7: AI Integration](../implementation/week-7-ai-analytics.md) - DEPENDENCY
- [Work Item Detail Page](../implementation/work-item-detail-page.md) - DEPENDENCY
- [CLAUDE.md - Project Guidelines](../../CLAUDE.md)

---

## Alternative Approaches Considered

### Option 1: Simple Tags (Rejected)
- Just add `strategy_tags[]` to work items
- **Why Rejected**: Too generic, no structured impact scoring

### Option 2: OKR Integration (Postponed for Later)
- Full OKR system with Key Results tracking
- **Why Postponed**: Too complex for MVP, consider after Strategy Foundation proven

### Option 3: External Strategy Link (Rejected)
- Just link to external doc (Notion, Google Docs)
- **Why Rejected**: No integration, can't auto-generate context

---

**Last Reviewed**: December 1, 2025
**Next Review**: After Workspace Modes complete

[← Back to Postponed Features](README.md)

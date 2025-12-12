# 🚀 Product Lifecycle Management Platform - IMPLEMENTATION PLAN
**Next.js 15 + TypeScript | 100% Open Source | 12 Weeks (Revised)**

**Version:** 1.4
**Last Updated:** 2025-12-10
**Original Plan**: 8 weeks (2025-01-11)
**Status:** 🟡 In Progress - Week 7 (90% complete)

---

## 📋 NAVIGATION

This implementation plan has been split into multiple files for better token efficiency (83% savings when loading specific weeks).

### 📖 Overview & Architecture
- **[Database Schema](database-schema.md)** - Multi-tenant PostgreSQL schema, RLS policies, all tables
- **[Postponed Features](postponed-features.md)** - Mind Map enhancements and other deferred features

### 📅 Weekly Implementation Guides
- **[Week 1-2: Foundation & Multi-Tenancy](week-1-2-foundation.md)** - Next.js setup, auth, teams, workspaces
- **[Week 3: Mind Mapping](week-3-mind-mapping.md)** - ReactFlow canvas, 5 node types, AI integration, convert to features
- **[Week 4: Feature Planning & Dependencies](week-4-dependencies.md)** - Feature CRUD, dependency graph, critical path analysis
- **[Week 5: External Review System](week-5-review-system.md)** - Invite-based, public links, iframe embeds, feedback
- **[Week 6: Timeline & Execution](week-6-timeline-execution.md)** - Gantt chart, team assignment, **Work Item Detail Page (8-Tab Structure)**
- **[Week 7: AI Integration & Analytics](week-7-ai-analytics.md)** - AI chat, agentic mode, **Feedback Module**, **Integrations**, **AI Visual Prototypes**
- **[Workspace Timeline Architecture Refactor](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md)** - Major architecture update (post-Week 7)
- **[Week 8: Billing, Testing & Launch](week-8-billing-testing.md)** - Stripe, E2E tests, documentation, production deployment

### 🎨 Feature Implementation Guides
- **[Work Board 3.0](work-board-3.0.md)** - **Parts 1-10**: Work Board views, Gantt, filters, **Work Item Detail Page**, **Feedback Module**, **Integrations**, **AI Visual Prototypes**

---

## 🎯 OVERVIEW

### Mission
Transform single-user roadmap tool into **comprehensive Product Lifecycle Management Platform** where teams can:

1. **Research & Ideate** - AI-powered mind mapping, web search, knowledge base
2. **Plan & Structure** - Features, timeline, dependencies
3. **Review & Gather Feedback** - Stakeholder input (invite-based, public links, iframe)
4. **Execute Collaboratively** - Team assignment, task tracking, real-time collaboration
5. **Test & Iterate** - User feedback collection and analysis
6. **Measure Success** - Analytics, expected vs actual performance tracking

### Key Differentiators
- **100% Open Source** (MIT License) - All code on GitHub
- **Phase-Based Workflow** - Guides teams through product lifecycle
- **Modular Architecture** - Enable/disable modules per workspace
- **AI-First** - Deep AI integration at every step
- **Real-time Collaboration** - Like Figma, but for product management
- **Mind Mapping** - Visual ideation to structured features

### Revenue Model
- **Open Source Core** - Free forever, self-hostable
- **Hosted SaaS Service** - Convenience, managed infrastructure
- **Pricing** - $40/team + $5/user (5 included), 1,000 AI msgs/user/month

---

## 💰 PRICING MODEL (FINAL)

### Free Tier - Perfect for Small Teams
**Cost:** $0/month

**Limits:**
- Up to **5 team members**
- **50 AI messages/month** (shared across team)
- **1GB storage**

**Features:**
- ✅ All core modules (Research, Mind Map, Features, Timeline)
- ✅ Basic AI assistance (Claude Haiku)
- ✅ Export to CSV/JSON
- ❌ No real-time collaboration
- ❌ No external review/feedback system
- ❌ Limited analytics (basic dashboards only)
- ❌ No agentic AI mode

### Pro Tier - For Growing Teams
**Cost:**
- **$40/month base** (includes 5 users)
- **+$5/user/month** for additional users

**AI Limits:**
- **1,000 AI messages per user per month**
- Example: 10-person team = 10,000 total messages/month
- ~33 messages per user per day

**Storage:**
- **50GB** (attachments, exports, backups)

**Features:**
- ✅ Everything in Free tier
- ✅ **Unlimited team members** ($5/user beyond 5)
- ✅ **Real-time collaboration** (live cursors, presence indicators)
- ✅ **External review system** (invites, public links, iframe embeds)
- ✅ **Advanced analytics** (custom dashboards, AI insights)
- ✅ **Agentic AI mode** (tool calling, batch operations)
- ✅ **Priority support** (24h response time)
- ✅ **Version history** (feature change tracking)
- ✅ **API access** (custom integrations)

### Custom High-End AI Models (Optional Add-on)
**For users wanting premium AI models:**
- User provides **their own API key**
- Access to: GPT-4o, Claude Opus, Gemini Pro, o1, etc.
- Usage charged **directly to user's account**
- We don't subsidize premium model costs

**Settings:**
```
Settings → AI → Custom Models
[ ] Enable custom models (requires API key)
OpenRouter API Key: [_______________]
Default Custom Model: [GPT-4o ▼]
```

### Pricing Examples

| Team Size | Monthly Cost | Per-User Cost | Total AI Messages |
|-----------|-------------|---------------|-------------------|
| 5 users   | $40         | $8.00         | 5,000/month       |
| 6 users   | $45         | $7.50         | 6,000/month       |
| 10 users  | $65         | $6.50         | 10,000/month      |
| 15 users  | $90         | $6.00         | 15,000/month      |
| 20 users  | $115        | $5.75         | 20,000/month      |
| 50 users  | $265        | $5.30         | 50,000/month      |

**Scales beautifully** - Larger teams get better per-user pricing!

### Cost Sustainability Analysis

**Scenario: 100 Teams (30% Pro conversion rate)**
- Free teams: 70 × $0 = $0
- Pro teams: 30 teams (avg 8 users) = 30 × $55 = **$1,650/month revenue**

**Monthly Costs:**
- Vercel Pro: $20
- Supabase Pro: $25
- Stripe fees (3%): ~$50
- AI costs (Pro users, avg 500 msgs): ~$150
- Email (Resend): $20
- Monitoring (Sentry): $29
- **Total:** ~$294/month

**Profit:** $1,650 - $294 = **$1,356/month** ✅

**Scenario: 1,000 Teams (30% Pro)**
- Revenue: 300 × $55 = **$16,500/month**
- Costs: Vercel $20 + Supabase $599 + Stripe $495 + AI $1,500 + Monitoring $29 = **~$2,643/month**
- **Profit:** $13,857/month 💰💰💰

**Highly sustainable and profitable!**

---

## 🏗️ PLATFORM ARCHITECTURE

### Workspace = Project Model

```
Organization (Team)
├── Workspace 1: "Mobile Fitness App"
│   ├── Mode: Development
│   ├── Phase Distribution: 10 research, 15 planning, 8 execution...
│   ├── Enabled Modules: [Research, Mind Map, Features, Dependencies, Timeline, Execution, Collaboration]
│   ├── Work Items: 25
│   └── Team Members: 8
│
├── Workspace 2: "AI Platform Research"
│   ├── Mode: Launch
│   ├── Phase Distribution: 5 research, 3 planning, 2 execution...
│   ├── Enabled Modules: [Research, Mind Map, AI Assistant]
│   ├── Work Items: 5 (ideas)
│   └── Team Members: 3
│
└── Workspace 3: "Web Dashboard v2"
    ├── Mode: Growth
    ├── Phase Distribution: 0 research, 2 planning, 8 review...
    ├── Enabled Modules: [Features, Timeline, Review, Analytics]
    ├── Work Items: 15
    └── Team Members: 5
```

### Two-Layer Architecture

**WORKSPACE LAYER** - Aggregation view showing distribution across all work items:
```
workspace
├── mode: development | launch | growth | maintenance
└── Shows: Phase DISTRIBUTION across all work items
    Example: "10 in research, 15 in planning, 8 in execution..."
```

**WORK ITEM LAYER** - Each work item has its own phase (= status):
```
work_item
├── phase: research | planning | execution | review | complete
│         ↑ THIS IS THE STATUS - No separate status field!
│
└── timeline_items (MVP/SHORT/LONG breakdowns)
    └── status: not_started | in_progress | blocked | completed | on_hold | cancelled
                ↑ Separate status for task-level execution tracking
```

### Work Item Phases (= Status)

| Phase | Description | Focus Area |
|-------|-------------|------------|
| **research** | Initial exploration, problem understanding | Empathy, user needs |
| **planning** | Structure, scope, timeline breakdown | MVP definition, priorities |
| **execution** | Active development work | Building, coding, creating |
| **review** | Testing, validation, feedback | Quality, user testing |
| **complete** | Shipped, launched, done | Retrospective, metrics |

### Workspace Modes

| Mode | Description | Default Phase | Type Weight Focus |
|------|-------------|---------------|-------------------|
| **development** | Building from scratch | planning | feature (10), concept (9) |
| **launch** | Racing to release | execution | bug (10), feature (8) |
| **growth** | Iterating on feedback | review | enhancement (9), feature (7) |
| **maintenance** | Stability focus | execution | bug (10), enhancement (5) |

**Note:** Workspace does NOT have a single stage - it shows phase DISTRIBUTION across work items.

**Each phase auto-enables recommended modules** (can be customized in Settings → Modules).

---

## 🎯 PHASE SYSTEM ENHANCEMENT

The Phase System Enhancement implements intelligent phase management with Design Thinking methodology integration, workspace health analysis, and phase upgrade prompting.

### Overview

The phase system operates on a **two-layer architecture**:

1. **Workspace Layer**: Shows aggregated phase distribution (NOT a single stage)
2. **Work Item Layer**: Each work item has its own phase (which IS its status)

### Phase Transition Requirements

Phase upgrades are based on field completion and readiness:

| From → To | Required Fields | Rationale |
|-----------|-----------------|-----------|
| research → planning | `purpose` filled, 1+ timeline items OR scope defined | Ready to plan |
| planning → execution | `target_release`, `acceptance_criteria`, `priority`, `estimated_hours` | Planning complete |
| execution → review | `progress_percent` >= 80, `actual_start_date` set | Work substantially done |
| review → complete | Feedback addressed, `status` = 'completed' | Approved |

### Phase Upgrade Prompting

**When:** Real-time as fields are filled
**Threshold:** 80% field completion for target phase
**Level:** Work item (NOT workspace)
**UI:** Banner in work item detail header

Example:
```
⬆️ This work item is 85% ready to move to Execution phase
   Missing: target_release, estimated_hours
   [Review Requirements] [Upgrade Now]
```

### Design Thinking Integration

Design Thinking is a **human-centered, iterative methodology** that guides HOW to work at each phase:

| Platform Phase | DT Methods | Guiding Questions |
|----------------|------------|-------------------|
| **Research** | Empathy Maps, Interviews, Personas | "Who has this problem?" |
| **Planning** | HMW Questions, Brainstorming, Hills | "What's the MVP?" |
| **Execution** | Rapid Prototyping, Storyboards | "How do we build it?" |
| **Review** | Usability Testing, Playbacks | "Does it solve the problem?" |
| **Complete** | Launch, Retrospectives | "What did we learn?" |

**AI actively suggests Design Thinking methods** based on current phase and shows guiding questions as tooltips/hints.

### Workspace Analysis

**Frequency:** Every 2-3 days OR change-based (user-triggered button OR AI suggestion)

**Purpose:** Detect phase mismatches, suggest upgrades, calculate health score

**Analysis Output:**
```typescript
interface WorkspaceAnalysis {
  phaseDistribution: Record<Phase, { count: number, percentage: number }>
  mismatchedItems: { workItemId, currentPhase, suggestedPhase, reason }[]
  upgradeOpportunities: { workItemId, canUpgradeTo, readinessPercent }[]
  healthScore: number  // 0-100
}
```

### Implementation Sessions

The Phase System Enhancement is implemented across 6 focused sessions:

#### **Session 1: Fix Phase Bugs**
- Fix calculation logic overlap (lines 167-172 in workspace-phases.tsx)
- Add phase transition validation
- Add phase transition timestamps to work_items table

**Files to Modify:**
- `next-app/src/components/workspace/workspace-phases.tsx`
- `next-app/src/lib/types/work-item-types.ts`
- `supabase/migrations/[timestamp]_add_phase_transition_timestamps.sql`

#### **Session 2: Phase Upgrade Prompts**
- Create readiness calculator function
- Build upgrade prompt UI banner component
- Add guiding questions for each phase

**Files to Create:**
- `next-app/src/lib/phase/phase-readiness.ts`
- `next-app/src/components/work-items/phase-upgrade-banner.tsx`
- `next-app/src/lib/phase/guiding-questions.ts`

#### **Session 3: Workspace Analysis**
- Create analyzer service
- Build health card component
- Add API endpoint for analysis

**Files to Create:**
- `next-app/src/lib/phase/workspace-analyzer.ts`
- `next-app/src/components/workspace/workspace-health-card.tsx`
- `next-app/src/app/api/workspaces/[id]/analyze/route.ts`

#### **Session 4: Design Thinking Integration**
- Add methodology guidance system
- Include other frameworks (Agile, Lean Startup, JTBD)
- AI active integration with suggestions

**Files to Create:**
- `next-app/src/lib/methodologies/design-thinking.ts`
- `next-app/src/lib/methodologies/framework-mapper.ts`
- `next-app/src/components/ai/methodology-suggestions.tsx`

#### **Session 5: Strategy Customization**
- Add new fields to product_strategies (user_stories, case_studies, user_examples)
- Create org-level display component with full tree view
- Create work-item-level display component with alignment view

**Files to Modify:**
- `supabase/migrations/[timestamp]_add_strategy_fields.sql`

**Files to Create:**
- `next-app/src/components/strategies/org-strategy-view.tsx`
- `next-app/src/components/strategies/work-item-strategy-view.tsx`

#### **Session 6: Polish**
- Feedback to work item conversion
- Update workspace card with phase distribution
- E2E testing for phase transitions

**Files to Modify:**
- `next-app/src/components/feedback/feedback-triage.tsx`
- `next-app/src/components/workspace/workspace-card.tsx`

**Files to Create:**
- `tests/e2e/phase-transitions.spec.ts`

### Success Criteria Checklist

- [ ] Phase transition validation prevents invalid upgrades
- [ ] Phase upgrade banners appear at 80% readiness threshold
- [ ] Workspace health score calculates correctly (0-100)
- [ ] Design Thinking guiding questions display per phase
- [ ] AI actively suggests appropriate methodologies
- [ ] Workspace analysis detects mismatched phase items
- [ ] Strategy fields (user_stories, case_studies, examples) added
- [ ] Org-level strategy view shows full tree with examples
- [ ] Work-item-level strategy view shows alignment strength
- [ ] Feedback can be converted to work items with phase context
- [ ] Workspace cards show phase distribution (not single stage)
- [ ] Phase transition timestamps logged for audit trail
- [ ] E2E tests cover all phase transition scenarios

### Module System Design

**Modules** are feature groups that can be toggled per workspace:
- Reduces UI clutter (hide what you don't need)
- Adapts interface to current lifecycle phase
- Progressive disclosure (complexity when needed)

**Example:**
- During **Research** phase: Enable Mind Map, Research, AI Chat
- During **Execution** phase: Enable Project Execution, Timeline, Collaboration
- During **Metrics** phase: Enable Analytics, Success Tracking

---

## 🧩 CORE MODULES (10 Total)

1. **Research & Discovery Module 🔍** - AI chat, web search, knowledge base
2. **Mind Mapping Module 🧠** - ReactFlow canvas, 5 node types, AI-powered (CRITICAL)
3. **Feature Planning Module 📋** - CRUD, timeline breakdown, rich text
4. **Dependency Management Module 🔗** - Visual graph, 4 link types, critical path
5. **Review & Feedback Module 👥** - Invite-based, public links, iframe (Pro)
6. **Project Execution Module 🚀** - Team assignment, status tracking
7. **Collaboration Module 🤝** - Real-time editing, live cursors (Pro)
8. **Timeline Visualization Module 📅** - Gantt chart, drag-to-reschedule
9. **Analytics & Metrics Module 📊** - Custom dashboards, AI insights (Pro)
10. **AI Assistant Module 🤖** - Chat panel, agentic mode, tool calling

**See individual week files for detailed feature descriptions.**

---

## 📁 PROJECT STRUCTURE

See [week-8-billing-testing.md](week-8-billing-testing.md#project-structure) for complete folder structure.

---

## ✅ SUCCESS METRICS

### Launch Goals (Week 9)
- 🎯 **100 GitHub stars**
- 🎯 **50 signups** to hosted SaaS
- 🎯 **10 active teams** using the platform
- 🎯 **3 Pro conversions** ($120-150 MRR)
- 🎯 **5 community contributions** (PRs merged)

### Month 1
- 🎯 **500 GitHub stars**
- 🎯 **500 signups**
- 🎯 **100 active teams** (weekly active users)
- 🎯 **20 Pro conversions** ($800-1,300 MRR)
- 🎯 **Product Hunt launch** (top 5 of the day)
- 🎯 **10 self-hosted deployments** (community)
- 🎯 **20 community contributions**

### Month 3
- 🎯 **2,000 GitHub stars**
- 🎯 **5,000 signups**
- 🎯 **1,000 active teams**
- 🎯 **100 Pro conversions** ($4,000-6,500 MRR)
- 🎯 **50 community contributions**
- 🎯 **Featured on HackerNews** frontpage
- 🎯 **5 integrations** built by community (Jira, Linear, GitHub)

---

## 🎉 WHAT YOU'RE GETTING

This is not just a UI refresh - this is building a **complete enterprise-grade Product Lifecycle Management Platform**:

### **Core Platform:**
✅ Multi-tenant SaaS (teams, auth, billing)
✅ Phase-based workflow (Research → Metrics)
✅ 10 modular systems (toggle per workspace)
✅ **Mind mapping** (ReactFlow, AI-powered, convert to features)
✅ External review (invite + public + iframe)
✅ AI deeply integrated (multi-model, 20+ tools, 1,000 msgs/user)
✅ Timeline visualization (Gantt, drag-to-reschedule, dependencies)
✅ Real-time collaboration (cursors, presence, activity feed)
✅ Custom analytics (dashboards, AI insights)
✅ **100% open source** (MIT License on GitHub)

### **Business Model:**
✅ Free tier (5 users, 50 AI msgs/month)
✅ Pro tier ($40 + $5/user, 1,000 AI msgs/user/month)
✅ Sustainable and profitable (85%+ margin)
✅ Scales to 10,000+ teams

### **Timeline:**
✅ 12 weeks to production-ready (revised from 8 weeks)
✅ Mind mapping prioritized (Week 3)
✅ Perfect UX/UI (calculated user flows)
✅ Comprehensive documentation (user + dev + self-hosting)

### **Open Source Strategy:**
✅ All code on GitHub (MIT)
✅ Revenue from hosted service (not features)
✅ Community-driven development
✅ Self-hosting fully supported

---

## 🚀 NEXT STEPS

1. **✅ Plan Approved** - You're reading this!
2. **✅ Week 1-2** - [Foundation & Multi-Tenancy](week-1-2-foundation.md) - COMPLETED
3. **✅ Week 3** - [Mind Mapping](week-3-mind-mapping.md) (critical feature) - COMPLETED
4. **⚠️ Week 4** - [Feature Planning & Dependencies](week-4-dependencies.md) - 80% (critical path pending)
5. **✅ Week 5** - [External Review System](week-5-review-system.md) + Team Management - COMPLETED
6. **❌ Week 6** - [Timeline & Execution](week-6-timeline-execution.md) - NOT STARTED (0%)
7. **🟡 Week 7** - [AI Integration & Analytics](week-7-ai-analytics.md) - 95% DONE
   - ✅ AI SDK v5, Parallel AI, Chat Panel, Agentic Mode
   - ✅ Workspace Modes, Strategy Alignment, Feedback UI
   - ✅ Analytics Dashboards, Knowledge Base
8. **⏳ Week 8** - [Billing, Testing & Launch](week-8-billing-testing.md) - NOT STARTED
9. **Week 9-12** - Remaining features, polish, launch! 🎉

---

**This plan transforms your roadmap manager into a comprehensive platform that rivals Linear, Notion, and Productboard combined - all 100% open source!**

**Let's build something amazing! 🚀**

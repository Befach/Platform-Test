# NEXT STEPS - Action Plan

**Last Updated**: 2025-12-13
**Current Week**: Week 7 (AI Integration & Analytics - 95% Complete)
**Overall Status**: On Track (92% complete)
**Phase System**: 4-Phase (design → build → refine → launch)

---

## CURRENT STATE SUMMARY

### Completed (Weeks 1-7)
| Week | Focus | Status |
|------|-------|--------|
| 1-2 | Foundation (Auth, Multi-tenant, RLS) | 100% |
| 3 | Mind Mapping (ReactFlow, Custom Nodes) | 100% |
| 4 | Feature Planning & Dependencies | 80% |
| 5 | Review System, Team Management, Work Items UI | 100% |
| 6 | Timeline & Execution | 0% (Planned) |
| 7 | AI Integration, Analytics, Strategies, Knowledge Base | 95% |

### Session 1: COMPLETE (2025-12-13)
- Migrated from 5-phase to 4-phase system
- Fixed phase calculation overlap in workspace-phases.tsx
- Added phase transition validation (isValidPhaseTransition)
- Added progress_percent 0-100 validation
- Added phase_transitions JSONB column
- Updated 32 files, committed, and applied database migration

### Current Priority
- Session 2: Phase Readiness & Upgrade Prompts
- Architecture consolidation implementation

### Upcoming (Week 8)
- Billing & Testing
- Production deployment preparation

---

## PHASE SYSTEM (4-Phase)

The platform now uses a **4-phase system** for work item lifecycle:

| Phase | Description | Focus |
|-------|-------------|-------|
| **design** | Research, ideation, problem definition | Empathy, user needs, scope planning |
| **build** | Active development work | Building, coding, creating |
| **refine** | Testing, validation, iteration | Quality, user testing, feedback |
| **launch** | Shipped, deployed, done | Release, retrospective, metrics |

**Migration Mapping**:
- research/planning → design
- execution → build
- review → refine
- complete → launch

---

## IMMEDIATE ACTIONS (Phase System Enhancement)

**Reference Document**: [docs/ARCHITECTURE_CONSOLIDATION.md](../ARCHITECTURE_CONSOLIDATION.md)

---

### Session 1: Fix Phase Bugs & Validation COMPLETE

**Status**: COMPLETE (2025-12-13)
**Files Modified**: 32 files

#### Completed Tasks:
1. **Fixed Phase Calculation Overlap**
   - [x] Fixed calculateWorkItemPhase() in `workspace-phases.tsx`
   - [x] Removed overlapping phase calculations

2. **Migrated to 4-Phase System**
   - [x] Updated all phase references across codebase
   - [x] Updated API routes with new phase values
   - [x] Applied database migration

3. **Added Phase Transition Validation**
   - [x] Created `isValidPhaseTransition()` in work-items API
   - [x] Implemented required field checks per transition

4. **Added Phase Transition Timestamps**
   - [x] Added `phase_transitions` JSONB column to timeline_items
   - [x] Tracks: `{ design_at, build_at, refine_at, launch_at }`

5. **Added Field Validation**
   - [x] Added 0-100 validation for `progress_percent`

---

### Session 2: Phase Readiness & Upgrade Prompts

**Status**: Not Started
**Estimated Time**: 6-8 hours
**Priority**: HIGH - Core UX improvement

#### Tasks:
1. **Create Readiness Calculator**
   - [ ] Create `lib/phase-readiness.ts` with field completion logic
   - [ ] Calculate readiness percentage per phase transition
   - [ ] Define required fields per transition (design→build, build→refine, refine→launch)

2. **Build Upgrade Prompt UI**
   - [ ] Create `PhaseUpgradePrompt` component (banner)
   - [ ] Show when readiness >= 80%
   - [ ] Display missing required fields
   - [ ] One-click upgrade button

3. **Add Guiding Questions**
   - [ ] Add tooltips with Design Thinking questions per phase
   - [ ] Example: Design phase shows "Who has this problem?"
   - [ ] Link to methodology documentation

**Files to Create**:
- `next-app/src/lib/phase-readiness.ts`
- `next-app/src/components/work-items/phase-upgrade-prompt.tsx`

**Files to Modify**:
- Work item detail page to show prompt banner

---

### Session 3: Workspace Analysis

**Status**: Not Started
**Estimated Time**: 6-8 hours
**Priority**: MEDIUM - Analytics & insights

#### Tasks:
1. **Create Analyzer Service**
   - [ ] Create `lib/workspace-analyzer.ts`
   - [ ] Implement `analyzeWorkspace()` function
   - [ ] Output: `WorkspaceAnalysis` interface (see consolidation doc)

2. **Build Health Card Component**
   - [ ] Create `WorkspaceHealthCard` component
   - [ ] Show phase distribution (design, build, refine, launch)
   - [ ] List mismatched items
   - [ ] Show upgrade opportunities
   - [ ] Display health score (0-100)

3. **Add API Endpoint**
   - [ ] Create `GET /api/workspaces/[id]/analyze`
   - [ ] Implement analysis logic
   - [ ] Cache results for 2-3 days
   - [ ] Add manual refresh button

**Files to Create**:
- `next-app/src/lib/workspace-analyzer.ts`
- `next-app/src/components/workspaces/workspace-health-card.tsx`
- `next-app/src/app/api/workspaces/[id]/analyze/route.ts`

---

### Session 4: Design Thinking Integration

**Status**: Not Started
**Estimated Time**: 8-10 hours
**Priority**: MEDIUM - Methodology guidance

#### Tasks:
1. **Add Methodology Guidance**
   - [ ] Create `lib/design-thinking/frameworks.ts`
   - [ ] Document d.school 5 Modes
   - [ ] Document Double Diamond
   - [ ] Document IDEO HCD
   - [ ] Document IBM Enterprise DT

2. **Include Other Frameworks**
   - [ ] Add Agile/Scrum methods
   - [ ] Add Lean Startup (Build-Measure-Learn)
   - [ ] Add Jobs-to-be-Done framework
   - [ ] Create framework selector in settings

3. **AI Active Integration**
   - [ ] Add framework awareness to AI chat
   - [ ] AI suggests methods based on current phase
   - [ ] AI provides case study examples
   - [ ] AI shows guiding questions in responses

**Files to Create**:
- `next-app/src/lib/design-thinking/frameworks.ts`
- `next-app/src/lib/design-thinking/method-suggestions.ts`
- `next-app/src/components/work-items/methodology-guidance.tsx`

**Files to Modify**:
- AI chat system prompt to include methodology awareness

---

### Session 5: Strategy Customization

**Status**: Not Started
**Estimated Time**: 6-8 hours
**Priority**: MEDIUM - Strategy system enhancement

#### Tasks:
1. **Add New Strategy Fields**
   - [ ] Migration: Add `user_stories TEXT[]` to product_strategies
   - [ ] Migration: Add `user_examples TEXT[]` to product_strategies
   - [ ] Migration: Add `case_studies TEXT[]` to product_strategies
   - [ ] Update TypeScript types

2. **Organization-Level Display Component**
   - [ ] Create `StrategyOrganizationView` component
   - [ ] Show full strategy tree
   - [ ] Display user stories and case studies
   - [ ] High-level metrics and alignment

3. **Work-Item-Level Display Component**
   - [ ] Create `StrategyWorkItemView` component
   - [ ] Show only aligned strategies
   - [ ] Display alignment strength (weak/medium/strong)
   - [ ] Show specific requirements for this item

**Files to Create**:
- `supabase/migrations/YYYYMMDDHHMMSS_add_strategy_user_fields.sql`
- `next-app/src/components/strategies/strategy-organization-view.tsx`
- `next-app/src/components/strategies/strategy-work-item-view.tsx`

**Files to Modify**:
- `next-app/src/lib/types/strategy-types.ts`

---

### Session 6: Polish & Testing

**Status**: Not Started
**Estimated Time**: 8-10 hours
**Priority**: HIGH - Quality assurance

#### Tasks:
1. **Feedback Conversion Enhancement**
   - [ ] Improve feedback-to-work-item conversion flow
   - [ ] Auto-suggest phase based on feedback type
   - [ ] Pre-fill fields from feedback content

2. **Workspace Card Update**
   - [ ] Update workspace cards to show phase distribution
   - [ ] Add health score indicator
   - [ ] Show mode badge (development/launch/growth/maintenance)

3. **E2E Testing**
   - [ ] Test phase transitions with validation
   - [ ] Test upgrade prompts at 80% completion
   - [ ] Test workspace analysis
   - [ ] Test strategy customization
   - [ ] Test Design Thinking integration

4. **Documentation Update**
   - [x] Update ARCHITECTURE_CONSOLIDATION.md with 4-phase system
   - [x] Update NEXT_STEPS.md with 4-phase system
   - [ ] Update API_REFERENCE.md with new endpoints
   - [ ] Update CODE_PATTERNS.md with phase patterns
   - [ ] Create PHASE_SYSTEM_GUIDE.md for users

**Files to Modify**:
- `next-app/src/components/feedback/feedback-convert-dialog.tsx`
- `next-app/src/components/workspaces/workspace-card.tsx`
- `e2e/` test files

**Files to Create**:
- `docs/reference/PHASE_SYSTEM_GUIDE.md`

---

## SUCCESS METRICS

### Phase System Enhancement Goals
- [x] All critical phase bugs fixed
- [x] Phase transition validation working
- [x] 4-phase system migrated and deployed
- [ ] Upgrade prompts showing at 80% completion
- [ ] Workspace analysis providing actionable insights
- [ ] Design Thinking integration active in AI chat
- [ ] Strategy customization fields populated

### Week 8 Goals (Upcoming)
- [ ] Stripe/Razorpay billing integration
- [ ] 15+ E2E tests passing
- [ ] Launch-ready checklist complete
- [ ] Progress: 92% → 100%

---

## FUTURE ACTIONS (Week 11-12)

### Metorial Integration - Approved for Implementation

**Status**: Strategic decision approved (2025-12-23)
**Implementation Timeline**: Week 11-12 (3-4 days)
**Priority**: HIGH - User experience improvement

**Decision**: Migrate to Metorial as primary integration method, keep self-hosted MCP Gateway as advanced fallback

**Why This Matters**:
- **User Experience**: 5 minutes setup vs 2-4 hours OAuth configuration
- **Integration Coverage**: 600+ integrations vs 6 providers (100x increase)
- **Open Source Friendly**: Free tier for 90% of users
- **Solo Dev Sustainable**: Cannot build/maintain 200+ integrations alone

**Implementation Checklist** (When Ready):
- [ ] Install Metorial SDK: `npm install metorial @metorial/ai-sdk`
- [ ] Create `metorial-adapter.ts` (SDK wrapper)
- [ ] Create `integration-factory.ts` (mode selection: metorial/self-hosted/hybrid)
- [ ] Update integration API routes to use factory pattern
- [ ] Add integration status component to UI
- [ ] Update documentation (MCP_USAGE_GUIDE.md, README.md)
- [ ] Create SELF_HOSTED_MCP_GATEWAY.md for advanced users
- [ ] Test all integration modes
- [ ] Deploy and monitor

**Reference Documents**:
- **Strategic Decision**: [docs/research/metorial-integration-decision.md](../research/metorial-integration-decision.md)
- **Full Implementation Plan**: `C:\Users\harsh\.claude\plans\kind-mapping-quasar.md` (2,135 lines)
- **Progress Entry**: [docs/planning/PROGRESS.md](PROGRESS.md#metorial-integration---strategic-decision--2025-12-23)

---

## REFERENCES

- [CLAUDE.md](../../CLAUDE.md) - Project guidelines
- [docs/planning/PROGRESS.md](PROGRESS.md) - Progress tracker
- [docs/planning/MASTER_IMPLEMENTATION_ROADMAP.md](MASTER_IMPLEMENTATION_ROADMAP.md) - Complete dependency graph for future features
- [docs/implementation/README.md](../implementation/README.md) - Implementation plan
- [docs/planning/RECOMMENDED_AGENTS.md](RECOMMENDED_AGENTS.md) - Claude agents guide

---

**Next Review**: End of Week 7

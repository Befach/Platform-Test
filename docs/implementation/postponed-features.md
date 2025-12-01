# 🔄 POSTPONED FEATURES

**Last Updated:** 2025-12-01
**Purpose:** Track features planned but deferred for strategic reasons

[← Back to Implementation Plan](README.md)

---

## Policy

This document follows the [Tracking Postponed Features Policy](../../CLAUDE.md#tracking-postponed-features) defined in CLAUDE.md.

**Every postponed feature entry MUST include:**
- What was postponed (brief summary + link to detailed doc)
- Postponed date (when decision was made)
- Reason (strategic rationale with specific dependencies)
- Dependencies (what needs to be completed first, with checkboxes)
- Priority (High/Medium/Low)
- Estimated effort (time estimate when resumed)
- When to implement (specific milestone or phase trigger)
- Review trigger (when to revisit this decision)
- Rationale (detailed explanation)

---

## Workspace Modes: Launch vs Development

**📅 Postponed Date:** December 1, 2025

**🎯 Priority:** HIGH (Affects entire UX and AI behavior)

**⏱️ Estimated Effort:** ~15 hours (after Workspace Timeline Architecture)

**📋 Full Details:** See [WORKSPACE_MODES.md](../postponed/WORKSPACE_MODES.md)

---

### **Why Postponed**

This feature provides significant value but requires foundational systems first:
- ❌ Depends on Workspace Timeline Architecture (postponed feature)
- ❌ Requires AI Integration to adjust personality/recommendations
- ❌ Needs 8-tab Work Item Detail Page for weighted calculations
- ✅ Can be implemented as non-breaking change (default mode: 'launch')

---

### **Dependencies (Must Complete First)**

- [⏳] Workspace Timeline Architecture (WORKSPACE_TIMELINE_ARCHITECTURE.md)
- [⏳] Work Item Detail Page 8-tab structure
- [⏳] AI Integration complete (Week 7)
- [⏳] Dashboard module (Week 7)
- [⏳] Analytics foundation (Week 7)

---

### **When to Implement**

**Target:** After Workspace Timeline Architecture implementation

**Why then:**
- ✅ Workspace timelines stable and production-ready
- ✅ AI personality infrastructure in place
- ✅ Dashboard module supports mode-specific widgets
- ✅ Can leverage mode-specific timelines (Discovery→MVP→Launch vs Current→Next→Future)

---

### **Summary of Features**

#### Two Workspace Modes

**1. Product Launch Mode**
- Context: Building from scratch, pre-launch
- Default timelines: Discovery → MVP → Beta → Launch
- Work item weights: feature 60%, concept 15%
- Dashboard focus: Launch countdown, MVP completion
- AI behavior: "Ship fast" bias, defer non-MVP

**2. Product Development Mode**
- Context: Already launched, real users
- Default timelines: Current → Next → Future → Hotfix
- Work item weights: enhancement 25%, bug 25%
- Dashboard focus: User satisfaction, bug resolution
- AI behavior: "User-driven" bias, feedback prioritization

#### Mode Transition
- Celebration modal when product launched
- Auto-create mode-specific timelines
- Switch dashboard widgets and AI personality
- Track mode history with audit trail

---

### **Review Trigger**

**When:** After Workspace Timeline Architecture implemented and stable

**Questions to ask:**
1. Is Workspace Timeline Architecture stable and in production?
2. Is AI Integration (Week 7) complete with personality support?
3. Is Dashboard module ready for mode-specific widgets?
4. Do we have user research on launch vs development workflows?
5. Would this feature provide measurable value to users?

**Decision matrix:**
- If "YES" to all 5: ✅ **PROCEED** with implementation
- If "NO" to question 1 or 2: ⏸️ **POSTPONE** further (critical dependencies)
- If "NO" to question 5: 🔍 **RE-EVALUATE** with user research

---

**Last Reviewed:** December 1, 2025
**Next Review:** After Workspace Timeline Architecture implementation

---

## Mind Map Enhancements (23 features across 3 phases)

**📅 Postponed Date:** January 13, 2025

**🎯 Priority:** Medium (not critical for launch, but valuable for user experience)

**⏱️ Estimated Effort:** 3-4 weeks (after Week 7 completion)

**📋 Full Details:** See [MIND_MAP_ENHANCEMENTS.md](../postponed/MIND_MAP_ENHANCEMENTS.md)

---

### **Why Postponed**

Core mind mapping functionality (Week 3) delivers the essential value:
- Visual canvas with drag-and-drop
- 5 node types (Idea, Feature, Epic, Module, User Story)
- Basic AI integration (generate, cluster, suggest, expand)
- **Convert nodes to features** (THE KEY FEATURE)
- Real-time collaboration
- Export (PNG, SVG, JSON)

**The 23 postponed enhancements** are UX improvements and advanced features that depend on modules built in Weeks 4-7. Implementing them now would:
- ❌ Require premature integration with incomplete modules
- ❌ Risk rework when dependencies change
- ❌ Delay critical platform features (dependencies, review, AI)
- ❌ Create maintenance burden for incomplete features

---

### **Dependencies (Must Complete First)**

- [✅] **Week 2-3:** Features module - Data structure for nodes *(COMPLETED)*
- [✅] **Week 4:** Dependencies module - For showing dependencies on canvas *(COMPLETED)*
- [⏳] **Week 5:** Review & Feedback module - For filtering nodes by review status
- [⏳] **Week 6:** Timeline & Execution module - For phase-based visualization and status indicators
- [⏳] **Week 7:** AI Integration & Analytics - For AI-powered node suggestions and smart clustering
- [⏳] **Week 8:** Testing infrastructure - For E2E tests of enhanced features

---

### **Summary of Postponed Features**

#### **Phase 1: Core Interactions (1 week)**
1. Auto-zoom to fit selected nodes
2. Focus mode (dim non-selected nodes, spotlight selection)
3. Compact view toggle (smaller nodes for large maps)
4. Undo/redo (10 actions, Ctrl+Z/Ctrl+Y)
5. Keyboard shortcuts (Delete, Ctrl+C/V, Arrow keys)
6. Node search/filter (by name, type, status)

#### **Phase 2: Advanced Features (1.5 weeks)**
7. Version history (snapshot canvas states, restore previous versions)
8. Comments on nodes (team discussions per node)
9. Node dependencies on canvas (visual arrows between nodes)
10. Custom node colors and icons (personalization)
11. Batch operations (select multiple nodes → bulk edit)
12. Node status indicators (badges for blocked, in-progress, done)
13. Link nodes to features (bidirectional references)
14. Show feature metrics on nodes (timeline, difficulty, assignee)
15. Filter by phase (MVP/SHORT/LONG color coding)

#### **Phase 3: AI-Powered Enhancements (1.5 weeks)**
16. AI-powered node suggestions ("Add complementary features")
17. Smart clustering (ML-based similarity grouping)
18. Auto-organize layout (force-directed graph algorithm)
19. Dependency validation (warn about circular dependencies)
20. Gap analysis ("Missing backend API nodes")
21. Priority recommendations (highlight critical path)
22. Template generation from existing maps (save custom templates)
23. Natural language canvas queries ("Show all mobile features")

---

### **When to Implement**

**Target:** After completing **Week 7** (AI Integration & Analytics module)

**Why then:**
- ✅ All required dependencies will be complete
- ✅ AI infrastructure ready for advanced features
- ✅ Timeline module provides phase/status data
- ✅ Dependencies module provides graph algorithms
- ✅ Review module provides feedback integration
- ✅ Testing infrastructure ready for E2E tests

**Ideal timing:** Between Week 7 completion and Week 8 (Billing & Testing), or as Week 9-10 post-launch polish.

---

### **Review Trigger**

**When:** End of Week 7 (AI Integration & Analytics complete)

**Who:** Product team + 2 beta users

**Questions to ask:**
1. Are users requesting these enhancements? (Check feedback)
2. Are all dependencies stable? (No schema changes expected)
3. Is core platform feature-complete? (All 10 modules working)
4. Do we have 3-4 weeks before launch deadline?
5. Would delaying launch for these features improve success rate?

**Decision matrix:**
- If "YES" to all 5: ✅ **PROCEED** with implementation (Week 9-10)
- If "NO" to question 4-5: ⏸️ **POSTPONE** to post-launch (Month 2-3)
- If "NO" to question 1: 🔍 **RE-EVALUATE** priority based on user feedback

---

### **Detailed Rationale**

**Why these features are valuable:**
- **Better UX:** Focus mode, undo/redo, keyboard shortcuts improve productivity
- **Power users:** Batch operations, version history, custom colors enable advanced workflows
- **Integration:** Node dependencies, feature metrics, status indicators connect mind maps to other modules
- **AI leverage:** Smart clustering, gap analysis, priority recommendations showcase platform intelligence

**Why postponing is the right decision:**

1. **Data dependencies:**
   - Phase-based visualization needs Timeline module (Week 6)
   - Status indicators need Execution module (Week 6)
   - Feature metrics need Analytics module (Week 7)
   - Dependency visualization needs Dependencies module (Week 4)

2. **Integration complexity:**
   - "Link nodes to features" requires stable feature schema
   - "Show feature metrics on nodes" needs analytics calculations
   - "Filter by review status" needs Review module API
   - Implementing now = high risk of rework when dependencies evolve

3. **Strategic timing:**
   - Core mind mapping (Week 3) already delivers 80% of value
   - Convert nodes to features (THE KEY WORKFLOW) is complete
   - These enhancements are "nice-to-have" polish, not blockers
   - Launch users will provide real feedback on which enhancements matter most

4. **Resource allocation:**
   - 3-4 weeks of dev time is significant
   - Better spent on Review system (Week 5), Timeline (Week 6), AI (Week 7)
   - Can revisit post-launch based on actual user demand

5. **Testing feasibility:**
   - Advanced features need stable platform for testing
   - E2E tests for mind map enhancements require:
     - Features module working
     - Dependencies module working
     - Timeline module working
   - Testing incomplete features = wasted effort when schemas change

**Alternative considered:** "Build a subset now (Phase 1 only)"
- **Rejected because:** Would still require integration work, and Phase 1 alone doesn't provide enough value to justify delaying other modules. Better to complete Weeks 4-7 first, then do all 3 phases together when dependencies are stable.

---

**Last Reviewed:** January 13, 2025
**Next Review:** End of Week 7 (estimated: March 1-7, 2025)

---

## Workspace-Level Timelines & Calculated Status (Architecture Refactor)

**📅 Postponed Date:** December 1, 2025

**🎯 Priority:** HIGH (Foundation for future features)

**⏱️ Estimated Effort:** ~25 hours (after 8-tab implementation)

**📋 Full Details:** See [WORKSPACE_TIMELINE_ARCHITECTURE.md](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md)

---

### **Why Postponed**

Current 8-tab Work Item Detail Page implementation delivers immediate value. Architecture refactor:
- ❌ Would require reworking in-progress components
- ❌ Needs full platform stabilization first
- ✅ Can be implemented as non-breaking change (new tables alongside existing)

---

### **Dependencies (Must Complete First)**

- [⏳] Work Item Detail Page 8-tab structure
- [⏳] Resources Tab integration
- [⏳] Feedback Tab integration
- [⏳] Current timeline_items system stable
- [⏳] AI Integration complete (Week 7)

---

### **When to Implement**

**Target:** After Week 7 completion (AI Integration)

**Why then:**
- ✅ All required dependencies will be complete
- ✅ 8-tab Work Item Detail Page stable
- ✅ Current timeline system has been tested in production
- ✅ Can add new structure alongside old (non-breaking)

---

### **Summary of Changes**

#### Database (4 changes)
1. NEW: `timelines` table - Workspace-level release milestones
2. NEW: `work_item_timelines` junction table - M:N work items ↔ timelines
3. MODIFY: `product_tasks` - Add `effort_size` (xs/s/m/l/xl) with computed `effort_points`
4. MODIFY: `workspaces` - Add `effort_vocabulary` (simple/technical/business)

#### Conceptual (4 changes)
1. Work item STATUS becomes CALCULATED from task progress
2. Phase remains INTERNAL (for tab visibility logic only)
3. Timelines move from per-work-item to workspace level
4. Effort uses T-shirt vocabulary with Fibonacci points (1/2/5/8/13)

#### API (7 new endpoints)
1. `GET/POST /api/workspaces/[id]/timelines` - List/create timelines
2. `PATCH/DELETE /api/timelines/[id]` - Update/delete timeline
3. `GET /api/timelines/[id]/work-items` - Work items in timeline
4. `POST/DELETE /api/work-items/[id]/timelines` - Add/remove from timeline

#### UI (3 major updates)
1. NEW: Workspace Timeline Management page
2. UPDATE: Scope Tab - Shows timeline assignments
3. UPDATE: Tasks Tab - Effort size selector (XS/S/M/L/XL)

---

### **Review Trigger**

**When:** End of Week 7 (AI Integration & Analytics complete)

**Questions to ask:**
1. Is the 8-tab Work Item Detail Page stable?
2. Are all current API endpoints working correctly?
3. Is there user feedback requesting timeline improvements?
4. Do we have ~25 hours available before next major milestone?
5. Would this refactor improve the Gantt/Timeline views significantly?

**Decision matrix:**
- If "YES" to all 5: ✅ **PROCEED** with implementation
- If "NO" to question 4: ⏸️ **POSTPONE** further
- If "NO" to question 5: 🔍 **RE-EVALUATE** priority

---

**Last Reviewed:** December 1, 2025
**Next Review:** End of Week 7 (AI Integration complete)

---

## Cross-Team Configuration (Enterprise Multi-Department Feature)

**📅 Postponed Date:** December 1, 2025

**🎯 Priority:** MEDIUM (High value for enterprise, but foundation needed first)

**⏱️ Estimated Effort:** ~30 hours (after foundation modules)

**📋 Full Details:** See [CROSS_TEAM_CONFIGURATION.md](../postponed/CROSS_TEAM_CONFIGURATION.md)

---

### **Why Postponed**

This feature enables different teams to have **different contextual views** of the same work items (Product, Engineering, Design, Marketing, Sales, Support). However, it requires:
- ❌ Departments table and architecture (not yet designed)
- ❌ Workflow States system (planned but postponed)
- ❌ Workspace Modes (Project/Portfolio/Enterprise)
- ❌ Stable Work Item schema (still evolving in Week 6-7)

---

### **Dependencies (Must Complete First)**

- [⏳] **Week 6-7:** Work Item Detail 8-tab structure - Foundation for team-specific tabs
- [⏳] **Week 6:** Work Board 3.0 - Supports filtered views and grouping
- [⏳] **Week 7:** Analytics module - Needed for cross-team reporting
- [⏳] **Week 8:** Testing infrastructure - Multi-workspace E2E tests
- [⏳] **Post-Week 8:** Departments table and architecture (Linear-inspired)
- [⏳] **Post-Week 8:** Workflow States system
- [⏳] **Post-Week 8:** Workspace Modes (Project/Portfolio/Enterprise)

---

### **When to Implement**

**Target:** After Week 8 + Product Strategy Foundation complete

**Phased Approach:**
1. **Phase 0** (Weeks 9-10): Departments & Workflow States foundation (~15h)
2. **Phase 1** (Weeks 11-12): Cross-Team Configuration (~30h, this feature)
3. **Phase 2** (Week 13): Enterprise rollout & polish (~10h)

---

### **Summary of Features**

#### Core Concept: One Work Item, Multiple Team Contexts

A single feature is simultaneously:
- A **Product Priority** with customer impact scoring
- An **Engineering Task** with technical complexity and dependencies
- A **Design Deliverable** with accessibility requirements
- A **Marketing Campaign** with channels and messaging
- A **Sales Enablement** asset with positioning
- A **Support Article** with documentation status

#### Team-Specific Field Templates

**Engineering Fields:**
- Technical Domain (Frontend, Backend, Database, Infrastructure)
- Complexity (Trivial, Low, Medium, High, Very High)
- Tech Stack (multi-select)
- Breaking Changes (boolean)
- Security Review (select)

**Design Fields:**
- Design Type (User Flow, Visual Design, Interaction Design, Prototype)
- Design Status (Not Started, In Progress, Review, Approved, Implemented)
- Accessibility Level (A, AA, AAA)
- Figma Link (URL)
- User Testing Required (boolean)

**Marketing Fields:**
- Campaign (text)
- Target Audience (multi-select)
- Channels (multi-select: Email, Blog, Social, Webinar, Ads)
- Launch Date (date)
- Content Status (Planning, Draft, Review, Approved, Published)

**Sales Fields:**
- Positioning (text)
- Objection Handlers (rich text)
- Demo Script (rich text)
- Competitive Advantage (text)
- Sales Readiness (select)

**Support Fields:**
- Documentation Status (Not Started, In Progress, Review, Published)
- FAQ Created (boolean)
- Known Issues (rich text)
- Support Playbook (rich text)

#### Database Schema (3 new tables)

1. **`team_configurations`** - Custom fields per department
2. **`work_item_team_contexts`** - Field values per department per work item
3. **`work_item_connections`** - Cross-team relationships (marketing_for, documentation_for, design_for, etc.)

#### UI Changes

1. **Workspace Settings:** Team Configuration page (drag-and-drop field builder)
2. **Work Item Detail:** Dynamic tabs based on team configurations
3. **Work Board:** Team-specific views with custom workflows
4. **Cross-Team Alignment Dashboard:** Unified view showing all team contexts

---

### **Review Trigger**

**When:** After Week 8 + 2-4 weeks of post-launch stabilization

**Who:** Product team + 2 enterprise beta customers

**Questions to ask:**
1. Is the Work Item Detail 8-tab structure stable and proven?
2. Do we have 2+ enterprise customers requesting multi-team features?
3. Are Departments and Workflow States implemented?
4. Do we have ~50 hours before next major release?
5. Would this feature differentiate us from competitors (Linear, Jira)?

**Decision matrix:**
- If "YES" to all 5: ✅ **PROCEED** with implementation
- If "NO" to question 2: ⏸️ **POSTPONE** until demand validates
- If "NO" to question 3: 🚧 **BLOCKED** - build foundation first
- If "NO" to question 4: ⏸️ **POSTPONE** to next quarter

---

### **Detailed Rationale**

**Why this feature is valuable:**
- **Eliminates field overload:** Each team sees only their 10-15 fields instead of 50+ generic fields
- **Custom workflows per department:** Engineering uses Kanban, Design uses Design Sprints, Marketing uses Campaign lifecycle
- **Cross-team visibility:** Unified dashboard shows dependencies and blockers across all teams
- **Enterprise differentiation:** Competitors (Linear, Jira) don't offer this level of team-specific customization

**Why postponing is the right decision:**

1. **Missing foundational architecture:**
   - No departments table or hierarchy system
   - No workflow states system for custom statuses
   - No workspace modes (Project vs Portfolio vs Enterprise)
   - Implementing now = building on unstable foundation

2. **Work Item schema still evolving:**
   - Tasks, Resources, Feedback tabs being added in Week 6-7
   - Adding team contexts now = high rework risk
   - Need stable schema before adding team-specific layers

3. **Testing complexity:**
   - Multi-team scenarios require stable platform
   - E2E tests need predictable data states
   - Can't test team contexts when base work items are changing

4. **Strategic timing:**
   - Core platform (10 modules) must be stable first
   - Enterprise customers won't adopt until foundation is proven
   - Better to launch with solid foundation, then add enterprise features

5. **Resource allocation:**
   - 50+ hours is significant investment
   - Better spent on core modules (Timeline, Analytics, AI)
   - Post-launch, can prioritize based on enterprise customer demand

---

**Last Reviewed:** December 1, 2025
**Next Review:** After Week 8 completion + enterprise beta feedback

---

## Related Documentation

For the complete implementation roadmap of ALL future features (beyond postponed items), see:

**[MASTER_IMPLEMENTATION_ROADMAP.md](../planning/MASTER_IMPLEMENTATION_ROADMAP.md)** - Complete dependency graph, critical path, and phase execution timeline for:
- Departments & Structure (Layer 1) - Foundation for cross-team configuration
- Workspace Modes (Layer 2) - Project/Portfolio/Enterprise modes
- UX Enhancements (Layer 3) - Templates, progressive disclosure
- Feedback & Research (Layer 4) - Customer insights, voting
- Strategy Alignment (Layer 5) - OKRs, strategic objectives
- Integrations (Layer 6) - CRM, Help Desk

The Master Roadmap provides the architectural foundation needed before implementing these postponed features.

---

[← Back to Implementation Plan](README.md)

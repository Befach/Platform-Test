# 🔄 Postponed Features

**Last Updated:** December 1, 2025

[← Back to Root](../../README.md)

---

## 📋 WHAT ARE POSTPONED FEATURES?

Features that were planned but **strategically deferred** to later phases due to:

- Dependencies on modules not yet built
- Risk of rework when dependencies change
- Better timing after platform stabilizes
- Resource allocation priorities

**Important:** Postponed ≠ Canceled. These features will be implemented when dependencies are ready.

---

## 📄 DOCUMENTS IN THIS FOLDER

### **[WORKSPACE_MODES.md](../archive/WORKSPACE_MODES.md)** (Archived - Implemented)

Context-aware workspace modes that adapt UX, AI behavior, and metrics based on product lifecycle stage

**📅 Postponed Date:** December 1, 2025

**🎯 Priority:** HIGH (Affects entire UX and AI behavior)

**⏱️ Estimated Effort:** ~15 hours

**Dependencies:**

- [⏳] Workspace Timeline Architecture (WORKSPACE_TIMELINE_ARCHITECTURE.md)
- [⏳] Work Item Detail Page (8-tab structure)
- [⏳] AI Integration complete (Week 7)
- [⏳] Dashboard module (Week 7)

**Summary of Features:**

- Two modes: Product Launch (pre-launch) vs Product Development (post-launch)
- Mode-specific default timelines and phase emphasis
- Adaptive AI personality and suggestions
- Mode-aware dashboard metrics
- Work item type weight adjustments
- Celebration flow for launch event
- Mode transition wizard and history tracking

**When to Implement:** After Workspace Timeline Architecture

**Review Trigger:** After workspace timelines stable + AI integration complete

---

### **[WORKSPACE_TIMELINE_ARCHITECTURE.md](WORKSPACE_TIMELINE_ARCHITECTURE.md)**

Major architecture refactor: workspace-level timelines, calculated status, effort vocabulary

**📅 Postponed Date:** December 1, 2025

**🎯 Priority:** HIGH (Foundation for scalability)

**⏱️ Estimated Effort:** ~25 hours

**Dependencies:**

- [⏳] Work Item Detail Page (8-tab structure)
- [⏳] Current timeline system stable
- [⏳] AI Integration complete (Week 7)

**Summary of Features:**

- Workspace-level timelines (release milestones)
- Many-to-many work item ↔ timeline relationship
- Calculated work item status from task progress
- Effort vocabulary system (T-shirt sizes)
- Weighted progress calculation

**When to Implement:** After Week 7 (AI Integration complete)

**Review Trigger:** End of Week 7

---

### **[PRODUCT_STRATEGY_FOUNDATION.md](PRODUCT_STRATEGY_FOUNDATION.md)**

Strategic foundation layer connecting every decision to customer, problem, and value proposition

**📅 Postponed Date:** December 1, 2025

**🎯 Priority:** MEDIUM (Valuable but not blocking launch)

**⏱️ Estimated Effort:** ~20 hours

**Dependencies:**

- [⏳] Workspace Modes (strategy differs by workspace type)
- [⏳] Work Item Detail Page (display alignment scores)
- [⏳] AI Integration (Week 7) - for alignment suggestions and priority scoring
- [⏳] Research Module (Week 7) - for auto-generated research questions

**Summary of Features:**

- Strategy Components: Target customer, core problem, value prop, strategic pillars, success metrics
- Work item strategy alignment (customer impact, pillar fit, north star impact)
- AI-calculated priority scores based on strategic fit
- Auto-generated research questions based on target customers
- Marketing messaging context generation
- New hire onboarding with strategy overview

**When to Implement:** After Week 8 (after Workspace Modes and AI Integration)

**Review Trigger:** After Workspace Modes complete and AI Integration stable

---

### **[MIND_MAP_ENHANCEMENTS.md](MIND_MAP_ENHANCEMENTS.md)**

23 mind map enhancement features across 3 phases (UX improvements + AI-powered features)

**📅 Postponed Date:** January 13, 2025

**🎯 Priority:** Medium (valuable but not critical for launch)

**⏱️ Estimated Effort:** 3-4 weeks

**Dependencies:**

- [✅] Week 2-3: Features module (COMPLETED)
- [✅] Week 4: Dependencies module (COMPLETED)
- [⏳] Week 5: Review & Feedback module
- [⏳] Week 6: Timeline & Execution module
- [⏳] Week 7: AI Integration & Analytics
- [⏳] Week 8: Testing infrastructure

**Summary of Features:**

#### Phase 1: Core Interactions (1 week)

1. Auto-zoom to fit selected nodes
2. Focus mode (dim non-selected nodes)
3. Compact view toggle
4. Undo/redo (10 actions, Ctrl+Z/Y)
5. Keyboard shortcuts (Delete, Ctrl+C/V, arrows)
6. Node search/filter

#### Phase 2: Advanced Features (1.5 weeks)

1. Version history (snapshot canvas states)
2. Comments on nodes (team discussions)
3. Node dependencies on canvas (visual arrows)
4. Custom node colors and icons
5. Batch operations (select multiple → bulk edit)
6. Node status indicators (blocked, in-progress, done)
7. Link nodes to features (bidirectional references)
8. Show feature metrics on nodes
9. Filter by phase (MVP/SHORT/LONG color coding)

#### Phase 3: AI-Powered Enhancements (1.5 weeks)

1. AI-powered node suggestions
2. Smart clustering (ML-based similarity)
3. Auto-organize layout (force-directed graph)
4. Dependency validation (warn about circular deps)
5. Gap analysis ("Missing backend API nodes")
6. Priority recommendations (highlight critical path)
7. Template generation from existing maps
8. Natural language canvas queries

**When to Implement:** After Week 7 (AI Integration complete)

**Review Trigger:** End of Week 7

---

### **[CROSS_TEAM_CONFIGURATION.md](CROSS_TEAM_CONFIGURATION.md)**

Enterprise multi-department feature: different teams see different contextual views of the same work items

**📅 Postponed Date:** December 1, 2025

**🎯 Priority:** MEDIUM (High value for enterprise, but foundation needed first)

**⏱️ Estimated Effort:** ~30 hours (plus ~15h foundation)

**Dependencies:**

- [⏳] Work Item Detail 8-tab structure (Week 6-7)
- [⏳] Work Board 3.0 (Week 6)
- [⏳] Departments table and architecture (Post-Week 8)
- [⏳] Workflow States system (Post-Week 8)
- [⏳] Workspace Modes (Project/Portfolio/Enterprise)

**Summary of Features:**

- One work item, multiple team contexts (Product, Engineering, Design, Marketing, Sales, Support)
- Team-specific field templates with custom workflows
- Cross-team connections (marketing_for, documentation_for, design_for, etc.)
- Cross-Team Alignment Dashboard showing all team contexts
- Team-specific board views with filtered workflows

**When to Implement:** After Week 8 + Product Strategy Foundation (Weeks 11-13)

**Review Trigger:** After Week 8 + enterprise beta feedback

---

## 🔄 POSTPONED FEATURES POLICY

All postponed features follow the policy defined in [CLAUDE.md](../../CLAUDE.md#tracking-postponed-features).

**Every postponed feature entry MUST include:**

- ✅ What was postponed (brief summary + link)
- ✅ Postponed date
- ✅ Reason (strategic rationale with dependencies)
- ✅ Dependencies (checkboxes for tracking)
- ✅ Priority (High/Medium/Low)
- ✅ Estimated effort
- ✅ When to implement (specific milestone)
- ✅ Review trigger (when to revisit)
- ✅ Detailed rationale

---

## 📋 HOW TO ADD NEW POSTPONED FEATURES

1. **Create detailed specification file** in this folder: `[FEATURE_NAME].md`
2. **Add entry to this README** (tracking section above)
3. **Follow the template** defined in CLAUDE.md
4. **Set review trigger** (when to revisit the decision)
5. **Update CHANGELOG.md** with postponement decision

---

## 🔗 RELATED DOCUMENTATION

- **[Implementation Plan - Postponed Features](README.md)** - Summary tracking
- **[CLAUDE.md - Postponed Features Policy](../../CLAUDE.md#tracking-postponed-features)** - Policy and template
- **[Planning Documents](../planning/README.md)** - Current priorities
- **[NEXT_STEPS.md](../planning/NEXT_STEPS.md)** - Immediate action items

---

## 📊 POSTPONEMENT DECISION FRAMEWORK

### 5-Question Framework (Before Implementation)

1. **Data Dependencies:** Does this feature depend on data from other modules?
2. **Integration Points:** Will this integrate with other modules' APIs?
3. **User Experience Flow:** Does this make sense at this point in user journey?
4. **Database Schema Stability:** Does this depend on specific tables/columns?
5. **Testing Feasibility:** Can this be fully tested with currently available data?

**If ANY question reveals blocking dependencies → POSTPONE**

**See:** [CLAUDE.md - Execution Timing](../../CLAUDE.md#execution-timing--dependency-cross-checks)

---

[← Back to Root](../../README.md)

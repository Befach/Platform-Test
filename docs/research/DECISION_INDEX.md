# Decision Index: Master Log for Platform Architecture & UX

**Last Updated**: 2025-12-01
**Purpose**: Master index for all architectural, scope, UX, and feature decisions
**Status**: Living Document (update when decisions are made or reviewed)

---

## Purpose

This is the master index for all architectural and UX decisions made during platform development. It provides:

1. **Traceability**: Look up WHY certain decisions were made
2. **Accountability**: Question or revisit decisions with full context
3. **Lifecycle Tracking**: See decision status (Proposed → Accepted → Validated/Superseded)
4. **Quick Reference**: Find related decisions and research documents

**Use this index when**:

- Questioning an existing decision
- Proposing a new feature or architecture change
- Onboarding new team members
- Conducting architecture reviews
- Planning major refactors

---

## Decision Categories

### Architecture Decisions (ADR-XXX)

| ID | Decision | Status | Date | Document | Review Trigger |
|----|----------|--------|------|----------|----------------|
| ADR-001 | Team-scoped work items (Linear pattern) | ✅ Accepted | 2025-12-01 | [linear-architecture.md](architecture-decisions/linear-architecture.md) | User feedback on cross-team workflows |
| ADR-002 | Departments table for sub-teams | ✅ Accepted | 2025-12-01 | [linear-architecture.md](architecture-decisions/linear-architecture.md) | Scale beyond 50 teams |
| ADR-003 | Triage workflow (simplified) | ✅ Accepted | 2025-12-01 | [linear-architecture.md](architecture-decisions/linear-architecture.md) | Integration patterns mature |
| ADR-004 | Timestamp IDs over human-readable | ✅ Accepted | 2025-12-01 | [linear-architecture.md](architecture-decisions/linear-architecture.md) | User requests or confusion |
| ADR-005 | Workspace-level timelines (M:N) | 📋 Proposed | 2025-12-01 | [WORKSPACE_TIMELINE_ARCHITECTURE.md](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md) | After Week 7 complete |
| ADR-006 | Calculated work item status from tasks | 📋 Proposed | 2025-12-01 | [WORKSPACE_TIMELINE_ARCHITECTURE.md](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md) | After Week 7 complete |
| ADR-007 | Effort vocabulary system (XS/S/M/L/XL) | 📋 Proposed | 2025-12-01 | [WORKSPACE_TIMELINE_ARCHITECTURE.md](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md) | After timeline refactor |

### Scope Decisions (SCOPE-XXX)

| ID | Decision | Status | Date | Document | Review Trigger |
|----|----------|--------|------|----------|----------------|
| SCOPE-001 | Native feedback basics (not full CRM) | ✅ Accepted | 2025-12-01 | [scope-decisions.md](architecture-decisions/scope-decisions.md) | User requests for CRM features |
| SCOPE-002 | Product/Engineering/Design in scope | ✅ Accepted | 2025-12-01 | [scope-decisions.md](architecture-decisions/scope-decisions.md) | Revenue opportunity from Sales teams |
| SCOPE-003 | Sales/Support via integrations only | ✅ Accepted | 2025-12-01 | [scope-decisions.md](architecture-decisions/scope-decisions.md) | Integration complexity grows |
| SCOPE-004 | Linear as closest architectural inspiration | ✅ Accepted | 2025-12-01 | [linear-architecture.md](architecture-decisions/linear-architecture.md) | Major architectural shifts needed |

### UX Decisions (UX-XXX)

| ID | Decision | Status | Date | Document | Review Trigger |
|----|----------|--------|------|----------|----------------|
| UX-001 | Templates + Customization approach | ✅ Accepted | 2025-12-01 | [ux-design-decisions.md](architecture-decisions/ux-design-decisions.md) | Adoption metrics below 70% |
| UX-002 | Notion-style progressive connection menu | ✅ Accepted | 2025-12-01 | [ux-design-decisions.md](architecture-decisions/ux-design-decisions.md) | Usability testing feedback |
| UX-003 | AI-suggested alignment (not blocking) | ✅ Accepted | 2025-12-01 | [ux-design-decisions.md](architecture-decisions/ux-design-decisions.md) | Strategy alignment score below 60% |
| UX-004 | Progressive disclosure (3-level system) | ✅ Accepted | 2025-12-01 | [progressive-disclosure-ux.md](core-research/progressive-disclosure-ux.md) | User adoption rates below 50% |
| UX-005 | On-blur validation (not on-change) | ✅ Accepted | 2025-12-01 | [ultra-deep-research-findings.md](core-research/ultra-deep-research-findings.md) | Form completion rates below 85% |
| UX-006 | Role-based default views | ✅ Accepted | 2025-12-01 | [progressive-disclosure-ux.md](core-research/progressive-disclosure-ux.md) | User confusion about complexity |
| UX-007 | Hub-and-spoke navigation model | ✅ Accepted | 2025-12-01 | [progressive-disclosure-ux.md](core-research/progressive-disclosure-ux.md) | Navigation issues reported |
| UX-008 | Guided flexibility philosophy | ✅ Accepted | 2025-12-01 | [ux-design-decisions.md](architecture-decisions/ux-design-decisions.md) | User feedback on rigidity |

### Feature Decisions (FEAT-XXX)

| ID | Decision | Status | Date | Document | Review Trigger |
|----|----------|--------|------|----------|----------------|
| FEAT-001 | Workspace Modes (Launch/Development) | 📋 Proposed | 2025-12-01 | [WORKSPACE_MODES.md](../archive/WORKSPACE_MODES.md) | After timeline architecture |
| FEAT-002 | Product Strategy Foundation | 📋 Proposed | 2025-12-01 | [PRODUCT_STRATEGY_FOUNDATION.md](../postponed/PRODUCT_STRATEGY_FOUNDATION.md) | After workspace modes |
| FEAT-003 | Cross-Team Configuration | 📋 Proposed | 2025-12-01 | [CROSS_TEAM_CONFIGURATION.md](../postponed/CROSS_TEAM_CONFIGURATION.md) | After strategy foundation |
| FEAT-004 | Mind Map Enhancements (AI-powered) | 📋 Proposed | 2025-12-01 | [MIND_MAP_ENHANCEMENTS.md](../postponed/MIND_MAP_ENHANCEMENTS.md) | After AI integration |
| FEAT-005 | Unified Canvas Enhancements | 📋 Proposed | 2025-12-01 | [UNIFIED_CANVAS_ENHANCEMENTS.md](../postponed/UNIFIED_CANVAS_ENHANCEMENTS.md) | After base canvas stable |

### Data Model Decisions (DATA-XXX)

| ID | Decision | Status | Date | Document | Review Trigger |
|----|----------|--------|------|----------|----------------|
| DATA-001 | Date.now().toString() for IDs | ✅ Accepted | 2025-12-01 | [linear-architecture.md](architecture-decisions/linear-architecture.md) | Collision issues or user confusion |
| DATA-002 | team_id on all tables (multi-tenancy) | ✅ Accepted | 2025-12-01 | [database-schema.md](../architecture/database-schema.md) | Security or isolation issues |
| DATA-003 | RLS policies on ALL tables | ✅ Accepted | 2025-12-01 | [database-schema.md](../architecture/database-schema.md) | Security audit required |
| DATA-004 | Workspace = Project container | ✅ Accepted | 2025-12-01 | [linear-architecture.md](architecture-decisions/linear-architecture.md) | Terminology confusion |
| DATA-005 | Work Item = Generic top-level item | ✅ Accepted | 2025-12-01 | [linear-architecture.md](architecture-decisions/linear-architecture.md) | Type confusion |

---

## Decision Lifecycle

All decisions follow this lifecycle:

```
PROPOSED → ACCEPTED → IMPLEMENTED → EVALUATED → VALIDATED/SUPERSEDED
```

### Stage Definitions

| Stage | Description | When to Transition |
|-------|-------------|-------------------|
| **PROPOSED** | Research complete, decision documented | After 5-question validation |
| **ACCEPTED** | Team agrees, ready for implementation | After review meeting |
| **IMPLEMENTED** | Code deployed to production | After merge to main |
| **EVALUATED** | Metrics collected, user feedback gathered | After 4+ weeks in production |
| **VALIDATED** | Decision proven correct, metrics positive | When success criteria met |
| **SUPERSEDED** | Replaced by better approach | When new ADR created |

### Status Icons

- ✅ **Accepted**: Decision made, ready or in progress
- 🚀 **Implemented**: Live in production
- 📊 **Evaluated**: Metrics being tracked
- ✓ **Validated**: Proven correct over time
- ⏳ **Superseded**: Replaced by newer decision
- 📋 **Proposed**: Under consideration

---

## How to Use This Index

### 1. Looking Up a Decision

**By Category**: Find the decision ID in the tables above
**By Topic**: Use Ctrl+F to search for keywords
**By Document**: Click the document link for full context

### 2. Questioning a Decision

When questioning a decision:

1. Find the decision ID in the table
2. Read the linked document (full rationale)
3. Check the review trigger (when to reconsider)
4. Review key statistics (if available)
5. Propose alternative via new ADR that supersedes old one

### 3. Proposing Changes

To propose a change to an existing decision:

1. Create new ADR document (e.g., `ADR-008-new-approach.md`)
2. Reference the original decision it supersedes
3. Provide rationale and comparative analysis
4. Update this index with "Superseded" status

### 4. Tracking Outcomes

After implementing a decision:

1. Add "Implemented" date to this index
2. Define success metrics to track
3. Schedule evaluation review (4-8 weeks post-launch)
4. Update status to "Validated" or "Superseded"

---

## Quick Reference: Key Statistics

These statistics from research informed critical decisions:

### UX & Adoption

| Statistic | Impact | Informed Decision |
|-----------|--------|-------------------|
| **52%** improvement in adoption | Role-based interfaces | UX-004, UX-006 |
| **90%** form completion rate | On-blur validation | UX-005 |
| **75%** of new users churn within week | Without effective onboarding | UX-001, UX-004 |
| **67%** of B2B buyers abandon | Due to poor UX | UX-001, UX-008 |
| **22%** better form completion | On-blur vs on-change validation | UX-005 |

### Architecture & Design Systems

| Statistic | Impact | Informed Decision |
|-----------|--------|-------------------|
| **$100** return per $1 invested | UX design ROI | UX-008 |
| **2,600%** ROI | IBM Carbon Design System | UX-001 |
| **50%** dev time reduction | Mature design systems | UX-001 |
| **30%** reduction in design cycles | Shopify Polaris | UX-001 |

### Team Collaboration

| Statistic | Impact | Informed Decision |
|-----------|--------|-------------------|
| **75%** cross-functional teams fail | Without clear structure | ADR-001, SCOPE-002 |
| **80%** of teams fit standard patterns | Templates work for most | UX-001 |
| **52%** improvement | Role-based team views | UX-006 |

### Customization Economics

| Statistic | Impact | Informed Decision |
|-----------|--------|-------------------|
| **10+ years** of maturity | Salesforce, HubSpot, Zendesk | SCOPE-003 |
| **40%** complexity reduction | Removing Sales/Support native features | SCOPE-003 |

---

## Decision Dependencies

Some decisions depend on others. This graph shows critical dependencies:

```
SCOPE-002 (Product/Eng/Design in scope)
    ↓
ADR-001 (Team-scoped work items)
    ↓
UX-001 (Templates + Customization)
    ↓
UX-004 (Progressive disclosure)
    ↓
UX-006 (Role-based views)

---

SCOPE-003 (Sales/Support via integrations)
    ↓
[Future: Integration Module]

---

ADR-005 (Workspace-level timelines)
    ↓
FEAT-001 (Workspace Modes)
    ↓
FEAT-002 (Product Strategy Foundation)
```

---

## Review Schedule

### Monthly Reviews

**First Monday of each month**:

- Check review triggers for all "Accepted" decisions
- Update metrics for "Implemented" decisions
- Evaluate "Evaluated" decisions for validation

### Quarterly Reviews

**End of each quarter**:

- Comprehensive review of all decisions
- Validate or supersede based on metrics
- Update status for outdated decisions
- Archive superseded decisions

### Post-Launch Reviews

**After major feature launches**:

- Measure against success criteria
- Gather user feedback
- Update decision status
- Document lessons learned

---

## Success Criteria by Decision

### ADR-001: Team-Scoped Work Items

**Success Criteria**:

- Zero "orphan" work items without team assignment
- Team metrics (velocity, burndown) are accurate within 5%
- User feedback confirms clear ownership

**Measurement**:

```sql
-- Orphan work items count
SELECT COUNT(*) FROM work_items WHERE department_id IS NULL;

-- Team assignment accuracy
SELECT team_id, COUNT(*) FROM work_items GROUP BY team_id;
```

### UX-005: On-Blur Validation

**Success Criteria**:

- Form completion rate ≥ 90%
- User complaints about validation < 5% of users
- Time to complete forms ≤ previous baseline

**Measurement**:

```typescript
// Track form completion events
analytics.track('form_completed', {
  form_type: 'work_item_create',
  validation_type: 'on_blur',
  completion_time_seconds: elapsed
})
```

### UX-001: Templates + Customization

**Success Criteria**:

- ≥ 80% of teams start with a template
- ≥ 70% of teams keep default template structure
- Average setup time ≤ 10 minutes

**Measurement**:

```typescript
// Track template usage
analytics.track('team_created', {
  template_type: 'system' | 'clone' | 'blank' | 'custom',
  setup_time_seconds: elapsed
})
```

### SCOPE-003: Sales/Support via Integrations

**Success Criteria**:

- ≥ 30% of teams connect external CRM/support tools
- Integration setup time ≤ 15 minutes
- User feedback confirms integration meets needs

**Measurement**:

```typescript
// Track integration adoption
analytics.track('integration_connected', {
  integration_type: 'crm' | 'support' | 'other',
  setup_time_seconds: elapsed
})
```

---

## Related Documentation

### Research Documents

**Architecture Decisions** → `architecture-decisions/`

- [Linear Architecture Research](architecture-decisions/linear-architecture.md) - Team-scoped patterns
- [Scope Decisions](architecture-decisions/scope-decisions.md) - In-scope vs out-of-scope teams
- [UX Design Decisions](architecture-decisions/ux-design-decisions.md) - Templates, menus, alignment

**Core Research** → `core-research/`

- [Progressive Disclosure UX](core-research/progressive-disclosure-ux.md) - 3-level system
- [Ultra Deep Research Findings](core-research/ultra-deep-research-findings.md) - Comprehensive market intelligence
- [Cross-Team Collaboration](core-research/cross-team-collaboration.md) - Team views and workflows
- [Product Strategy Alignment](core-research/product-strategy-alignment.md) - OKR embedding

**Supporting Research** → `supporting-research/`

- [Customization Patterns](supporting-research/customization-patterns.md) - When to add options

### Implementation Documents

- [Database Schema](../architecture/database-schema.md) - Current schema
- [API Reference](../reference/API_REFERENCE.md) - All endpoints
- [Architecture Overview](../architecture/ARCHITECTURE.md) - System design
- [Code Patterns](../reference/CODE_PATTERNS.md) - Implementation examples

### Postponed Features

- [Workspace Timeline Architecture](../postponed/WORKSPACE_TIMELINE_ARCHITECTURE.md) - ADR-005, ADR-006
- [Workspace Modes](../archive/WORKSPACE_MODES.md) - FEAT-001
- [Product Strategy Foundation](../postponed/PRODUCT_STRATEGY_FOUNDATION.md) - FEAT-002
- [Cross-Team Configuration](../postponed/CROSS_TEAM_CONFIGURATION.md) - FEAT-003

### Process Documents

- [5-Question Framework](../processes/POSTPONED_FEATURES_PROCESS.md) - Decision validation
- [Documentation Standards](../../CLAUDE.md) - Update procedures
- [Weekly Progression](../planning/PROGRESS.md) - Implementation tracking

---

## Appendix: Decision Template

When creating a new decision document, use this template:

```markdown
# [Decision Title]

**Decision ID**: [ADR|SCOPE|UX|FEAT]-XXX
**Status**: [Proposed|Accepted|Implemented|Evaluated|Validated|Superseded]
**Date**: YYYY-MM-DD
**Supersedes**: [Previous Decision ID, if any]
**Superseded By**: [New Decision ID, if superseded]

---

## Executive Summary

[One-paragraph summary of the decision]

---

## Context

[Why was this decision needed? What problem does it solve?]

---

## Decision

[What was decided?]

---

## Alternatives Considered

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| Option 1 | ... | ... | ... |
| **Selected** | ... | ... | ✅ SELECTED |

---

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Tradeoff 1]
- [Tradeoff 2]

### Risks
| Risk | Mitigation |
|------|------------|
| [Risk 1] | [How to mitigate] |

---

## Success Criteria

**Metrics to Track**:
- [Metric 1]: Target value
- [Metric 2]: Target value

**Review Triggers**:
- [ ] Trigger 1
- [ ] Trigger 2

---

## Related Decisions

- [Decision 1](link)
- [Decision 2](link)

---

## Sources

- [Source 1]
- [Source 2]
```

---

**Last Updated**: December 1, 2025
**Maintained By**: Development Team
**Next Review**: January 1, 2026 (Monthly)

**Questions?** Consult the linked research documents or create a new ADR proposing changes.

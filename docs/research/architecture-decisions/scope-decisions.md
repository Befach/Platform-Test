# Scope Decisions: In-Scope vs Out-of-Scope Teams

**Decision ID(s)**: SCOPE-001, SCOPE-002, SCOPE-003, SCOPE-004
**Status**: Accepted
**Research Date**: 2025-12-01
**Last Reviewed**: 2025-12-01
**Next Review**: End of Week 10 / After integration features milestone
**Supersedes**: N/A
**Superseded By**: N/A

---

## Executive Summary

This document captures the strategic decision to focus on Product, Engineering, and Design teams as core users, while treating Sales and Support as integration-based (out of scope for native features).

---

## Context

Product lifecycle management could theoretically include ALL company functions:
- Product (strategy, roadmap, prioritization)
- Engineering (implementation, technical decisions)
- Design (UX, visual design, prototypes)
- Sales (CRM, deals, customer conversations)
- Support (tickets, documentation, training)
- Marketing (campaigns, content, launches)
- Leadership (visibility, decisions, reporting)

**The question**: Which should be native features vs. integrations?

---

## The Decision

### Decision 1: Native Support for Feedback Basics [SCOPE-001]

**What**: Build basic feedback collection (forms, submissions, analysis) as native features.

**Why**:
- Essential for product lifecycle management
- Validates product decisions before execution
- Differentiates from pure project management tools

**In Scope**:
- Public/private feedback forms
- Submission storage and management
- Basic analysis and tagging
- Connection to work items

**Out of Scope**:
- Advanced help desk features (ticket routing, SLAs)
- Customer database management
- Email support integration

### Decision 2: Product/Engineering/Design Teams (Native Features) [SCOPE-002]

**What**: Build native workflows for Product, Engineering, and Design teams.

**Teams In Scope**:

| Team | Rationale |
|------|-----------|
| **Product** | Core user persona - the primary workflow |
| **Engineering** | Tightly coupled with Product - same work items, dependencies |
| **Design** | Part of the build cycle - design → develop → ship |

**Why This Scope**:
- These teams collaborate on the same work items
- Shared workflow states and dependencies
- Direct integration creates most value

### Decision 3: Sales/Support Teams (Integration-Based) [SCOPE-003]

**What**: Treat Sales and Support as integration partners, not native features.

**Teams Out of Scope**:

| Team | Rationale | Integration Strategy |
|------|-----------|---------------------|
| **Sales** | CRM tools (HubSpot, Salesforce) are specialized and mature | Webhook/API to surface feature roadmap |
| **Support** | Help desk tools (Zendesk, Intercom) own this workflow | Pull feedback/requests into Product Insights |

**Why Not Native**:
- Mature tools exist (10+ years of development)
- Specialized workflows we can't compete with
- Integration approach is industry standard

---

## Why This Decision Makes Sense

### 1. Research Backing

**BCG B2B Strategy**:
> "Build for your ideal customer, not every potential customer"

Trying to serve all functions dilutes focus and creates a "jack of all trades, master of none" product.

### 2. Customization Trap

Sales and Support CRMs have **10+ years of maturity**:
- Salesforce (1999)
- HubSpot (2006)
- Zendesk (2007)
- Intercom (2011)

These tools have:
- Thousands of features
- Deep integrations
- Trained user bases
- Specialized workflows

**Competing is futile**. Integration is the smart play.

### 3. Industry Pattern

This is exactly how successful PM tools operate:

| Tool | Core Focus | Integration Approach |
|------|------------|---------------------|
| **Linear** | Engineering teams | Integrates with Zendesk, Intercom |
| **Productboard** | Product management | Integrates with Salesforce, HubSpot |
| **Notion** | Knowledge work | Integrates via API |

### 4. Complexity Reduction

Removing Sales/Support as native features:
- Removes ~40% of potential custom field complexity
- Avoids building duplicate CRM functionality
- Focuses engineering resources on core value

---

## Integration Strategy (Future Implementation)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              INTEGRATION ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  EXTERNAL TOOLS          ←──── API/Webhook ────→  PLATFORM │
│                                                             │
│  ┌─────────────┐                              ┌──────────┐ │
│  │ Zendesk     │  →  Support ticket #123  →   │ Product  │ │
│  │ Intercom    │     becomes linked ref       │ Insight  │ │
│  └─────────────┘                              └──────────┘ │
│                                                     ↓       │
│  ┌─────────────┐                              ┌──────────┐ │
│  │ HubSpot     │  →  "Feature X requested" →  │ Work     │ │
│  │ Salesforce  │     with customer context    │ Item     │ │
│  └─────────────┘                              └──────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What Product Team Sees

From integrated support tools:
- "12 enterprise customers requested this"
- "3 support tickets linked to this bug"
- "$50k deal blocked pending this feature"

### What Sales/Support Sees (via integration)

From our platform:
- Feature roadmap status
- Expected delivery timeline
- Release notes when shipped

### Decision 4: Integration Levels - Start Light [SCOPE-004]

**What**: Progressive integration approach, starting with simple URL linking.

**Integration Levels**:

| Level | Scope | When |
|-------|-------|------|
| **Light** | Link external URLs as references on work items | MVP |
| **Medium** | Pull metadata (priority, customer tier, request count) | Post-MVP |
| **Deep** | Auto-create insights from patterns, bi-directional sync | Future |

**Why Start Light**:
- Delivers value without complex integration engineering
- Validates integration use cases before heavy investment
- Users can start linking immediately
- Can progressively enhance without breaking changes

---

## Alternatives Considered

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| Build full Sales CRM | Single platform | Years of work, competing with mature tools | Scope creep |
| Build full Support system | Single platform | Reinventing wheel | Not our expertise |
| **Integration approach** | Leverage best-in-class tools | Dependency on external tools | ✅ SELECTED |
| Ignore Sales/Support | Simplest | Misses customer feedback loop | Loses strategic value |

---

## Impact on Platform Design

### Removed/Deferred Features

| Feature | Reason | Alternative |
|---------|--------|-------------|
| Sales Team Fields | Out of scope | CRM provides |
| Support Team Fields | Out of scope | Help desk provides |
| Sales View | Out of scope | CRM dashboard |
| Support Docs View | Out of scope | Knowledge base tools |

### Retained Cross-Team Connections

Cross-team connections still apply but for: **Product ↔ Engineering ↔ Design**

External tool references can be linked to work items as:
- External URL references
- Customer feedback sources
- Deal context annotations

---

## Consequences

### Positive

1. **Focus**: Engineering resources on core value prop
2. **Speed**: Faster time to market for core features
3. **Quality**: Deeper functionality for target users
4. **Simplicity**: Less complex data model
5. **Partnerships**: Integration partners vs. competitors

### Negative

1. **Dependency**: Relies on external tools for full picture
2. **Data Silos**: Some information lives elsewhere
3. **Setup**: Users need to configure integrations

### Risks

| Risk | Mitigation |
|------|------------|
| Integration complexity | Start with simple URL linking |
| Data freshness | Webhook-based real-time updates |
| User confusion | Clear documentation on integration approach |

---

## Review Triggers

Reconsider this decision when:
- [ ] Users strongly request native Sales/Support features
- [ ] Integration approach creates significant friction
- [ ] Market opportunity in underserved Sales/Support segment
- [ ] Acquisition of CRM/Help Desk tool

---

## Related Decisions

- [Linear Architecture](linear-architecture.md) - Entity hierarchy inspiration
- [UX Design Decisions](ux-design-decisions.md) - Templates, menus, alignment

---

## Sources

- BCG B2B Strategy Analysis
- Parallel AI Ultra Research (customization trap)
- Linear, Productboard, Notion integration documentation
- HubSpot, Salesforce, Zendesk feature analysis

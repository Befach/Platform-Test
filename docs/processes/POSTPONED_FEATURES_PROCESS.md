# Postponed Features Process

**Last Updated**: 2025-11-15
**Purpose**: Standard process for tracking and managing postponed features

---

## Policy

When features are planned but postponed for later implementation, follow this structured process to ensure they're not forgotten and can be resumed at the right time.

---

## Process Steps

### 1. Document Immediately

As soon as a feature is postponed:

- **Create detailed spec**: Add a markdown file in `docs/postponed/` (e.g., `MIND_MAP_ENHANCEMENTS.md`)
- **Add tracking entry**: Update `docs/implementation/postponed-features.md` under the appropriate section
- **Include all required fields**: See table below

---

### 2. Required Information for Postponed Features

Every postponed feature entry MUST include these fields:

| Field | Description | Example |
|-------|-------------|---------|
| **What was postponed** | Brief summary + link to detailed doc | "23 Mind Map enhancements - See [docs/postponed/MIND_MAP_ENHANCEMENTS.md]" |
| **Postponed Date** | When decision was made | "2025-01-13" |
| **Reason** | Strategic rationale with specific dependencies | "Depends on AI integration (Week 7) and Timeline module (Week 6)" |
| **Dependencies** | What needs to be completed first (with checkboxes) | "- [✅] Week 4: Dependencies module<br>- [⏳] Week 7: AI Integration" |
| **Priority** | Importance level | "High / Medium / Low" |
| **Estimated Effort** | Time estimate when resumed | "3-4 weeks" |
| **When to Implement** | Specific milestone or phase trigger | "After completing Week 7 (AI Integration & Analytics)" |
| **Review Trigger** | When to revisit this decision | "End of Week 7, before starting Week 8" |
| **Rationale** | Detailed explanation of why postponement makes sense | "Mind map needs AI assistant for smart suggestions..." |

---

### 3. Entry Format Template

Use this template when adding postponed features to `docs/implementation/postponed-features.md`:

```markdown
### [Feature Name] ([X features/changes] - [Target Phase])

**Postponed Date**: YYYY-MM-DD

**Reason**: [Strategic rationale - be specific about what's blocking this]

**Full Details**: See [FEATURE_NAME.md](../postponed/FEATURE_NAME.md)

**Priority**: [High/Medium/Low]

**Estimated Effort**: [Time estimate]

**Dependencies**:
- [✅/⏳] Week X: [Module Name] - [Specific requirement needed]
- [✅/⏳] Week Y: [Module Name] - [Specific capability needed]

**Summary of Postponed Features**:
- [Brief bullet points of what's included]
- [Group by phase/category if many items]
- [Highlight most valuable items]

**When to Implement**: After completing [Specific milestone]

**Review Trigger**: [When to revisit - e.g., "End of Week 7"]

**Rationale**:
[Detailed explanation of:
- Why postponement is the right decision
- What would happen if implemented too early
- Benefits of waiting
- How this aligns with overall product strategy]
```

---

### 4. Review Cadence

**When to review postponed features:**

- ✅ **End of each major phase/week**: Review all postponed items during weekly planning
- ✅ **Dependencies completed**: When all listed dependency checkboxes become ✅
- ✅ **User feedback**: When users urgently request the postponed feature
- ✅ **Implementation gaps**: When current work reveals gaps that postponed feature would fill
- ✅ **Architecture changes**: When related module refactors make the feature easier to implement

**Review Process:**

1. **Open tracking doc**: `docs/implementation/postponed-features.md`
2. **Check dependencies**: Are all dependency checkboxes ✅?
3. **Re-run validation**: Use the [5-question framework](IMPLEMENTATION_TIMING_CHECKLIST.md)
4. **Re-estimate effort**: Has complexity changed since postponement?
5. **Make decision**: Implement now / Defer further / Split into phases
6. **Update status**:
   - **If proceeding**: Move to active backlog, add to current sprint/week
   - **If deferring**: Update dependencies, adjust review trigger date
   - **If splitting**: Document which parts to implement now vs. later

---

## Example: Mind Map Enhancements

### What

23 enhancement features across 3 phases:
- **Phase 1**: Auto-zoom, fit-to-screen, context menus (8 features)
- **Phase 2**: Dependency visualization, phase indicators (7 features)
- **Phase 3**: AI integration, smart suggestions (8 features)

### Why Postponed

Requires data/APIs from modules not yet built:
- **Week 4**: Dependency graph algorithms (for showing dependencies on canvas)
- **Week 6**: Timeline data (for phase-based visualization)
- **Week 7**: AI assistant (for smart node suggestions)

### When to Implement

After Week 7 completion (all dependencies ready)

### Benefits of Waiting

- ✅ Avoid rework when dependency/timeline APIs change
- ✅ Can integrate features properly on first implementation
- ✅ More valuable when used with full feature set
- ✅ Development is faster when all required APIs are stable

### Full Documentation

See [docs/postponed/MIND_MAP_ENHANCEMENTS.md](../postponed/MIND_MAP_ENHANCEMENTS.md)

---

## Postponed vs. Canceled vs. Backlog

**Postponed** (this process):
- ✅ Feature is planned and spec'd
- ✅ Will definitely be implemented
- ✅ Waiting for specific dependencies
- ✅ Has clear resume trigger
- **Example**: Mind map enhancements waiting for AI module

**Canceled**:
- ❌ Feature is removed from roadmap entirely
- ❌ Won't be implemented
- ❌ Document in `docs/reference/CHANGELOG.md` as "Canceled"
- **Example**: Feature that no longer aligns with product vision

**Backlog**:
- 📋 Feature is planned but not prioritized yet
- 📋 May or may not be implemented
- 📋 No specific dependencies or timing
- 📋 Track in issue tracker or `docs/planning/backlog.md`
- **Example**: "Nice to have" features with no clear priority

---

## Checklist for Postponing Features

Before marking a feature as postponed, ensure:

- [ ] Decision is strategic (based on dependencies, not convenience)
- [ ] Created detailed spec in `docs/postponed/FEATURE_NAME.md`
- [ ] Added tracking entry to `docs/implementation/postponed-features.md`
- [ ] All required fields are filled out completely
- [ ] Dependencies are listed with specific requirements
- [ ] Review trigger is set (date or milestone)
- [ ] Rationale explains why waiting is better than implementing now
- [ ] Team/stakeholders are informed about postponement
- [ ] Updated current sprint/week plan to remove this feature

---

## Best Practices

### ✅ DO

- **Be specific about dependencies**: "Needs AI chat API (Week 7)" not "Needs AI stuff"
- **Set clear review triggers**: "End of Week 7" not "Later"
- **Link to detailed specs**: Always create a separate doc for complex features
- **Update checkboxes**: Mark dependencies as ✅ when completed
- **Re-evaluate regularly**: Review postponed items during weekly planning
- **Communicate clearly**: Explain to stakeholders why postponement is strategic

### ❌ DON'T

- **Postpone out of laziness**: Only postpone for strategic reasons
- **Forget to document**: Every postponement must be tracked
- **Leave vague dependencies**: "Other stuff needs to be done first" is not helpful
- **Set it and forget it**: Postponed features need regular review
- **Postpone indefinitely**: If it keeps getting deferred, maybe it should be canceled
- **Skip the rationale**: Future you (and teammates) need to understand why

---

## Template Files

### Detailed Spec Template (`docs/postponed/FEATURE_NAME.md`)

```markdown
# [Feature Name]

**Status**: Postponed
**Postponed Date**: YYYY-MM-DD
**Target Implementation**: [Week/Phase]
**Priority**: [High/Medium/Low]
**Estimated Effort**: [Time]

---

## Overview

[Brief description of what this feature does and why it's valuable]

---

## Why Postponed

[Detailed explanation of dependencies and strategic reasoning]

### Dependencies

- [⏳] **Week X: [Module Name]**
  - Specific requirement: [What's needed]
  - Why needed: [How this blocks the feature]

- [⏳] **Week Y: [Module Name]**
  - Specific requirement: [What's needed]
  - Why needed: [How this blocks the feature]

---

## Features Included

### Phase 1: [Name] (X features)
1. [Feature 1]: [Description]
2. [Feature 2]: [Description]
...

### Phase 2: [Name] (Y features)
1. [Feature 1]: [Description]
2. [Feature 2]: [Description]
...

---

## Technical Specifications

[Detailed technical requirements, API contracts, data models, etc.]

---

## User Stories

**As a** [user type]
**I want** [functionality]
**So that** [benefit]

---

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
...

---

## When to Resume

**Trigger**: [Specific milestone or dependency completion]

**Re-validation Steps**:
1. Check all dependencies are ✅
2. Run [5-question framework](../processes/IMPLEMENTATION_TIMING_CHECKLIST.md)
3. Re-estimate effort
4. Update sprint/week plan

---

## Notes

[Any additional context, decisions, or considerations]
```

---

## Summary

**Key Takeaways**:

1. **Document immediately** when postponing features
2. **Be specific** about dependencies and resume triggers
3. **Review regularly** - don't set it and forget it
4. **Communicate** postponement decisions to team/stakeholders
5. **Use the templates** to ensure consistency

**Remember**: Postponing strategically is good project management. It prevents wasted effort and ensures features are built when they'll provide maximum value.

---

**See Also**:
- [Implementation Timing Checklist](IMPLEMENTATION_TIMING_CHECKLIST.md)
- [Postponed Features List](README.md)
- [Main Implementation Plan](../implementation/README.md)

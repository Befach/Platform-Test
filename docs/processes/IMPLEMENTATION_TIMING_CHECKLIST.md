# Implementation Timing Checklist

**Last Updated**: 2025-11-15
**Purpose**: Validate that it's the right time to implement a feature before starting development

---

## Why This Matters

Implementing features too early causes:

- ❌ Rework when dependencies change
- ❌ Incomplete features (missing data from other modules)
- ❌ Poor user experience (gaps in functionality)
- ❌ Wasted development time

**Rule**: It's better to postpone and build correctly than to implement early and rework later!

---

## The 5-Question Framework

Ask these questions BEFORE starting any implementation:

### Question 1: Data Dependencies

**Ask**: Does this feature depend on data, tables, or APIs from other modules?

**Check**:

- [ ] List all required data sources (tables, API endpoints, state)
- [ ] Verify those sources exist and are stable (no schema changes expected)
- [ ] If data source doesn't exist: Should we postpone until it's built?

**Example - BAD Timing**:

```
Feature: "Show dependencies on mind map canvas"
Week: 3 (Mind Mapping)
Problem: Dependency graph algorithms don't exist yet (built in Week 4)
Decision: ❌ POSTPONE to Week 8+ (after dependency module is stable)
```

**Example - GOOD Timing**:

```
Feature: "Create dependency graph with ReactFlow"
Week: 4 (Dependencies)
Check: Only needs work_items table (exists from Week 2-3) ✅
Decision: ✅ PROCEED (all data dependencies met)
```

---

### Question 2: Integration Points

**Ask**: Will this feature integrate with other modules' APIs or components?

**Check**:

- [ ] List all modules this will integrate with
- [ ] Verify those modules' public APIs are defined and stable
- [ ] Check if breaking changes are expected soon
- [ ] If APIs aren't stable: Should we wait for interface contracts?

**Example - BAD Timing**:

```
Feature: "Convert mind map nodes to features"
Week: 3 (Mind Mapping)
Problem: Features table structure will change in Week 4 (dependency fields added)
Decision: ⚠️ IMPLEMENT BASIC VERSION NOW, enhance later after schema stabilizes
```

**Example - GOOD Timing**:

```
Feature: "AI dependency suggestions"
Week: 4 (Dependencies)
Check:
- Dependencies API is stable (built in Week 4) ✅
- Work items table is stable (Week 2-3) ✅
- No breaking changes expected ✅
Decision: ✅ PROCEED (safe integration points)
```

---

### Question 3: User Experience Flow

**Ask**: Does this feature make sense at this point in the user journey?

**Check**:

- [ ] Are prerequisite features already built?
- [ ] Can users accomplish a meaningful task with this feature alone?
- [ ] Will users be confused by missing related features?
- [ ] Does this create value immediately or only after other features exist?

**Example - BAD Timing**:

```
Feature: "Review system (external stakeholder feedback)"
Week: 2 (Features module still being built)
Problem:
- No features exist to review yet
- No timeline breakdown to show reviewers
- Users can't actually use it
Decision: ❌ POSTPONE to Week 5 (after Features + Timeline are complete)
```

**Example - GOOD Timing**:

```
Feature: "Create and edit work items"
Week: 2-3 (Features)
Check:
- Users can create items immediately ✅
- Provides standalone value (organize roadmap) ✅
- No confusing gaps ✅
Decision: ✅ PROCEED (good UX timing)
```

---

### Question 4: Database Schema Stability

**Ask**: Does this feature depend on specific database tables/columns?

**Check**:

- [ ] List all required tables and columns
- [ ] Verify those schemas are finalized (not likely to change)
- [ ] Check if this feature will require migrations that affect other modules
- [ ] If schema is unstable: Should we wait for schema to stabilize?

**Example - BAD Timing**:

```
Feature: "Add AI model tracking to dependencies"
Week: 3 (before AI integration planned)
Problem: Don't know what AI models we'll support yet (decided in Week 7)
Decision: ❌ DEFER to Week 4 (implement dependencies first, add AI tracking later)
```

**Example - GOOD Timing**:

```
Feature: "Create feature_connections table"
Week: 4 (Dependencies)
Check:
- Self-contained table ✅
- Doesn't affect other modules ✅
- Schema is well-defined ✅
Decision: ✅ PROCEED (safe schema addition)
```

---

### Question 5: Testing Feasibility

**Ask**: Can this feature be fully tested with currently available data?

**Check**:

- [ ] Do we have realistic test data (or can we easily create it)?
- [ ] Can we test all user flows without other modules?
- [ ] Should we build test infrastructure first?
- [ ] Will E2E tests need other modules to be built first?

**Example - BAD Timing**:

```
Feature: "E2E tests for complete user flow (signup → create roadmap → invite reviewers)"
Week: 2 (Features module)
Problem:
- Auth module exists but review system doesn't (Week 5)
- Timeline module doesn't exist yet (Week 6)
- Can't test complete flow
Decision: ❌ DEFER E2E tests to Week 8 (write unit tests now, integration tests later)
```

**Example - GOOD Timing**:

```
Feature: "Unit tests for critical path algorithm"
Week: 4 (Dependencies)
Check:
- Can create mock dependency data ✅
- Algorithm is self-contained ✅
- No external dependencies needed ✅
Decision: ✅ PROCEED (fully testable now)
```

---

## Pre-Implementation Checklist Template

Use this checklist BEFORE implementing any feature:

```markdown
## Pre-Implementation Validation

### Feature: [Name]
### Week/Phase: [X]
### Estimated Effort: [Time]

---

### 1. Data Dependencies ✓
- [ ] Listed all required data sources
- [ ] Verified all data sources exist and are stable
- [ ] Checked for no upcoming schema changes
- **Decision**: [ ] Proceed [ ] Postpone until [dependency]

---

### 2. Integration Points ✓
- [ ] Listed all modules to integrate with
- [ ] Verified APIs/interfaces are defined
- [ ] Confirmed no breaking changes expected
- **Decision**: [ ] Safe to integrate [ ] Wait for [module]

---

### 3. User Experience ✓
- [ ] Prerequisite features exist
- [ ] Feature provides standalone value
- [ ] No confusing UX gaps
- **Decision**: [ ] Good UX timing [ ] Defer to [phase]

---

### 4. Database Schema ✓
- [ ] Required tables/columns exist
- [ ] Schema is stable
- [ ] No cross-module migration impacts
- **Decision**: [ ] Schema ready [ ] Wait for [schema change]

---

### 5. Testing ✓
- [ ] Test data available or easily created
- [ ] Can test all flows independently
- [ ] No external module dependencies for tests
- **Decision**: [ ] Fully testable [ ] Partial testing (plan E2E for later)

---

### Final Decision
- [ ] ✅ **PROCEED NOW**: All checks passed
- [ ] ⏸️ **POSTPONE**: Document reason in docs/postponed/README.md, specify when to resume
- [ ] 🔧 **PARTIAL IMPLEMENTATION**: Build foundation now, enhance later (document what's deferred)

**If Postponing, Document**:
- What: [Brief description]
- Why: [Specific blocking dependencies]
- When: [After Week/Phase X]
- Link: [Add to docs/postponed/README.md]
```

---

## Decision Examples

### ✅ GOOD Decision: Implement Critical Path Analysis in Week 4

**5-Question Check**:

1. **Data Dependencies**: Only needs `feature_connections` table (created in Week 4) ✅
2. **Integration**: Algorithm is self-contained, no external APIs ✅
3. **User Experience**: Shows bottlenecks immediately, provides value ✅
4. **Schema**: Stable schema, no cross-module impacts ✅
5. **Testing**: Can test with mock dependency data ✅

**Result**: ✅ PROCEED in Week 4

---

### ✅ GOOD Decision: Postpone Mind Map Enhancements to Week 8+

**5-Question Check**:

1. **Data Dependencies**: Needs AI integration (Week 7), timeline data (Week 6) ⏳
2. **Integration**: Depends on dependency graph (Week 4) and AI assistant (Week 7) ⏳
3. **User Experience**: Basic mind mapping works (Week 3), enhancements can wait ✅
4. **Schema**: Stable, but enhancements need other modules' data ⏳
5. **Testing**: Can test basic features now, but advanced features need other modules ⏳

**Result**: ⏸️ POSTPONE to Week 8+ (after dependencies are met)

**Documentation**: Created `docs/postponed/MIND_MAP_ENHANCEMENTS.md` and added to `docs/postponed/README.md`

---

### ❌ BAD Decision: Implement Review System in Week 2

**5-Question Check**:

1. **Data Dependencies**: No features exist to review yet ❌
2. **Integration**: Features module still being built ❌
3. **User Experience**: Confusing - what are users reviewing? ❌
4. **Schema**: Stable, but pointless without features ❌
5. **Testing**: Can't test review flow without features ❌

**Result**: ❌ DON'T IMPLEMENT in Week 2

**Correct Timing**: Week 5, after Features (Week 2-3) and Timeline (Week 6) are stable

---

### ❌ BAD Decision: Show Dependencies on Mind Map Canvas in Week 3

**5-Question Check**:

1. **Data Dependencies**: Dependency graph algorithms don't exist yet (Week 4) ❌
2. **Integration**: `feature_connections` table doesn't exist yet ❌
3. **User Experience**: Confusing - users can't create dependencies yet ❌
4. **Schema**: Schema doesn't exist yet ❌
5. **Testing**: No dependency data to test with ❌

**Result**: ❌ DON'T IMPLEMENT in Week 3

**Correct Timing**: Week 8+, after dependency module (Week 4) is complete and stable

---

## When to Re-Evaluate Postponed Features

**Automatic Triggers**:

1. ✅ All dependency checkboxes are now ✅ (dependencies completed)
2. 📅 Reached scheduled review milestone (e.g., "End of Week 7")
3. 👥 User feedback urgently requests this feature
4. 🐛 Current implementation has gaps that postponed feature would fill
5. 🔄 Related module underwent major refactor, now easier to integrate

**Manual Review Process**:

1. Open `docs/postponed/README.md`
2. Check all dependency checkboxes: are they ✅?
3. Re-run 5-question framework with current state
4. Estimate effort: has it changed since postponement?
5. Decide: Implement now / Defer further / Split into phases
6. Update `docs/postponed/README.md` status:
   - If proceeding: Move to active backlog, add to current week
   - If deferring: Update dependencies, adjust review trigger
   - If splitting: Document which parts to do now vs. later

---

## Timing Validation Workflow

```
Before implementing ANY feature:
    ↓
Run 5-Question Framework
    ↓
All questions → YES
    ↓
✅ PROCEED with implementation
    ↓
Update IMPLEMENTATION_PLAN.md (mark as in-progress)

---

If ANY question → NO:
    ↓
Document in docs/postponed/README.md
    ↓
Specify:
- What's blocking
- When to resume
- Review trigger
    ↓
⏸️ POSTPONE implementation
    ↓
Continue with next prioritized feature
```

---

## Quick Reference

| **All Checks Pass** | **Some Checks Fail** | **Many Checks Fail** |
|---------------------|----------------------|----------------------|
| ✅ PROCEED NOW | ⚠️ PARTIAL IMPLEMENTATION | ❌ POSTPONE |
| Mark as in-progress | Build foundation only | Document in postponed features |
| Full implementation | Enhance later when dependencies ready | Set review trigger |
| Update progress docs | Document what's deferred | Update dependencies list |

---

**See Also**:

- [Postponed Features Process](POSTPONED_FEATURES_PROCESS.md)
- [Main Implementation Plan](../implementation/README.md)
- [Postponed Features List](README.md)

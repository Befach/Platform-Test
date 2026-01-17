# ✅ DOCUMENTATION AUDIT CHECKLIST

**Last Updated**: 2025-11-14
**Purpose**: Ensure documentation stays synchronized, consistent, and up-to-date
**Frequency**: Daily (end of session), Weekly (sprint review), Monthly (full audit)

---

## 📅 AUDIT SCHEDULE

### Daily (End of Work Session)

- [ ] Update PROGRESS.md with completed tasks
- [ ] Add CHANGELOG.md entries for new migrations
- [ ] Update task status in NEXT_STEPS.md

### Weekly (End of Sprint)

- [ ] Review IMPLEMENTATION_PLAN.md phase status
- [ ] Update README.md current status section
- [ ] Sync CLAUDE.md if processes changed
- [ ] Review REVISED_TIMELINE.md progress
- [ ] Check for undocumented decisions

### Monthly (Before Major Releases)

- [ ] Full documentation audit (use this checklist)
- [ ] Fix all inconsistencies
- [ ] Update all "Last Updated" timestamps
- [ ] Cross-reference verification

---

## 📝 CORE DOCUMENTATION FILES

### 1. README.md

**Purpose**: Project overview, quick start, current status
**Last Reviewed**: 2025-11-14

#### Checklist

- [ ] **Project name correct** ("Product Lifecycle Management Platform")
- [ ] **Tech stack up-to-date** (Next.js 15, Supabase, etc.)
- [ ] **Current status accurate** (Week X, Y% complete)
- [ ] **Live URL working** (<https://platform-test-cyan.vercel.app>)
- [ ] **Installation steps tested**
- [ ] **MCP count correct** (3 active MCPs)
- [ ] **Implementation status matches PROGRESS.md**
- [ ] **Known issues section updated**
- [ ] **Timestamp updated**

---

### 2. CLAUDE.md

**Purpose**: Project guidelines, tech stack, process workflows
**Last Reviewed**: 2025-01-13

#### Checklist

- [ ] **Tech stack summary matches README.md**
- [ ] **MCP configuration matches cursor-mcp-config.json**
- [ ] **Coding standards reflect current practices**
- [ ] **Quick commands section up-to-date**
- [ ] **Documentation maintenance workflow included**
- [ ] **Links to new docs** (PROGRESS.md, CHANGELOG.md, NEXT_STEPS.md)
- [ ] **Current state section accurate**
- [ ] **5-Question Framework up-to-date**
- [ ] **Postponed features policy documented**
- [ ] **Timestamp updated**

---

### 3. IMPLEMENTATION_PLAN.md (or docs/implementation/)

**Purpose**: 8-week roadmap, database schema, detailed tasks
**Last Reviewed**: 2025-01-13

#### Checklist

- [ ] **Database schema matches actual migrations**
- [ ] **Missing tables documented** (mind_maps, feature_connections, etc.)
- [ ] **Phase completions marked** (✅ for done, ⏳ for in-progress)
- [ ] **Week status accurate** (matches PROGRESS.md)
- [ ] **Postponed features integrated** (or linked)
- [ ] **Undocumented decisions explained**
- [ ] **Success metrics updated**
- [ ] **Timestamp updated**

**Action**: If over 2,000 lines, split into folder structure (see [NEXT_STEPS.md](../planning/NEXT_STEPS.md#documentation-improvements))

---

### 4. PROGRESS.md

**Purpose**: Weekly tracker with completion percentages
**Last Reviewed**: 2025-11-14

#### Checklist

- [ ] **Overall progress percentage accurate**
- [ ] **Week-by-week completion updated**
- [ ] **Visual progress bars match percentages**
- [ ] **Task status current** (✅ completed, ⏳ in-progress, ❌ not started)
- [ ] **Blockers section up-to-date**
- [ ] **Metrics section accurate** (files, migrations, components)
- [ ] **Risk assessment current**
- [ ] **Recommendations relevant**
- [ ] **Next review date set**
- [ ] **Timestamp updated**

---

### 5. CHANGELOG.md

**Purpose**: Migration history, feature tracking, breaking changes
**Last Reviewed**: 2025-11-14

#### Checklist

- [ ] **All migrations documented**
- [ ] **Migration dates correct** (no future dates)
- [ ] **Feature implementations tracked**
- [ ] **Undocumented decisions explained**
- [ ] **Breaking changes noted**
- [ ] **Security fixes documented**
- [ ] **Known issues updated**
- [ ] **Version numbers incremented**
- [ ] **Timestamp updated**

---

### 6. NEXT_STEPS.md

**Purpose**: Immediate actions, priorities, tactical roadmap
**Last Reviewed**: 2025-11-14

#### Checklist

- [ ] **Immediate actions relevant** (this week)
- [ ] **Priorities current** (match PROGRESS.md blockers)
- [ ] **Time estimates reasonable**
- [ ] **Task owners assigned**
- [ ] **Completed items removed or marked** (✅)
- [ ] **Blockers section updated**
- [ ] **Success metrics achievable**
- [ ] **Next review date set**
- [ ] **Timestamp updated**

---

### 7. REVISED_TIMELINE.md

**Purpose**: Realistic 12-week timeline, milestones, adjustments
**Last Reviewed**: 2025-11-14

#### Checklist

- [ ] **Current progress percentage matches PROGRESS.md**
- [ ] **Visual roadmap bars accurate**
- [ ] **Weekly breakdown matches actual work**
- [ ] **Adjustments from original plan documented**
- [ ] **Milestones achievable**
- [ ] **Decision points scheduled**
- [ ] **Launch date realistic**
- [ ] **Risk mitigation updated**
- [ ] **Timestamp updated**

---

### 8. RECOMMENDED_AGENTS.md

**Purpose**: Claude agents mapped to implementation phases
**Last Reviewed**: 2025-01-13

#### Checklist

- [ ] **Agent count matches CLAUDE.md** (15 agents)
- [ ] **Week-by-week agent recommendations current**
- [ ] **Agent descriptions accurate**
- [ ] **Example prompts tested**
- [ ] **Use cases relevant**
- [ ] **No duplicate agents**
- [ ] **Timestamp updated**

---

### 9. MCP_USAGE_GUIDE.md

**Purpose**: MCP usage examples and patterns
**Last Reviewed**: 2025-11-26

#### Checklist

- [ ] **MCP count correct** (5 active: Supabase, Playwright, Vercel, Parallel Search, Parallel Task)
- [ ] **Usage examples current**
- [ ] **Matches cursor-mcp-config.json**
- [ ] **Timestamp updated**

---

### 10. MIND_MAP_ENHANCEMENTS.md

**Purpose**: Postponed mind map features (23 enhancements)
**Last Reviewed**: 2025-01-13

#### Checklist

- [ ] **Dependencies tracked with checkboxes**
- [ ] **Review trigger date set**
- [ ] **Rationale still valid**
- [ ] **When-to-implement condition clear**
- [ ] **Priority level appropriate**
- [ ] **Estimated effort current**
- [ ] **Timestamp updated**

---

### 11. .cursorrules

**Purpose**: Cursor AI behavior, coding standards, MCP usage
**Last Reviewed**: 2025-01-13

#### Checklist

- [ ] **Tech stack matches CLAUDE.md**
- [ ] **Coding standards reflect current practices**
- [ ] **MCP usage guidelines accurate**
- [ ] **Component examples use shadcn/ui**
- [ ] **TypeScript patterns up-to-date**
- [ ] **Multi-tenancy patterns documented**
- [ ] **No outdated frameworks mentioned**

---

### 12. cursor-mcp-config.json

**Purpose**: Active MCP server configuration
**Last Reviewed**: 2025-01-13

#### Checklist

- [ ] **MCP count matches docs** (3 active)
- [ ] **Server configs valid** (Supabase, Playwright, Parallel-search)
- [ ] **No deprecated MCPs**
- [ ] **Matches MCP_USAGE_GUIDE.md**

---

## 🔗 CROSS-REFERENCE VALIDATION

### Tech Stack Consistency

**Check these files mention same tech stack:**

- [ ] README.md
- [ ] CLAUDE.md
- [ ] IMPLEMENTATION_PLAN.md
- [ ] .cursorrules

**Expected Stack**:

- Next.js 15 + TypeScript
- Supabase (PostgreSQL + Real-time + Auth + RLS)
- shadcn/ui + Tailwind CSS
- ReactFlow
- Recharts
- Stripe
- Resend
- OpenRouter

---

### MCP Configuration Consistency

**Check these files have same MCP count (5):**

- [ ] README.md (MCP section)
- [ ] CLAUDE.md (MCP Servers table)
- [ ] docs/reference/MCP_USAGE_GUIDE.md
- [ ] cursor-mcp-config.json (count servers)

**Expected MCPs**:

1. Supabase MCP
2. Playwright MCP
3. Parallel-search MCP

---

### Progress Consistency

**Check these files have same completion percentage:**

- [ ] README.md (line 4, line 378-379)
- [ ] PROGRESS.md (line 3, line 12)
- [ ] REVISED_TIMELINE.md (line 4, line 21)
- [ ] NEXT_STEPS.md (line 3)

**Expected Progress**: ~25% (Week 3-4)

---

### Database Schema Consistency

**Check these locations document same tables:**

- [ ] IMPLEMENTATION_PLAN.md (Core Tables, Feature Tables, Mind Mapping Tables)
- [ ] CLAUDE.md (Database Schema section)
- [ ] README.md (Database Schema section)
- [ ] CHANGELOG.md (Migration History Summary)
- [ ] Actual migrations in `supabase/migrations/`

**Expected Tables**: 20+ (see CHANGELOG.md for full list)

---

### Timeline Consistency

**Check these files align on current week:**

- [ ] README.md (line 4)
- [ ] PROGRESS.md (line 3)
- [ ] NEXT_STEPS.md (line 2)
- [ ] REVISED_TIMELINE.md (line 4)
- [ ] CHANGELOG.md (latest version)

**Expected**: Week 3-4

---

## 🔄 UPDATE TRIGGERS

### When to Update Documentation (Always!)

#### Database Schema Changes

**Update Immediately:**

- [ ] IMPLEMENTATION_PLAN.md (schema section)
- [ ] CHANGELOG.md (new migration entry)
- [ ] CLAUDE.md (if new patterns emerge)
- [ ] README.md (if major change)

**Template**:

```markdown
## [0.X.X] - YYYY-MM-DD
### Added - Database
- Migration `YYYYMMDDHHMMSS_description.sql`
  - Created `table_name` table
  - **Purpose**: [Why this table exists]
  - **Rationale**: [Business need]
```

---

#### Tech Stack Changes (Package Added/Removed)

**Update Immediately:**

- [ ] README.md (Tech Stack section)
- [ ] CLAUDE.md (Tech Stack Summary)
- [ ] IMPLEMENTATION_PLAN.md (if architecture changes)
- [ ] CHANGELOG.md (Added/Removed section)

---

#### Process Changes (New Workflows, MCPs)

**Update Immediately:**

- [ ] CLAUDE.md (Workflows section)
- [ ] .cursorrules (if coding standards change)
- [ ] docs/reference/MCP_USAGE_GUIDE.md (if MCP config changes)

---

#### Phase Completions (Week Done)

**Update Immediately:**

- [ ] IMPLEMENTATION_PLAN.md (mark week complete)
- [ ] PROGRESS.md (update percentages, checkboxes)
- [ ] README.md (current status)
- [ ] NEXT_STEPS.md (move to next priority)
- [ ] CHANGELOG.md (milestone entry)

---

#### Postponed Features (New Deferrals)

**Update Immediately:**

- [ ] Create `[FEATURE_NAME].md` (detailed spec)
- [ ] Update IMPLEMENTATION_PLAN.md (postponed section)
- [ ] Update relevant week file (if folder structure)
- [ ] Add entry to CHANGELOG.md (Deprecated or Postponed section)

**Template** (see CLAUDE.md, line 340-410):

```markdown
### [Feature Name] ([X features] - [Target Phase])
**Postponed Date**: YYYY-MM-DD
**Reason**: [Blocking dependencies]
**Dependencies**:
- [✅/⏳] Week X: [Module] - [Requirement]
**When to Implement**: After [milestone]
**Review Trigger**: [Date or condition]
**Rationale**: [Detailed explanation]
```

---

#### Architecture Changes (New Modules, APIs)

**Update Immediately:**

- [ ] ARCHITECTURE.md (diagrams)
- [ ] API_REFERENCE.md (if API changes)
- [ ] CLAUDE.md (quick reference)
- [ ] CHANGELOG.md (Added section)

---

## 📋 FULL AUDIT PROCESS (Monthly)

### Step 1: Preparation (15 min)

- [ ] Open all core documentation files
- [ ] Open cursor-mcp-config.json
- [ ] Open latest migrations in supabase/migrations/
- [ ] Open PROGRESS.md for reference

---

### Step 2: Core Files Review (60 min)

- [ ] README.md - Check all items in checklist above
- [ ] CLAUDE.md - Check all items in checklist above
- [ ] IMPLEMENTATION_PLAN.md - Check all items in checklist above
- [ ] PROGRESS.md - Check all items in checklist above
- [ ] CHANGELOG.md - Check all items in checklist above

---

### Step 3: Cross-Reference Validation (30 min)

- [ ] Tech stack consistency (4 files)
- [ ] MCP configuration consistency (4 files)
- [ ] Progress consistency (4 files)
- [ ] Database schema consistency (5 locations)
- [ ] Timeline consistency (5 files)

---

### Step 4: Undocumented Decisions (30 min)

- [ ] Review CHANGELOG.md for undocumented decisions
- [ ] Check git log for untracked changes
- [ ] Ask team: Any decisions made but not documented?
- [ ] Document any findings in IMPLEMENTATION_PLAN.md or CHANGELOG.md

---

### Step 5: Fix Inconsistencies (varies)

- [ ] Create list of all inconsistencies found
- [ ] Prioritize by impact (Critical → Low)
- [ ] Fix critical inconsistencies immediately
- [ ] Schedule medium/low fixes for next sprint

---

### Step 6: Update Timestamps (10 min)

- [ ] Update "Last Updated" in all modified files
- [ ] Update "Last Reviewed" dates in this checklist
- [ ] Commit all documentation changes

---

### Step 7: Report (15 min)

- [ ] Create audit report (optional, for larger teams)
- [ ] List all changes made
- [ ] Note any remaining issues
- [ ] Share with team

---

## 🚨 RED FLAGS (Fix Immediately)

### Critical Inconsistencies

- [ ] **MCP count mismatch** (e.g., README says 2, config has 3)
- [ ] **Progress percentage differs by >10%** across files
- [ ] **Database schema documented but migration missing**
- [ ] **Migration exists but not documented**
- [ ] **Tech stack mismatch** (e.g., README says React 18, package.json has 19)
- [ ] **Security vulnerabilities documented but not fixed**

### Warning Signs

- [ ] **Last Updated > 2 weeks ago** on any core file
- [ ] **No CHANGELOG entry for new migration**
- [ ] **Postponed feature past review trigger date**
- [ ] **Known issues not in GitHub Issues**
- [ ] **TODO comments in documentation** (should be in NEXT_STEPS.md)

---

## 📊 AUDIT SCORECARD

### Grading Criteria

**A+ (95-100%)**:

- All checklists complete
- Zero inconsistencies
- All timestamps current (<1 week old)
- Cross-references valid

**A (90-94%)**:

- 1-2 minor inconsistencies
- Most timestamps current
- Cross-references mostly valid

**B (80-89%)**:

- 3-5 minor inconsistencies
- Some timestamps outdated
- Some cross-references need fixing

**C (70-79%)**:

- 6-10 inconsistencies
- Many timestamps outdated
- Many cross-references invalid

**D (60-69%)**:

- 11-20 inconsistencies
- Most timestamps outdated
- Major documentation drift

**F (<60%)**:

- 20+ inconsistencies
- Documentation unmaintained
- Critical issues unaddressed

**Target**: Maintain **A grade** (90%+) at all times

---

## 🎯 CONTINUOUS IMPROVEMENT

### Documentation Debt

- Track documentation debt like technical debt
- Add "Docs Debt" label in GitHub Issues
- Allocate time each sprint for documentation
- Don't let documentation fall behind >1 week

### Automation Opportunities

- [ ] Auto-update timestamps on file save
- [ ] Pre-commit hook to check documentation consistency
- [ ] CI/CD check for README.md accuracy
- [ ] Automated weekly documentation audit report

### Team Education

- [ ] Share this checklist with team
- [ ] Train new members on documentation maintenance
- [ ] Include documentation in definition of done
- [ ] Celebrate good documentation practices

---

## 📚 RESOURCES

- [Keep a Changelog](https://keepachangelog.com/) - Changelog best practices
- [Semantic Versioning](https://semver.org/) - Version numbering
- [CommonMark](https://commonmark.org/) - Markdown specification
- [Mermaid](https://mermaid.js.org/) - Diagram syntax

---

**Last Audit**: 2025-11-14
**Next Audit**: 2025-11-21 (Weekly)
**Full Audit**: 2025-11-28 (Monthly)

---

**Remember**: Good documentation is a feature, not a chore! 📝✨

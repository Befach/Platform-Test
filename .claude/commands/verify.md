---
description: Cross-check all documentation, update if needed
---

Final verification that all documentation is properly updated across the entire workflow.

# Verify

This command performs a final documentation verification after merge.

## Usage

```bash
/verify
```

## What This Command Does

### Step 1: Read Feature Details
```bash
# Get feature name, Beads ID, PR number from git log
git log --oneline -1

# Get research doc if exists
git show HEAD:docs/research/<feature-slug>.md
```

### Step 2: Cross-Check All Documentation Files

**A. docs/planning/PROGRESS.md**:
- ✓ Feature listed in completed section?
- ✓ Completion date accurate?
- ✓ Beads issue ID referenced?
- ✓ PR number linked?
- ✓ Research doc path included?
- **If missing/incomplete**: Update now

**B. docs/reference/API_REFERENCE.md** (if API changes):
- ✓ New endpoints documented?
- ✓ Request/response schemas complete?
- ✓ Authentication requirements listed?
- ✓ Example requests included?
- ✓ Error responses documented?
- **If missing/incomplete**: Update now

**C. docs/architecture/** (if strategic):
- ✓ Architecture diagrams updated?
- ✓ New patterns documented?
- ✓ System overview reflects changes?
- ✓ Decision records (ADRs) added if applicable?
- ✓ Component relationships accurate?
- **If missing/incomplete**: Update now

**D. README.md** (if user-facing):
- ✓ Features list updated?
- ✓ Configuration options documented?
- ✓ Installation/setup steps current?
- ✓ Usage examples included?
- ✓ Screenshots/demos updated (if visual)?
- **If missing/incomplete**: Update now

**E. docs/testing/** (if new patterns):
- ✓ New test utilities documented?
- ✓ Testing strategy updated?
- ✓ Example tests included?
- ✓ Coverage requirements noted?
- **If missing/incomplete**: Update now

**F. docs/research/<feature-slug>.md** (if exists):
- ✓ Research document exists?
- ✓ All sections complete?
- ✓ Key decisions documented with reasoning?
- ✓ TDD scenarios identified?
- ✓ OWASP Top 10 checklist completed?
- **If missing/incomplete**: Update now

### Step 3: Cross-Reference Consistency

- ✓ PROGRESS.md links to research doc?
- ✓ Research doc referenced in merged PR?
- ✓ API changes in API_REFERENCE.md match code?
- ✓ Architecture docs consistent with implementation?
- ✓ README.md examples actually work?

### Step 4: Fix Missing/Incomplete Documentation

If any documentation is missing or incomplete:
```bash
# Make updates to relevant files

# Commit documentation fixes
git add docs/ README.md
git commit -m "docs: post-merge documentation verification

Cross-checked and updated all documentation after <feature-name> merge:
- Updated: [list of files updated]
- Fixed: [what was missing/incomplete]
- Verified: All cross-references consistent"

git push
```

### Step 5: Final Verification Checklist

- [ ] PROGRESS.md: Feature completion documented
- [ ] API_REFERENCE.md: API changes documented (if applicable)
- [ ] Architecture docs: System changes reflected (if applicable)
- [ ] README.md: User-facing updates complete (if applicable)
- [ ] Testing docs: New patterns documented (if applicable)
- [ ] Research doc: Complete and linked (if exists)
- [ ] Cross-references: All links working and consistent

## Example Output (All Complete)

```
✓ Documentation Verification Complete

Checked Files:
  ✓ docs/planning/PROGRESS.md: Complete and accurate
  ✓ docs/reference/API_REFERENCE.md: 3 endpoints fully documented
  ✓ docs/architecture/: Diagrams updated, consistent with code
  ✓ README.md: Features list and examples updated
  ✓ docs/testing/: New test patterns documented
  ✓ docs/research/stripe-billing.md: Complete with all sections

Cross-References:
  ✓ PROGRESS.md → research doc: Valid link
  ✓ PR #123 → research doc: Referenced
  ✓ API_REFERENCE.md ↔ Code: Consistent
  ✓ Architecture docs ↔ Implementation: Aligned
  ✓ README.md examples: Tested and working

No documentation issues found!

Workflow complete! 🎉
Ready for next task: /status
```

## Example Output (Issues Found & Fixed)

```
✓ Documentation Verification Complete

Found Issues:
  ✗ docs/planning/PROGRESS.md: Missing completion date
  ✗ docs/reference/API_REFERENCE.md: Error responses not documented
  ✗ README.md: Missing configuration example

Fixed All Issues:
  ✓ Updated PROGRESS.md: Added completion date (2026-01-28)
  ✓ Updated API_REFERENCE.md: Added error response schemas
  ✓ Updated README.md: Added .env configuration example
  ✓ Committed: docs: post-merge documentation verification

Final Verification:
  ✓ All documentation complete
  ✓ All cross-references valid
  ✓ All examples tested

Workflow complete! 🎉
Ready for next task: /status
```

## Integration with Workflow

```
1. /status               → Understand current context
2. /research <name>      → Research and document
3. /plan <feature-slug>  → Create plan and tracking
4. /dev                  → Implement with TDD
5. /check                → Validate
6. /ship                 → Create PR
7. /review               → Address comments
8. /merge                → Merge and cleanup
9. /verify               → Final documentation check (you are here) ✓
```

## Tips

- **Run after every merge**: Catch documentation gaps immediately
- **Fix immediately**: Don't accumulate documentation debt
- **Cross-check everything**: Verify consistency across all docs
- **Test examples**: Ensure README examples actually work
- **Complete checklist**: All items must be verified
- **Ready for next feature**: After /verify, run /status for next task

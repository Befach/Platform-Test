---
description: Check current stage and context
---

Check where you are in the project and what work is in progress.

# Status Check

This command helps you understand the current state of the project before starting new work.

## Usage

```bash
/status
```

## What This Command Does

### Step 1: Read Current Progress
```bash
cat docs/planning/PROGRESS.md
```
- What's completed?
- What's the next priority?
- Which week/milestone are we in?

### Step 2: Check Active Work
```bash
# Active Beads issues
bd list --status in_progress

# Active OpenSpec proposals
openspec list --active
```

### Step 3: Review Recent Work
```bash
# Recent commits
git log --oneline -10

# Recently completed Beads
bd list --status done --limit 5

# Archived OpenSpec proposals
openspec list --archived --limit 3
```

### Step 4: Determine Context
- **New feature**: No active work, ready to start fresh
- **Continuing work**: In-progress issues found, resume where left off
- **Review needed**: Work marked complete, needs review/merge

## Example Output

```
✓ Current Stage: Week 7, AI Integration 100% complete
✓ Next Priority: Week 8 - Billing & Testing

Active Work:
  - No in-progress Beads issues
  - No active OpenSpec proposals

Recent Completions:
  - bd-a3f8: BlockSuite simplification (merged 2 days ago)
  - bd-k2m5: Auth RLS policies (merged 5 days ago)

Context: Ready for new feature

Next: /research <feature-name>
```

## Next Steps

- **If starting new work**: Run `/research <feature-name>`
- **If continuing work**: Resume with appropriate phase command
- **If reviewing**: Run `/review <pr-number>` or `/merge <pr-number>`

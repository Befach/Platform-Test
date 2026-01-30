# PLM Platform Development Workflow

Complete 9-stage TDD-first workflow for feature development.

## Overview

This workflow integrates:
- **Test-Driven Development (TDD)**: Tests written UPFRONT
- **Research-First**: Evidence-based decisions with parallel-ai
- **Issue Tracking**: Beads for persistent tracking across agents
- **Strategic Planning**: OpenSpec for architectural changes
- **Security**: OWASP Top 10 analysis for every feature
- **Documentation**: Progressive updates, final verification

## Workflow Stages

```
┌─────────┐
│ /status │ → Check current stage & context
└────┬────┘
     │
┌────▼──────┐
│ /research │ → Deep research (parallel-ai), save to docs/research/
└────┬──────┘
     │
┌────▼────┐
│  /plan  │ → OpenSpec (if strategic) + Beads + branch
└────┬────┘
     │
┌────▼───┐
│  /dev  │ → TDD implementation (RED-GREEN-REFACTOR)
└────┬───┘
     │
┌────▼────┐
│ /check  │ → Validation (type/lint/tests/security)
└────┬────┘
     │
┌────▼────┐
│  /ship  │ → Create PR with full documentation
└────┬────┘
     │
┌────▼─────┐
│ /review  │ → Address ALL PR issues (GitHub Actions, Greptile, SonarCloud)
└────┬─────┘
     │
┌────▼─────┐
│  /merge  │ → Update docs, merge PR, archive, cleanup
└────┬─────┘
     │
┌────▼──────┐
│  /verify  │ → Cross-check all documentation, update if needed
└───────────┘
     │
     ✓ Complete
```

## Quick Reference

| Stage | Command | Key Actions |
|-------|---------|-------------|
| 1. Status | `/status` | Check PROGRESS.md, Beads, OpenSpec |
| 2. Research | `/research <name>` | parallel-ai + codebase, save to docs/research/ |
| 3. Plan | `/plan <slug>` | OpenSpec (if strategic) + Beads + branch |
| 4. Dev | `/dev` | TDD cycles (RED-GREEN-REFACTOR) |
| 5. Check | `/check` | Type/lint/security/tests |
| 6. Ship | `/ship` | Create PR with full docs |
| 7. Review | `/review <pr>` | Fix ALL PR issues |
| 8. Merge | `/merge <pr>` | Update docs, merge, archive |
| 9. Verify | `/verify` | Cross-check docs, update if needed |

For detailed information on each stage, see the individual command files in `.claude/commands/`.

## TDD Principles

### What is TDD?

**Test-Driven Development**: Write tests BEFORE writing implementation code.

**Benefits**:
- Catches bugs early
- Ensures code is testable
- Documents expected behavior
- Improves code design
- Provides confidence in refactoring

### TDD Cycle

```
┌─────────────┐
│ RED (Test)  │ → Write failing test
└──────┬──────┘
       │
┌──────▼───────┐
│ GREEN (Code) │ → Write minimal code to pass
└──────┬───────┘
       │
┌──────▼────────┐
│ REFACTOR      │ → Clean up and optimize
└───────────────┘
       │
       └─→ Repeat for next feature
```

### Example TDD Flow

**Feature**: Add email validation

**RED** (Write test first):
```typescript
// test/validation.test.ts
test('should validate email format', () => {
  expect(validateEmail('test@example.com')).toBe(true)
  expect(validateEmail('invalid')).toBe(false)
})
```
**Run test**: ❌ Fails (function doesn't exist)

**GREEN** (Make it pass):
```typescript
// src/validation.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```
**Run test**: ✅ Passes

**REFACTOR** (Optimize):
```typescript
// Extract regex to constant
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}
```
**Run test**: ✅ Still passes

---

## Research-First Approach

### Why Research First?

**Evidence-based decisions**:
- Understand existing patterns before reinventing
- Learn from others' mistakes (known issues)
- Apply industry best practices
- Make informed security decisions
- Document reasoning for future reference

### parallel-ai Integration

**MANDATORY for all features**: Use parallel-ai skill for web research

**Research Queries**:
```
"Next.js 16 [feature] best practices 2026"
"Supabase [feature] implementation patterns"
"OWASP Top 10 risks for [feature] 2026"
"[Feature] security vulnerabilities common attacks"
"Secure [feature] implementation checklist"
```

**Document Everything**:
- Source URLs
- Key insights
- Applicability to project
- Decision impact
- Evidence for choices

---

## Security-First Development

### OWASP Top 10 Analysis

**MANDATORY for every feature**: Analyze against OWASP Top 10 2021

**The List**:
1. A01: Broken Access Control
2. A02: Cryptographic Failures
3. A03: Injection
4. A04: Insecure Design
5. A05: Security Misconfiguration
6. A06: Vulnerable Components
7. A07: Identification and Authentication Failures
8. A08: Software and Data Integrity Failures
9. A09: Security Logging and Monitoring Failures
10. A10: Server-Side Request Forgery (SSRF)

**For Each Risk**:
- Risk level: High/Medium/Low
- Applicability: Yes/No
- Mitigation strategy
- Test scenarios
- Evidence from research

**Security Tests** (TDD):
```typescript
// test/security/access-control.test.ts
test('should prevent unauthorized access to other team data', async () => {
  const user = await createTestUser({ teamId: 'team-1' })
  const response = await api.get('/data?team_id=team-2')
    .set('Authorization', `Bearer ${user.token}`)

  expect(response.status).toBe(403)
  expect(response.body.data).toBeUndefined()
})
```

---

## Cross-Agent Collaboration

### Beads for Persistence

**Why Beads**:
- Git-backed (survives agent switches)
- Cross-agent visibility
- Status tracking
- Dependency management

**Workflow**:
```bash
# Agent 1 (Claude Code)
bd create "Add notifications"
bd update bd-x7y2 --status in_progress --comment "API done, UI pending"
bd sync && git push

# Agent 2 (Cursor)
git pull && bd sync
bd show bd-x7y2  # See status: "API done, UI pending"
# Continue UI work
bd update bd-x7y2 --status done
bd sync && git push
```

---

## Tips & Best Practices

1. **Always TDD**: Write tests BEFORE implementation
2. **Research everything**: Use parallel-ai for every feature
3. **Security first**: OWASP Top 10 analysis mandatory
4. **Document decisions**: Evidence and reasoning in research docs
5. **Update Beads regularly**: Keep status current for handoffs
6. **Commit frequently**: After each TDD cycle
7. **Address ALL PR feedback**: GitHub Actions, Greptile, SonarCloud
8. **Update docs progressively**: Don't wait until the end
9. **Verify at the end**: Final documentation check catches gaps
10. **Sync often**: `bd sync` at end of every session

---
description: Deep research with parallel-ai, document findings
---

Research a feature comprehensively using codebase exploration and web research.

# Research

This command performs comprehensive research before planning a feature.

## Usage

```bash
/research <feature-name>
```

## What This Command Does

### Step 1: Codebase Research
Use the Explore agent to:
- Search for similar patterns/implementations
- Identify affected files and modules
- Check existing tests and test infrastructure
- Find integration points
- Review similar features

### Step 2: Web Research (MANDATORY: parallel-ai skill)
Use the `parallel-ai` skill for:

**Best Practices**:
- "Next.js 16 [feature] best practices 2026"
- "Supabase [feature] implementation patterns"
- "TypeScript [feature] production patterns"

**Security Research**:
- "OWASP Top 10 risks for [feature] 2026"
- "[Feature] security vulnerabilities common attacks"
- "Secure [feature] implementation checklist"
- "[Library/framework] security best practices"
- "CVEs related to [feature] vulnerability"

**Known Issues**:
- GitHub issues/discussions
- Stack Overflow solutions
- Common pitfalls and gotchas
- Security advisories

**Library Documentation** (Context7 MCP):
- Official API references
- Migration guides
- Code examples
- Security guidelines

**Case Studies**:
- Real-world implementations
- Blog posts from production use
- Community tutorials
- Security incident reports

### Step 3: Document Research
Save to `docs/research/<feature-slug>.md` with:
- **Objective**: What we're trying to achieve
- **Codebase Analysis**: Existing patterns, affected modules, test infrastructure
- **Web Research**: Best practices, known issues, library docs (with sources)
- **Key Decisions & Reasoning**: What, why, evidence, alternatives
- **TDD Test Scenarios**: Test files, assertions, test data
- **Security Analysis**: OWASP Top 10 + feature-specific risks
- **Scope Assessment**: Tactical/Strategic, complexity, parallelization

## Research Template

See `docs/research/TEMPLATE.md` for the complete template structure.

## Example Output

```
✓ Codebase Research: Complete
  - Found: 3 similar payment integrations
  - Affected: 8 files across 4 modules
  - Tests: Existing payment test harness available

✓ Web Research (parallel-ai): Complete
  - Best practices: 12 sources reviewed
  - Known issues: 5 gotchas identified
  - Documentation: Context7 Stripe SDK reviewed
  - Case studies: 3 production implementations analyzed

✓ Research Document: docs/research/stripe-billing-integration.md
  - Codebase analysis: ✓
  - Web research: ✓
  - Key decisions: 8 documented with reasoning
  - TDD scenarios: 4 identified
  - Security analysis: OWASP Top 10 completed
  - Scope: Strategic (architecture change)

✓ Key Decision Example:
  Decision: Use Stripe SDK v4 (not v3)
  Reasoning: v4 has built-in retry logic and better TypeScript types
  Evidence: Stripe migration guide + 3 blog posts on production experience
  Alternatives: v3 (rejected due to manual retry handling)

Next: /plan stripe-billing-integration
```

## Integration with Workflow

```
1. /status               → Understand current context
2. /research <name>      → Research and document (you are here)
3. /plan <feature-slug>  → Create plan and tracking
4. /dev                  → Implement with TDD
5. /check                → Validate
6. /ship                 → Create PR
7. /review               → Address comments
8. /merge                → Merge and cleanup
9. /verify               → Final documentation check
```

## Tips

- **Always use parallel-ai**: Never skip web research
- **Document sources**: Include URLs for all research
- **Identify TDD scenarios upfront**: Tests before implementation
- **Security first**: OWASP Top 10 analysis is mandatory
- **Evidence-based decisions**: Every decision needs reasoning + evidence

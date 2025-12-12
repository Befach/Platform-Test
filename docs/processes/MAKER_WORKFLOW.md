# MAKER Framework Workflow

**Last Updated**: 2025-12-09

[Back to Root](../../README.md) | [Back to CLAUDE.md](../../CLAUDE.md)

---

## Overview

The **MAKER Framework** (Cognizant AI Lab) is integrated into this project for improved AI reliability:

- **M**aximal **A**gentic decomposition - Break tasks into atomic steps
- **K**-threshold Error mitigation - Multiple agents vote for consensus
- **R**ed-flagging - Filter out confused/malformed outputs

**Sources**: [Cognizant MAKER Research](https://www.cognizant.com/us/en/ai-lab/blog/maker) | [arXiv Paper](https://arxiv.org/abs/2511.09030)

---

## Slash Commands

### `/decompose` - Maximal Agentic Decomposition

**Purpose**: Break complex tasks into atomic steps using Explore + Plan agents

**Workflow**:
1. **Discovery** - Launch `Explore` agent to find all relevant files
2. **Planning** - Launch `Plan` agent to design implementation strategy
3. **Tracking** - Create atomic task list with TodoWrite

**When to Use**:
- Task complexity is unknown
- Multiple files will be affected
- Implementation approach is unclear

---

### `/validate-consensus` - K-threshold Voting

**Purpose**: Run parallel validation agents for consensus (2/3 must approve)

**Agents** (run in PARALLEL):

| Agent | Focus | Output |
|-------|-------|--------|
| `code-reviewer` | Code quality, patterns, bugs | APPROVE/CONCERNS/REJECT |
| `architect-review` | Architecture, scalability | APPROVE/CONCERNS/REJECT |
| `security-auditor` | OWASP, vulnerabilities, RLS | APPROVE/CONCERNS/REJECT |

**K-threshold Rules**:
- **K = 2**: Minimum approvals needed
- **N = 3**: Total validators
- **Threshold**: 66% (2/3) must approve
- **Tie-breaker**: code-reviewer verdict takes precedence

**When to Use**:
- Changes touching > 3 files
- Database schema changes (migrations)
- API contract changes
- Security-sensitive code (auth, RLS, payments)
- New dependencies added

---

### `/red-flag-check` - Output Filtering

**Purpose**: Detect and categorize issues by severity

**Detection Agents**:

| Trigger | Agent | Focus |
|---------|-------|-------|
| Code changes | `code-reviewer` | Quality, patterns, bugs |
| Errors/failures | `debugger` | Root cause, reproduction |
| Security-sensitive | `security-auditor` | OWASP, secrets, RLS |
| Architecture changes | `architect-review` | Alignment, scalability |

**Severity Levels**:

| Level | Action |
|-------|--------|
| CRITICAL | BLOCKED - Must fix before proceeding |
| WARNING | REVIEW - Ask user to proceed or fix |
| SUGGESTION | PASS - Proceed, note improvements |

**Automatic Red Flags** (Discard & Retry):
- Any agent returns REJECT verdict
- `debugger` finds unresolved errors
- `security-auditor` finds HIGH severity vulnerabilities
- `code-reviewer` returns Critical issues

**Warning Flags** (Review Before Accepting):
- `architect-review` returns CONCERNS
- `code-reviewer` returns Warnings
- Touches files outside stated scope
- Introduces new dependencies without justification
- Changes > 200 lines in single file

---

## Complete Workflow Diagram

```
USER REQUEST
     |
     v
+---------------------------+
|  /decompose (MAD)         |
|  Explore -> Plan -> Todo  |
+---------------------------+
     |
     v
+---------------------------+
|  IMPLEMENTATION           |
|  (Parallel Sub-Agents)    |
+---------------------------+
     |
     v
+---------------------------+
|  /red-flag-check          |
|  debugger OR code-reviewer|
|  CRITICAL -> BLOCK        |
|  WARNING  -> REVIEW       |
|  SUGGEST  -> PROCEED      |
+---------------------------+
     |
     v
+---------------------------+
|  /validate-consensus      |
|  3 PARALLEL validators    |
|  K >= 2/3? -> PASS        |
|  K <  2/3? -> ITERATE     |
+---------------------------+
     |
     v
COMPLETE
```

---

## Agent Reference

### Core Agents

| Agent | Purpose | Tools |
|-------|---------|-------|
| `Explore` | Fast codebase exploration | Glob, Grep, Read (read-only) |
| `Plan` | Design implementation plans | Read, Glob, Grep, Bash (read-only) |
| `general-purpose` | Complex multi-step tasks | All tools |

### Validation Agents

| Agent | Purpose | Output Format |
|-------|---------|---------------|
| `code-reviewer` | Code quality review | Critical/Warnings/Suggestions |
| `architect-review` | Architecture review | APPROVE/CONCERNS/REJECT |
| `security-auditor` | Security review | Issues by Severity |

### Detection Agents

| Agent | Purpose | Trigger |
|-------|---------|---------|
| `debugger` | Debug errors/failures | Any error encountered |
| `error-detective` | Log/error analysis | Production issues |
| `performance-engineer` | Performance issues | Optimization needs |

---

## Parallel Execution Pattern

**CRITICAL**: Launch ALL validators in a SINGLE message for true K-threshold voting:

```
// CORRECT: Single message, multiple agents
Task(code-reviewer, files) + Task(architect-review, files) + Task(security-auditor, files)

// WRONG: Sequential calls
Task(code-reviewer, files) -> wait -> Task(architect-review, files)
```

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project guidelines with slash command reference
- [RECOMMENDED_AGENTS.md](../planning/RECOMMENDED_AGENTS.md) - Claude agents by phase
- [Plan File](../../.claude/plans/woolly-baking-kite.md) - Full implementation plan

---

[Back to Root](../../README.md)

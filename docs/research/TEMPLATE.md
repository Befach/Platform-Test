# Research: [Feature Name]

**Date**: YYYY-MM-DD
**Researcher**: Claude AI

## Objective
[What we're trying to achieve - clear problem statement and goals]

## Codebase Analysis

### Existing Patterns
- **File**: `path/to/file.ts`
- **Pattern**: [Description of existing implementation]
- **Reusability**: [Yes/No + reasoning]
- **Lessons learned**: [What worked, what didn't]

### Affected Modules
- **Module**: [name]
- **Changes needed**: [Description]
- **Impact**: [Low/Medium/High]
- **Dependencies**: [List any dependencies]

### Test Infrastructure
- **Existing tests**: `path/to/tests/`
- **Test utilities**: [Available testing tools/helpers]
- **Coverage**: [Current state - percentage, gaps]
- **Test patterns**: [What patterns are used - unit, integration, E2E]

## Web Research

### Best Practices (parallel-ai)
1. **Source**: [URL]
   - **Key insight**: [Summary of best practice]
   - **Applicability**: [How it applies to our project]
   - **Decision impact**: [What decision this influences]
   - **Implementation notes**: [How to apply]

2. **Source**: [URL]
   - [...]

### Known Issues (parallel-ai)
1. **Issue**: [Description]
   - **Source**: [GitHub/SO/Blog URL]
   - **Mitigation**: [How to avoid]
   - **Decision impact**: [Changes to approach]
   - **Frequency**: [How common is this issue]

2. **Issue**: [...]

### Library Documentation (Context7)
1. **Library**: [name and version]
   - **API**: [Relevant methods/patterns]
   - **Compatibility**: [Version requirements, breaking changes]
   - **Decision impact**: [Implementation details]
   - **Example usage**: [Code snippet]

2. **Library**: [...]

### Case Studies
1. **Source**: [URL]
   - **Company/Project**: [Who implemented this]
   - **Scale**: [Production scale, users, data volume]
   - **Lessons**: [What they learned]
   - **Applicability**: [How it relates to our use case]

2. **Source**: [...]

## Key Decisions & Reasoning

### Decision 1: [Decision Title]
- **Decision**: [What we decided]
- **Reasoning**: [Why we chose this approach]
- **Evidence**: [Research that supports this - links to sources]
- **Alternatives considered**:
  1. [Alternative 1]: [Why rejected]
  2. [Alternative 2]: [Why rejected]
- **Trade-offs**: [What we're giving up, what we're gaining]
- **Risk**: [Low/Medium/High] - [Risk description]

### Decision 2: [Decision Title]
- [...]

## TDD Test Scenarios (Identified Upfront)

### Unit Tests
1. **Test**: [Scenario description]
   - **File**: `test/path/test.ts`
   - **Function under test**: `functionName()`
   - **Assertions**: [What to verify]
   - **Test data**: [Required test data/mocks]
   - **Edge cases**: [List edge cases to cover]

2. **Test**: [...]

### Integration Tests
1. **Test**: [Scenario description]
   - **File**: `test/integration/test.ts`
   - **Components**: [What components are being tested together]
   - **Assertions**: [What to verify]
   - **Test data**: [Database fixtures, API mocks]

2. **Test**: [...]

### E2E Tests
1. **Test**: [User flow scenario]
   - **File**: `test/e2e/test.ts`
   - **User flow**: [Step-by-step user actions]
   - **Assertions**: [What user should see/experience]
   - **Test data**: [Complete test environment setup]

2. **Test**: [...]

## Security Analysis (OWASP Top 10 + Feature-Specific)

### OWASP Top 10 Applicability

#### A01: Broken Access Control
- **Risk**: [High/Medium/Low]
- **Applicable**: [Yes/No]
- **Mitigation**: [How addressed - RLS policies, permission checks]
- **Tests**: [Security test scenarios]
- **Evidence**: [Links to security research]

#### A02: Cryptographic Failures
- **Risk**: [High/Medium/Low]
- **Applicable**: [Yes/No]
- **Mitigation**: [Encryption at rest/transit, key management]
- **Tests**: [Encryption tests]
- **Compliance**: [Data protection requirements]

#### A03: Injection
- **Risk**: [High/Medium/Low]
- **Applicable**: [Yes/No]
- **Mitigation**: [Parameterized queries, input validation, sanitization]
- **Tests**: [SQL injection tests, XSS tests, command injection tests]
- **Libraries**: [What libraries help prevent injection]

#### A04: Insecure Design
- **Risk**: [High/Medium/Low]
- **Threat model**: [Key threats identified]
- **Secure design patterns**: [Patterns used - zero trust, defense in depth]
- **Architecture review**: [Security considerations in design]
- **Tests**: [Security design validation]

#### A05: Security Misconfiguration
- **Risk**: [High/Medium/Low]
- **Configuration reviewed**: [Yes/No]
- **Security headers**: [CSP, HSTS, X-Frame-Options, etc.]
- **Error handling**: [No sensitive info in errors]
- **Default accounts**: [No default/test credentials]
- **Tests**: [Configuration security tests]

#### A06: Vulnerable Components
- **Risk**: [High/Medium/Low]
- **Dependencies scanned**: [Yes/No - tool used]
- **Known CVEs**: [Count and severity from scan]
- **Update plan**: [If vulnerabilities found]
- **Monitoring**: [Dependabot, Snyk, etc.]
- **Tests**: [Dependency security checks]

#### A07: Identification and Authentication Failures
- **Risk**: [High/Medium/Low]
- **Auth mechanism**: [OAuth2/JWT/Session/etc.]
- **Session management**: [Secure/reviewed - timeout, rotation]
- **Password policy**: [Requirements if applicable]
- **MFA**: [Required/Optional/Not applicable]
- **Brute force protection**: [Rate limiting, account lockout]
- **Tests**: [Authentication tests, session tests]

#### A08: Software and Data Integrity Failures
- **Risk**: [High/Medium/Low]
- **Integrity checks**: [Where implemented - signatures, checksums]
- **Code signing**: [Yes/No]
- **CI/CD security**: [Pipeline reviewed, secrets management]
- **Supply chain**: [Trusted sources, verification]
- **Tests**: [Integrity validation tests]

#### A09: Security Logging and Monitoring Failures
- **Risk**: [High/Medium/Low]
- **Security events logged**: [List what's tracked]
- **Audit trail**: [What's tracked for compliance]
- **No sensitive data**: [Verified - no passwords/tokens in logs]
- **Alerting**: [Security alerts configured]
- **Log retention**: [Duration and compliance]
- **Tests**: [Logging tests, no sensitive data tests]

#### A10: Server-Side Request Forgery (SSRF)
- **Risk**: [High/Medium/Low]
- **External requests**: [Where made in code]
- **URL validation**: [Whitelist/validation rules]
- **Network restrictions**: [Firewall rules, VPC]
- **Input sanitization**: [User-controlled URLs]
- **Tests**: [SSRF prevention tests]

### Feature-Specific Security Risks

1. **Risk**: [Specific risk for this feature]
   - **Likelihood**: High/Medium/Low
   - **Impact**: High/Medium/Low
   - **Attack vector**: [How this could be exploited]
   - **Mitigation**: [Specific solution]
   - **Evidence**: [Research source showing this risk]
   - **Tests**: [Security test scenarios]
   - **Monitoring**: [How to detect attacks]

2. **Risk**: [Next risk]
   - [...]

### Security Test Scenarios (TDD)

1. **Test**: Unauthorized access attempt should fail
   - **File**: `test/security/access-control.test.ts`
   - **Scenario**: User tries to access another team's data
   - **Expected**: 403 Forbidden, no data leak

2. **Test**: SQL injection attempt should be blocked
   - **File**: `test/security/injection.test.ts`
   - **Scenario**: Malicious input in query parameter
   - **Expected**: Input sanitized, no SQL execution, error logged

3. **Test**: XSS attempt should be sanitized
   - **File**: `test/security/xss.test.ts`
   - **Scenario**: Script tag in user input
   - **Expected**: HTML escaped, no script execution

4. **Test**: [Additional security tests]
   - [...]

## Scope Assessment

- **Type**: Tactical / Strategic
  - **Rationale**: [Why this classification]
  - **OpenSpec needed**: Yes / No

- **Complexity**: Low / Medium / High
  - **Rationale**: [Number of files, systems involved, dependencies]
  - **Estimated effort**: [Without time, describe scope]

- **Parallel opportunity**: Yes / No
  - **Rationale**: [Independent tracks available?]
  - **Tracks**: [If yes, list potential parallel tracks]

- **Estimated files**: [Count]
  - **New files**: [List]
  - **Modified files**: [List]

- **Dependencies**:
  - **Internal**: [Other features/modules]
  - **External**: [Third-party libraries]
  - **Blockers**: [Any blocking dependencies]

- **Security risk level**: Low / Medium / High / Critical
  - **Rationale**: [Based on OWASP analysis]
  - **Mitigation priority**: [When to address]

## Next Steps

1. **If Strategic**: Create OpenSpec proposal
   - `openspec proposal create <feature-slug>`
   - Write proposal.md, tasks.md, design.md
   - Reference this research doc for evidence

2. **Create Beads issue**:
   - `bd create "<feature-name>"`
   - Link to this research doc
   - Link to OpenSpec if strategic

3. **Create branch**:
   - `git checkout -b feat/<feature-slug>`

4. **Proceed to /plan**:
   - Read this research doc
   - Create formal implementation plan
   - Wait for OpenSpec approval if strategic

## Research Checklist

- [ ] Codebase exploration complete
- [ ] parallel-ai web research complete (multiple sources)
- [ ] Context7 library documentation reviewed
- [ ] Case studies analyzed
- [ ] All key decisions documented with evidence
- [ ] TDD test scenarios identified upfront
- [ ] OWASP Top 10 analysis complete
- [ ] Feature-specific security risks identified
- [ ] Security test scenarios defined
- [ ] Scope assessment complete
- [ ] Next steps clear

---

**Note**: This research document serves as the single source of truth for all architectural and implementation decisions. Reference it throughout the development lifecycle (in OpenSpec proposals, PR descriptions, code reviews, and documentation).

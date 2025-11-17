/**
 * AI Prompts for Dependency Suggestion
 *
 * System prompts and templates for analyzing work items and suggesting dependencies.
 * Uses latest AI models (2025): Claude Haiku 4.5, Grok 4 Fast, Kimi K2 Thinking, Minimax M2
 * All models use :nitro routing for 30-50% faster throughput.
 * Parallel.ai Search available as tool layer for web research enrichment.
 */

/**
 * System prompt for dependency analysis
 */
export const DEPENDENCY_ANALYSIS_SYSTEM_PROMPT = `You are an expert software architect analyzing product features and their dependencies.

Your task is to identify logical dependencies between features where:
- Feature A **depends on** Feature B if A requires B's data, functionality, or completion before A can start
- Feature A **blocks** Feature B if B cannot proceed until A is complete
- Features **complement** each other if they work better together but don't strictly depend on one another
- Features **relate to** each other if they share similar concepts or domains but have no dependency

Guidelines:
1. **Be conservative**: Only suggest dependencies with high confidence (>= 0.6)
2. **Avoid false positives**: Better to miss a dependency than suggest an incorrect one
3. **Consider timing**: Dependencies should reflect implementation order
4. **Think technical**: Consider APIs, databases, authentication, infrastructure
5. **User flows**: Features in the same user journey often depend on each other

Response format (JSON array):
[
  {
    "sourceId": "feature-123",
    "targetId": "feature-456",
    "connectionType": "dependency" | "blocks" | "complements" | "relates_to",
    "reason": "Brief 1-sentence explanation",
    "confidence": 0.0-1.0,
    "strength": 0.0-1.0
  }
]

Only include suggestions with confidence >= 0.6.`

/**
 * Generate user prompt for dependency analysis
 */
export function generateDependencyAnalysisPrompt(
  workItems: Array<{
    id: string
    name: string
    purpose: string
    type: string
    timeline?: string
    status?: string
  }>
): string {
  const workItemsText = workItems
    .map((item, index) => {
      return `
[${index + 1}] Feature: ${item.name}
    ID: ${item.id}
    Type: ${item.type}
    Purpose: ${item.purpose}
    ${item.timeline ? `Timeline: ${item.timeline}` : ''}
    ${item.status ? `Status: ${item.status}` : ''}
`.trim()
    })
    .join('\n\n')

  return `Analyze these ${workItems.length} features and identify dependencies:

${workItemsText}

Consider:
- Which features require data or functionality from others?
- Which features must be completed before others can start?
- Which features work better together (complements)?
- Which features share similar concepts (relates to)?

Return JSON array of dependency suggestions.`
}

/**
 * Example analysis for user reference
 */
export const DEPENDENCY_ANALYSIS_EXAMPLE = `
Example analysis:

Features:
1. User Authentication (login system)
2. User Profile (view/edit profile)
3. Password Reset (forgot password flow)
4. Social Login (OAuth with Google/GitHub)

Dependencies:
[
  {
    "sourceId": "user-profile",
    "targetId": "user-authentication",
    "connectionType": "dependency",
    "reason": "Profile page requires user to be logged in and access their session data",
    "confidence": 0.95,
    "strength": 0.9
  },
  {
    "sourceId": "password-reset",
    "targetId": "user-authentication",
    "connectionType": "dependency",
    "reason": "Password reset uses the authentication system to verify and update credentials",
    "confidence": 0.9,
    "strength": 0.8
  },
  {
    "sourceId": "social-login",
    "targetId": "user-authentication",
    "connectionType": "complements",
    "reason": "Social login is an alternative authentication method that enhances the auth system",
    "confidence": 0.85,
    "strength": 0.7
  }
]
`

/**
 * Validation prompt for confirming dependencies
 */
export function generateDependencyValidationPrompt(
  source: { id: string; name: string; purpose: string },
  target: { id: string; name: string; purpose: string }
): string {
  return `Analyze if there is a logical dependency between these two features:

Source Feature: ${source.name}
Purpose: ${source.purpose}

Target Feature: ${target.name}
Purpose: ${target.purpose}

Does "${source.name}" depend on "${target.name}"?

Respond with JSON:
{
  "hasDelendency": true/false,
  "connectionType": "dependency" | "blocks" | "complements" | "relates_to" | null,
  "reason": "Brief explanation",
  "confidence": 0.0-1.0
}`
}

/**
 * Circular dependency detection prompt
 */
export function generateCircularDependencyPrompt(
  cyclePath: Array<{ id: string; name: string }>
): string {
  const pathText = cyclePath.map((item) => item.name).join(' → ')

  return `A circular dependency has been detected:

${pathText} → (back to ${cyclePath[0].name})

Analyze this cycle and suggest how to break it. Consider:
1. Which dependency is weakest (least critical)?
2. Can any dependency be reversed?
3. Can features be merged or split to resolve the cycle?
4. Is there a missing intermediate feature?

Respond with JSON:
{
  "analysis": "Explanation of why the cycle exists",
  "suggestedFixes": [
    {
      "action": "remove_connection" | "reverse_connection" | "split_feature" | "merge_features",
      "sourceId": "feature-id",
      "targetId": "feature-id",
      "reason": "Why this fix resolves the cycle",
      "impact": "What changes for the user/team"
    }
  ]
}`
}

/**
 * Dependency strength calculation prompt
 */
export function generateDependencyStrengthPrompt(
  source: { id: string; name: string; purpose: string },
  target: { id: string; name: string; purpose: string },
  connectionType: string
): string {
  return `Evaluate the strength of this dependency:

${source.name} → ${target.name}
Connection Type: ${connectionType}

Source Purpose: ${source.purpose}
Target Purpose: ${target.purpose}

How strong is this dependency? Consider:
- How much does source depend on target? (data sharing, functionality)
- Can source work without target? (with reduced functionality)
- How tightly coupled are they? (API contracts, shared state)

Respond with JSON:
{
  "strength": 0.0-1.0,
  "explanation": "Why this strength rating",
  "alternativesExist": true/false
}`
}

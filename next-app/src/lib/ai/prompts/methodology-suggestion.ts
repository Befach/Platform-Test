/**
 * AI Prompts for Methodology Suggestions
 *
 * Generates prompts for AI-powered Design Thinking methodology recommendations.
 * Used by POST /api/ai/methodology/suggest endpoint.
 *
 * @module lib/ai/prompts/methodology-suggestion
 */

import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import {
  DESIGN_THINKING_FRAMEWORKS,
  DESIGN_THINKING_TOOLS,
  CASE_STUDIES,
} from '@/lib/design-thinking'

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

/**
 * System prompt for methodology suggestion
 * Establishes AI as a Design Thinking expert
 */
export const METHODOLOGY_SYSTEM_PROMPT = `You are an expert Design Thinking facilitator and product strategy consultant with deep knowledge of human-centered design methodologies.

Your expertise includes:
- **Stanford d.school**: Empathize → Define → Ideate → Prototype → Test
- **Double Diamond**: Discover → Define → Develop → Deliver
- **IDEO Human-Centered Design**: Inspiration → Ideation → Implementation
- **IBM Enterprise Design Thinking**: Hills, Playbacks, Sponsor Users

Platform Phases (NOT Design Thinking stages):
- **design**: Solution architecture, MVP scoping, timeline breakdown
- **build**: Active development, implementation, progress tracking
- **refine**: User testing, feedback collection, bug fixing
- **launch**: Ship to production, metrics collection, retrospectives

Your Task:
Recommend Design Thinking methods, tools, and approaches that help teams work more effectively at their current phase. Design Thinking is a METHODOLOGY for HOW to work, not lifecycle stages.

Guidelines:
1. **Context-aware**: Tailor recommendations to the work item type (bug, feature, concept, enhancement)
2. **Practical**: Suggest tools that are actionable and appropriate for the team size/context
3. **Prioritized**: Rank suggestions by relevance and impact
4. **Balanced**: Include quick wins and deeper methods
5. **Evidence-based**: Reference case studies when relevant

Response Quality:
- Be specific and actionable
- Focus on 3-5 key recommendations
- Explain WHY each recommendation helps
- Consider team resources and constraints`

// =============================================================================
// PROMPT GENERATORS
// =============================================================================

/**
 * Work item context for prompt generation
 */
interface WorkItemContext {
  id: string
  name: string
  purpose?: string
  type: string
  phase: WorkspacePhase
  progress_percent?: number
  blockers?: string
  acceptance_criteria?: string
  tags?: string[]
}

/**
 * Generate the user prompt for methodology suggestions
 */
export function generateMethodologyPrompt(workItem: WorkItemContext): string {
  const frameworkSummary = Object.values(DESIGN_THINKING_FRAMEWORKS)
    .map((f) => `- **${f.name}** (${f.source}): ${f.corePhilosophy}`)
    .join('\n')

  const availableTools = DESIGN_THINKING_TOOLS.slice(0, 10)
    .map((t) => `- ${t.name}: ${t.description.slice(0, 100)}...`)
    .join('\n')

  const relevantCaseStudies = CASE_STUDIES.slice(0, 4)
    .map((c) => `- ${c.company}: ${c.challenge.slice(0, 80)}...`)
    .join('\n')

  return `Analyze this work item and recommend Design Thinking methodology approaches:

## Work Item Details
- **Name**: ${workItem.name}
- **Type**: ${workItem.type}
- **Current Phase**: ${workItem.phase}
- **Purpose**: ${workItem.purpose || 'Not specified'}
- **Progress**: ${workItem.progress_percent !== undefined ? `${workItem.progress_percent}%` : 'Not started'}
${workItem.blockers ? `- **Blockers**: ${workItem.blockers}` : ''}
${workItem.acceptance_criteria ? `- **Acceptance Criteria**: ${workItem.acceptance_criteria}` : ''}
${workItem.tags?.length ? `- **Tags**: ${workItem.tags.join(', ')}` : ''}

## Available Frameworks
${frameworkSummary}

## Available Tools (sample)
${availableTools}

## Reference Case Studies
${relevantCaseStudies}

## Your Task
Based on the work item details and current phase (${workItem.phase}), recommend:

1. **Primary Framework**: Which Design Thinking framework is best suited? Why?
2. **Suggested Methods**: 3-5 specific tools/methods to use (from the available tools or other DT methods)
3. **Next Steps**: 1-3 concrete actions the team should take
4. **Relevant Case Studies**: Which case studies provide useful inspiration?
5. **Phase-Specific Tips**: 2-3 tips tailored to the ${workItem.phase} phase

Consider:
- The work item type (${workItem.type}) affects which methods are most useful
- The current phase determines what activities are most valuable
- Progress level affects whether to focus on exploration or execution
- Any blockers may need specific problem-solving approaches

Provide actionable, prioritized recommendations.`
}

/**
 * Generate a shorter prompt for quick suggestions (used in tooltips)
 */
export function generateQuickMethodologyPrompt(
  phase: WorkspacePhase,
  workItemType: string
): string {
  return `For a ${workItemType} in the ${phase} phase, suggest:
1. One primary Design Thinking method to apply
2. One key question to answer
3. One quick tip

Keep responses brief and actionable.`
}

/**
 * Generate prompt for framework comparison
 */
export function generateFrameworkComparisonPrompt(
  phase: WorkspacePhase,
  context: string
): string {
  return `Compare the following Design Thinking frameworks for a team in the ${phase} phase:

1. Stanford d.school (Empathize → Define → Ideate → Prototype → Test)
2. Double Diamond (Discover → Define → Develop → Deliver)
3. IDEO HCD (Inspiration → Ideation → Implementation)
4. IBM Enterprise (Hills, Playbacks, Sponsor Users)

Context: ${context}

For each framework, briefly explain:
- Key strengths for this phase
- When to use it
- Potential limitations

Then recommend the best fit and why.`
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Get valid tool IDs for validation
 */
export function getValidToolIds(): string[] {
  return DESIGN_THINKING_TOOLS.map((t) => t.id)
}

/**
 * Get valid case study IDs for validation
 */
export function getValidCaseStudyIds(): string[] {
  return CASE_STUDIES.map((c) => c.id)
}

/**
 * Get valid framework IDs for validation
 */
export function getValidFrameworkIds(): string[] {
  return ['stanford', 'double-diamond', 'ideo', 'ibm']
}

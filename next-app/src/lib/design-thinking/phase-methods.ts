/**
 * Phase-to-Method Mapping
 *
 * Maps platform phases (design, build, refine, launch) to Design Thinking
 * methods and frameworks. Provides contextual methodology guidance.
 *
 * Design Thinking is a METHODOLOGY for HOW to work at each phase,
 * not a replacement for the phase system.
 *
 * @module lib/design-thinking/phase-methods
 */

import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import {
  type DesignThinkingFramework,
  type DesignThinkingTool,
  type CaseStudy,
  type FrameworkConfig,
  getFrameworkById,
  getToolsByFramework,
  getCaseStudiesByFramework,
  DESIGN_THINKING_TOOLS,
  CASE_STUDIES,
} from './frameworks'
import { getPhaseGuidance, type GuidingQuestion } from '@/lib/phase/guiding-questions'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Methodology recommendation for a specific phase
 */
export interface PhaseMethodRecommendation {
  /** Platform phase this applies to */
  phase: WorkspacePhase
  /** Primary recommended framework */
  primaryFramework: DesignThinkingFramework
  /** Why this framework is recommended */
  frameworkRationale: string
  /** Relevant stages from the primary framework */
  relevantStages: string[]
  /** Tools recommended for this phase */
  recommendedTools: DesignThinkingTool[]
  /** Key questions from guiding-questions.ts */
  keyQuestions: GuidingQuestion[]
  /** Relevant case studies */
  caseStudies: CaseStudy[]
  /** Quick tips for this phase */
  tips: string[]
}

/**
 * Alternative framework suggestion
 */
export interface AlternativeFramework {
  framework: DesignThinkingFramework
  reason: string
  bestWhen: string
}

/**
 * Complete methodology guidance for a phase
 */
export interface MethodologyGuidance {
  /** Current phase */
  currentPhase: WorkspacePhase
  /** Primary recommendation */
  recommendation: PhaseMethodRecommendation
  /** Alternative frameworks to consider */
  alternativeFrameworks: AlternativeFramework[]
  /** Preview of next phase methodology */
  nextPhasePreview: PhaseMethodRecommendation | null
  /** Summary description */
  summary: string
}

// ============================================================================
// PHASE-TO-METHOD MAPPING
// ============================================================================

/**
 * Tools recommended specifically for each phase
 */
const PHASE_TOOL_IDS: Record<WorkspacePhase, string[]> = {
  design: [
    'empathy-map',
    'journey-map',
    'how-might-we',
    'persona',
    'assumption-mapping',
    'five-whys',
  ],
  build: ['rapid-prototyping', 'storyboard', 'crazy-8s', 'design-studio', 'hills'],
  refine: ['playback', 'dot-voting', 'affinity-diagram', 'retrospective'],
  launch: ['retrospective', 'playback', 'dot-voting'],
}

/**
 * Phase methodology recommendations
 */
const PHASE_METHOD_CONFIG: Record<
  WorkspacePhase,
  {
    primaryFramework: DesignThinkingFramework
    frameworkRationale: string
    relevantStages: string[]
    tips: string[]
  }
> = {
  design: {
    primaryFramework: 'stanford',
    frameworkRationale:
      'The Stanford d.school framework excels at the Design phase because it emphasizes deep user empathy and structured problem definition before jumping to solutions.',
    relevantStages: ['empathize', 'define', 'ideate'],
    tips: [
      'Start with user research before defining solutions',
      'Use "How Might We" questions to reframe problems as opportunities',
      'Build empathy maps to align the team on user needs',
      'Challenge assumptions early to reduce risk',
      'Involve stakeholders in problem definition',
    ],
  },
  build: {
    primaryFramework: 'ideo',
    frameworkRationale:
      'IDEO\'s Human-Centered Design shines during Build because it balances rapid prototyping with continuous user feedback, ensuring you build what users actually need.',
    relevantStages: ['ideation', 'implementation'],
    tips: [
      'Prototype early and cheaply - don\'t perfect the first version',
      'Test assumptions with real users before heavy development',
      'Break work into small, testable increments',
      'Document decisions and learnings as you go',
      'Stay connected to user needs throughout development',
    ],
  },
  refine: {
    primaryFramework: 'ibm',
    frameworkRationale:
      'IBM\'s Enterprise Design Thinking is ideal for Refine because Playback sessions ensure stakeholder alignment and Sponsor Users provide continuous validation.',
    relevantStages: ['make', 'evaluate'],
    tips: [
      'Run structured Playback sessions to gather feedback',
      'Test with real users, not just internal stakeholders',
      'Prioritize feedback based on user impact',
      'Address critical issues before moving to launch',
      'Document what you learned for future iterations',
    ],
  },
  launch: {
    primaryFramework: 'double-diamond',
    frameworkRationale:
      'The Double Diamond framework\'s Deliver stage provides a structured approach to finalizing, launching, and measuring success with clear convergence.',
    relevantStages: ['deliver'],
    tips: [
      'Define success metrics before launch',
      'Plan your communication strategy',
      'Prepare monitoring and feedback collection',
      'Schedule a retrospective within a week of launch',
      'Celebrate wins and document lessons learned',
    ],
  },
}

/**
 * Alternative frameworks for each phase
 */
const ALTERNATIVE_FRAMEWORKS: Record<WorkspacePhase, AlternativeFramework[]> = {
  design: [
    {
      framework: 'double-diamond',
      reason: 'Provides clear diverge/converge structure for exploration',
      bestWhen: 'You need to explore a very broad problem space before narrowing down',
    },
    {
      framework: 'ibm',
      reason: 'Hills help define clear, measurable user outcomes',
      bestWhen: 'Working in an enterprise environment with multiple stakeholders',
    },
  ],
  build: [
    {
      framework: 'stanford',
      reason: 'Prototype and Test stages provide tight feedback loops',
      bestWhen: 'Building consumer-facing products where rapid iteration is key',
    },
    {
      framework: 'ibm',
      reason: 'Sponsor Users ensure continuous user involvement',
      bestWhen: 'Building B2B or enterprise products',
    },
  ],
  refine: [
    {
      framework: 'stanford',
      reason: 'Test stage provides structured usability validation',
      bestWhen: 'Focused on UX improvements and usability',
    },
    {
      framework: 'ideo',
      reason: 'Implementation stage includes piloting and iteration',
      bestWhen: 'Launching to a pilot group before full rollout',
    },
  ],
  launch: [
    {
      framework: 'ibm',
      reason: 'Final Playback ensures stakeholder sign-off',
      bestWhen: 'Need formal approval from leadership',
    },
    {
      framework: 'ideo',
      reason: 'Implementation stage includes measuring impact',
      bestWhen: 'Launching a social impact or nonprofit project',
    },
  ],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get tools by their IDs
 */
function getToolsById(toolIds: string[]): DesignThinkingTool[] {
  return toolIds
    .map((id) => DESIGN_THINKING_TOOLS.find((tool) => tool.id === id))
    .filter((tool): tool is DesignThinkingTool => tool !== undefined)
}

/**
 * Get case studies relevant to a phase
 */
function getCaseStudiesForPhase(phase: WorkspacePhase): CaseStudy[] {
  const config = PHASE_METHOD_CONFIG[phase]
  const primaryCaseStudies = getCaseStudiesByFramework(config.primaryFramework)

  // Get additional case studies from alternative frameworks
  const alternativeCaseStudies = ALTERNATIVE_FRAMEWORKS[phase].flatMap((alt) =>
    getCaseStudiesByFramework(alt.framework)
  )

  // Combine and dedupe
  const allCaseStudies = [...primaryCaseStudies, ...alternativeCaseStudies]
  const uniqueIds = new Set<string>()
  return allCaseStudies.filter((cs) => {
    if (uniqueIds.has(cs.id)) return false
    uniqueIds.add(cs.id)
    return true
  }).slice(0, 5) // Limit to 5 case studies
}

/**
 * Get the next phase in the workflow
 */
function getNextPhase(phase: WorkspacePhase): WorkspacePhase | null {
  const phases: WorkspacePhase[] = ['design', 'build', 'refine', 'launch']
  const currentIndex = phases.indexOf(phase)
  if (currentIndex === -1 || currentIndex === phases.length - 1) return null
  return phases[currentIndex + 1]
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get methodology recommendation for a specific phase
 */
export function getPhaseMethodology(phase: WorkspacePhase): PhaseMethodRecommendation {
  const config = PHASE_METHOD_CONFIG[phase]
  const guidance = getPhaseGuidance(phase)

  return {
    phase,
    primaryFramework: config.primaryFramework,
    frameworkRationale: config.frameworkRationale,
    relevantStages: config.relevantStages,
    recommendedTools: getToolsById(PHASE_TOOL_IDS[phase]),
    keyQuestions: guidance.questions,
    caseStudies: getCaseStudiesForPhase(phase),
    tips: config.tips,
  }
}

/**
 * Get complete methodology guidance for a phase
 */
export function getMethodologyGuidance(phase: WorkspacePhase): MethodologyGuidance {
  const recommendation = getPhaseMethodology(phase)
  const nextPhase = getNextPhase(phase)
  const framework = getFrameworkById(recommendation.primaryFramework)

  return {
    currentPhase: phase,
    recommendation,
    alternativeFrameworks: ALTERNATIVE_FRAMEWORKS[phase],
    nextPhasePreview: nextPhase ? getPhaseMethodology(nextPhase) : null,
    summary: `Use ${framework.name} methodology during the ${phase} phase. ${recommendation.frameworkRationale}`,
  }
}

/**
 * Get tools recommended for a phase
 */
export function getToolsForPhase(phase: WorkspacePhase): DesignThinkingTool[] {
  return getToolsById(PHASE_TOOL_IDS[phase])
}

/**
 * Get the primary framework config for a phase
 */
export function getFrameworkForPhase(phase: WorkspacePhase): FrameworkConfig {
  const config = PHASE_METHOD_CONFIG[phase]
  return getFrameworkById(config.primaryFramework)
}

/**
 * Get relevant stages from the primary framework for a phase
 */
export function getRelevantStagesForPhase(phase: WorkspacePhase): string[] {
  return PHASE_METHOD_CONFIG[phase].relevantStages
}

/**
 * Check if a tool is recommended for a phase
 */
export function isToolRecommendedForPhase(toolId: string, phase: WorkspacePhase): boolean {
  return PHASE_TOOL_IDS[phase].includes(toolId)
}

/**
 * Get all methodology guidance for all phases
 */
export function getAllMethodologyGuidance(): MethodologyGuidance[] {
  const phases: WorkspacePhase[] = ['design', 'build', 'refine', 'launch']
  return phases.map((phase) => getMethodologyGuidance(phase))
}

/**
 * Suggest a framework based on work item characteristics
 */
export function suggestFrameworkForWorkItem(
  phase: WorkspacePhase,
  workItemType: string,
  industry?: string
): {
  recommended: DesignThinkingFramework
  reason: string
  alternatives: AlternativeFramework[]
} {
  // Default to phase recommendation
  let recommended = PHASE_METHOD_CONFIG[phase].primaryFramework
  let reason = PHASE_METHOD_CONFIG[phase].frameworkRationale

  // Adjust based on work item type
  if (workItemType === 'bug') {
    // Bugs benefit from IBM's structured approach
    if (phase === 'refine') {
      recommended = 'ibm'
      reason = 'IBM\'s structured Playback sessions help verify bug fixes with stakeholders'
    }
  } else if (workItemType === 'concept') {
    // Concepts need more exploration
    if (phase === 'design') {
      recommended = 'stanford'
      reason =
        'Stanford d.school\'s empathy-first approach helps validate concepts before investment'
    }
  } else if (workItemType === 'enhancement') {
    // Enhancements can use Double Diamond for clear scope
    if (phase === 'design') {
      recommended = 'double-diamond'
      reason =
        'Double Diamond\'s diverge/converge approach helps scope enhancements without over-engineering'
    }
  }

  // Adjust based on industry
  if (industry) {
    const lowerIndustry = industry.toLowerCase()
    if (
      lowerIndustry.includes('enterprise') ||
      lowerIndustry.includes('b2b')
    ) {
      recommended = 'ibm'
      reason = 'IBM Enterprise Design Thinking is optimized for B2B and enterprise contexts'
    } else if (
      lowerIndustry.includes('social') ||
      lowerIndustry.includes('nonprofit') ||
      lowerIndustry.includes('healthcare')
    ) {
      recommended = 'ideo'
      reason =
        'IDEO Human-Centered Design excels in social impact and healthcare contexts'
    }
  }

  return {
    recommended,
    reason,
    alternatives: ALTERNATIVE_FRAMEWORKS[phase].filter((alt) => alt.framework !== recommended),
  }
}

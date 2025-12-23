/**
 * Phase Guiding Questions
 *
 * Design Thinking-inspired guiding questions and tips for each phase.
 * Helps users understand what to focus on at each stage of the lifecycle.
 *
 * Sources:
 * - Stanford d.school: Empathize → Define → Ideate → Prototype → Test
 * - IDEO Human-Centered Design: Inspiration → Ideation → Implementation
 * - IBM Enterprise Design Thinking: The Loop + Hills, Playbacks, Sponsor Users
 * - Double Diamond: Discover → Define → Develop → Deliver
 *
 * @module lib/phase/guiding-questions
 */

import type { WorkspacePhase, WorkItemType, AnyWorkItemPhase } from '@/lib/constants/workspace-phases'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * A guiding question for a phase
 */
export interface GuidingQuestion {
  question: string
  purpose: string
  designThinkingMethod?: string
}

/**
 * A tip for progressing through a phase
 */
export interface PhaseTip {
  tip: string
  icon: string
  designThinkingSource?: 'stanford' | 'ideo' | 'ibm' | 'double-diamond'
}

/**
 * Complete guidance configuration for a phase
 */
export interface PhaseGuidance {
  phase: string // AnyWorkItemPhase
  questions: GuidingQuestion[]
  tips: PhaseTip[]
  summary: string
}

// ============================================================================
// DESIGN PHASE GUIDANCE
// ============================================================================

export const DESIGN_GUIDANCE: PhaseGuidance = {
  phase: 'design',
  summary: 'Shape your approach and define the path forward',
  questions: [
    {
      question: 'Who has this problem and why does it matter to them?',
      purpose: 'Build empathy for your users',
      designThinkingMethod: 'Empathy Mapping',
    },
    {
      question: 'What is the smallest version that delivers value?',
      purpose: 'Define your MVP scope',
      designThinkingMethod: 'How Might We',
    },
    {
      question: 'What does "done" look like for this work item?',
      purpose: 'Set clear acceptance criteria',
      designThinkingMethod: 'Definition of Done',
    },
    {
      question: 'What are the riskiest assumptions we are making?',
      purpose: 'Identify what needs validation',
      designThinkingMethod: 'Assumption Mapping',
    },
    {
      question: 'Who needs to be involved or informed?',
      purpose: 'Identify stakeholders early',
      designThinkingMethod: 'Stakeholder Mapping',
    },
  ],
  tips: [
    {
      tip: 'Use empathy maps to understand user needs before jumping to solutions',
      icon: 'heart',
      designThinkingSource: 'stanford',
    },
    {
      tip: 'Break down into timeline items (MVP/SHORT/LONG) to manage scope',
      icon: 'layers',
      designThinkingSource: 'double-diamond',
    },
    {
      tip: 'Define acceptance criteria as testable statements',
      icon: 'check-square',
      designThinkingSource: 'ibm',
    },
    {
      tip: 'Estimate hours to set realistic expectations',
      icon: 'clock',
    },
  ],
}

// ============================================================================
// BUILD PHASE GUIDANCE
// ============================================================================

export const BUILD_GUIDANCE: PhaseGuidance = {
  phase: 'build',
  summary: 'Execute with clarity and create with care',
  questions: [
    {
      question: 'What is blocking progress right now?',
      purpose: 'Surface and address blockers early',
      designThinkingMethod: 'Daily Standup',
    },
    {
      question: 'Are we building what users actually need?',
      purpose: 'Stay aligned with user needs',
      designThinkingMethod: 'User Testing',
    },
    {
      question: 'What have we learned that might change the plan?',
      purpose: 'Adapt based on new information',
      designThinkingMethod: 'Iteration',
    },
    {
      question: 'Is the quality bar being met?',
      purpose: 'Ensure quality throughout development',
      designThinkingMethod: 'Definition of Done',
    },
  ],
  tips: [
    {
      tip: 'Set actual_start_date when work begins to track timeline',
      icon: 'calendar',
    },
    {
      tip: 'Update progress_percent regularly to maintain visibility',
      icon: 'trending-up',
    },
    {
      tip: 'Document blockers immediately when they arise',
      icon: 'alert-triangle',
    },
    {
      tip: 'Build incrementally - ship small pieces to get feedback',
      icon: 'package',
      designThinkingSource: 'ideo',
    },
  ],
}

// ============================================================================
// REFINE PHASE GUIDANCE
// ============================================================================

export const REFINE_GUIDANCE: PhaseGuidance = {
  phase: 'refine',
  summary: 'Validate ideas and sharpen solutions',
  questions: [
    {
      question: 'Does this solve the original problem?',
      purpose: 'Validate against initial goals',
      designThinkingMethod: 'Usability Testing',
    },
    {
      question: 'What feedback have we received and from whom?',
      purpose: 'Ensure diverse perspectives',
      designThinkingMethod: 'Playback Session',
    },
    {
      question: 'What would make this even better?',
      purpose: 'Identify improvement opportunities',
      designThinkingMethod: 'Iteration',
    },
    {
      question: 'Are there any edge cases we missed?',
      purpose: 'Ensure robustness',
      designThinkingMethod: 'Edge Case Analysis',
    },
  ],
  tips: [
    {
      tip: 'Collect feedback from real users, not just stakeholders',
      icon: 'users',
      designThinkingSource: 'ideo',
    },
    {
      tip: 'Address critical feedback before moving to launch',
      icon: 'alert-circle',
    },
    {
      tip: 'Run a playback session with stakeholders',
      icon: 'play-circle',
      designThinkingSource: 'ibm',
    },
    {
      tip: 'Test edge cases and error scenarios',
      icon: 'shield',
    },
  ],
}

// ============================================================================
// LAUNCH PHASE GUIDANCE
// ============================================================================

export const LAUNCH_GUIDANCE: PhaseGuidance = {
  phase: 'launch',
  summary: 'Release, measure, and evolve',
  questions: [
    {
      question: 'What metrics will tell us if this succeeded?',
      purpose: 'Define success criteria',
      designThinkingMethod: 'Metrics Definition',
    },
    {
      question: 'What did we learn from building this?',
      purpose: 'Capture lessons for future work',
      designThinkingMethod: 'Retrospective',
    },
    {
      question: 'What should we do differently next time?',
      purpose: 'Continuous improvement',
      designThinkingMethod: 'Retrospective',
    },
    {
      question: 'How will we communicate this to users?',
      purpose: 'Plan rollout and communication',
      designThinkingMethod: 'Release Planning',
    },
  ],
  tips: [
    {
      tip: 'Document lessons learned while they are fresh',
      icon: 'book-open',
    },
    {
      tip: 'Set up monitoring for key metrics',
      icon: 'activity',
    },
    {
      tip: 'Schedule a retrospective within a week of launch',
      icon: 'calendar',
    },
    {
      tip: 'Celebrate the team\'s accomplishments',
      icon: 'party-popper',
    },
  ],
}

// ============================================================================
// CONCEPT PHASE GUIDANCE
// ============================================================================

export const IDEATION_GUIDANCE: PhaseGuidance = {
  phase: 'ideation',
  summary: 'Explore possibilities and form initial hypotheses',
  questions: [
    {
      question: 'What problem or opportunity are you trying to address?',
      purpose: 'Clarify the core challenge',
      designThinkingMethod: 'Problem Framing',
    },
    {
      question: 'Who would benefit most from solving this?',
      purpose: 'Identify target users early',
      designThinkingMethod: 'User Persona',
    },
    {
      question: 'What is your core hypothesis to test?',
      purpose: 'Define what needs validation',
      designThinkingMethod: 'Lean Startup',
    },
    {
      question: 'What evidence would prove or disprove this idea?',
      purpose: 'Plan validation approach',
      designThinkingMethod: 'Experiment Design',
    },
  ],
  tips: [
    {
      tip: 'State your hypothesis clearly - what do you believe and why?',
      icon: 'lightbulb',
      designThinkingSource: 'stanford',
    },
    {
      tip: 'Define target users specifically - avoid "everyone"',
      icon: 'users',
      designThinkingSource: 'ideo',
    },
    {
      tip: 'List assumptions that need to be validated',
      icon: 'clipboard-list',
    },
    {
      tip: 'Keep scope small - validate one thing at a time',
      icon: 'target',
    },
  ],
}

export const RESEARCH_GUIDANCE: PhaseGuidance = {
  phase: 'research',
  summary: 'Validate assumptions through evidence gathering',
  questions: [
    {
      question: 'What have you learned from user research?',
      purpose: 'Capture validation findings',
      designThinkingMethod: 'User Interviews',
    },
    {
      question: 'Does the evidence support or refute your hypothesis?',
      purpose: 'Assess validation status',
      designThinkingMethod: 'Data Analysis',
    },
    {
      question: 'What would you do differently with this knowledge?',
      purpose: 'Apply learnings',
      designThinkingMethod: 'Pivot or Persevere',
    },
    {
      question: 'Is this ready to become a feature, or should it be rejected?',
      purpose: 'Make go/no-go decision',
      designThinkingMethod: 'Decision Point',
    },
  ],
  tips: [
    {
      tip: 'Document all research findings - both positive and negative',
      icon: 'file-text',
      designThinkingSource: 'ideo',
    },
    {
      tip: 'Talk to at least 5 potential users before deciding',
      icon: 'message-circle',
    },
    {
      tip: 'Look for patterns in user feedback',
      icon: 'bar-chart',
    },
    {
      tip: 'Be willing to reject ideas that don\'t validate',
      icon: 'x-circle',
    },
  ],
}

export const VALIDATED_GUIDANCE: PhaseGuidance = {
  phase: 'validated',
  summary: 'Concept validated - ready for feature planning',
  questions: [
    {
      question: 'What key insights should carry forward to the feature?',
      purpose: 'Transfer knowledge',
      designThinkingMethod: 'Knowledge Transfer',
    },
    {
      question: 'What constraints or requirements emerged from research?',
      purpose: 'Capture requirements',
      designThinkingMethod: 'Requirements Definition',
    },
  ],
  tips: [
    {
      tip: 'Create a feature from this validated concept to begin implementation',
      icon: 'arrow-right',
    },
    {
      tip: 'Document all research that led to validation',
      icon: 'book',
    },
  ],
}

export const REJECTED_GUIDANCE: PhaseGuidance = {
  phase: 'rejected',
  summary: 'Concept rejected - learnings captured',
  questions: [
    {
      question: 'What did we learn from this exploration?',
      purpose: 'Capture lessons learned',
      designThinkingMethod: 'Retrospective',
    },
    {
      question: 'Could this concept be revisited under different conditions?',
      purpose: 'Archive for future reference',
      designThinkingMethod: 'Knowledge Base',
    },
  ],
  tips: [
    {
      tip: 'Document why the concept was rejected for future reference',
      icon: 'archive',
    },
    {
      tip: 'Rejected concepts are valuable learnings, not failures',
      icon: 'heart',
    },
  ],
}

// ============================================================================
// BUG PHASE GUIDANCE
// ============================================================================

export const TRIAGE_GUIDANCE: PhaseGuidance = {
  phase: 'triage',
  summary: 'Assess, prioritize, and prepare for investigation',
  questions: [
    {
      question: 'Can this bug be reproduced consistently?',
      purpose: 'Verify reproducibility',
      designThinkingMethod: 'Bug Verification',
    },
    {
      question: 'How many users are affected and how severely?',
      purpose: 'Assess impact for prioritization',
      designThinkingMethod: 'Impact Assessment',
    },
    {
      question: 'What is the severity level (critical/high/medium/low)?',
      purpose: 'Set appropriate priority',
      designThinkingMethod: 'Severity Classification',
    },
    {
      question: 'Are there any workarounds for affected users?',
      purpose: 'Provide interim relief',
      designThinkingMethod: 'Mitigation',
    },
  ],
  tips: [
    {
      tip: 'Document clear reproduction steps that anyone can follow',
      icon: 'list',
    },
    {
      tip: 'Include environment details (browser, OS, version)',
      icon: 'monitor',
    },
    {
      tip: 'Attach screenshots or screen recordings when helpful',
      icon: 'camera',
    },
    {
      tip: 'Set severity based on user impact, not technical complexity',
      icon: 'alert-triangle',
    },
  ],
}

export const INVESTIGATING_GUIDANCE: PhaseGuidance = {
  phase: 'investigating',
  summary: 'Find the root cause of the issue',
  questions: [
    {
      question: 'What is the root cause of this bug?',
      purpose: 'Identify the underlying issue',
      designThinkingMethod: 'Root Cause Analysis',
    },
    {
      question: 'When did this bug first appear?',
      purpose: 'Identify potential regression cause',
      designThinkingMethod: 'Timeline Analysis',
    },
    {
      question: 'What code paths are involved?',
      purpose: 'Scope the fix',
      designThinkingMethod: 'Code Analysis',
    },
    {
      question: 'Could this affect other areas of the system?',
      purpose: 'Assess blast radius',
      designThinkingMethod: 'Impact Analysis',
    },
  ],
  tips: [
    {
      tip: 'Use the 5 Whys technique to find the true root cause',
      icon: 'help-circle',
    },
    {
      tip: 'Check recent changes that might have introduced the bug',
      icon: 'git-commit',
    },
    {
      tip: 'Document your findings as you investigate',
      icon: 'edit',
    },
    {
      tip: 'Consider if this reveals a systemic issue',
      icon: 'search',
    },
  ],
}

export const FIXING_GUIDANCE: PhaseGuidance = {
  phase: 'fixing',
  summary: 'Implement and test the fix',
  questions: [
    {
      question: 'Does the fix address the root cause, not just symptoms?',
      purpose: 'Ensure complete fix',
      designThinkingMethod: 'Solution Validation',
    },
    {
      question: 'Have you added tests to prevent regression?',
      purpose: 'Prevent recurrence',
      designThinkingMethod: 'Test-Driven Development',
    },
    {
      question: 'What is the safest way to deploy this fix?',
      purpose: 'Plan safe rollout',
      designThinkingMethod: 'Release Planning',
    },
    {
      question: 'Who should verify the fix works in production?',
      purpose: 'Plan verification',
      designThinkingMethod: 'QA Planning',
    },
  ],
  tips: [
    {
      tip: 'Write a test that fails before the fix and passes after',
      icon: 'check-square',
    },
    {
      tip: 'Consider if a hotfix is needed for critical bugs',
      icon: 'zap',
    },
    {
      tip: 'Document the fix approach for future reference',
      icon: 'file-text',
    },
    {
      tip: 'Get code review before merging',
      icon: 'users',
    },
  ],
}

export const VERIFIED_GUIDANCE: PhaseGuidance = {
  phase: 'verified',
  summary: 'Bug fixed and verified in production',
  questions: [
    {
      question: 'Has the fix been verified in production?',
      purpose: 'Confirm resolution',
      designThinkingMethod: 'Production Verification',
    },
    {
      question: 'Should affected users be notified?',
      purpose: 'Close the loop with users',
      designThinkingMethod: 'Communication',
    },
  ],
  tips: [
    {
      tip: 'Monitor for any regression after deployment',
      icon: 'activity',
    },
    {
      tip: 'Update any support documentation if needed',
      icon: 'book',
    },
  ],
}

// ============================================================================
// GUIDANCE MAPS BY TYPE
// ============================================================================

/**
 * Feature/Enhancement guidance by phase
 */
export const FEATURE_GUIDANCE: Record<string, PhaseGuidance> = {
  design: DESIGN_GUIDANCE,
  build: BUILD_GUIDANCE,
  refine: REFINE_GUIDANCE,
  launch: LAUNCH_GUIDANCE,
}

/**
 * Concept guidance by phase
 */
export const CONCEPT_GUIDANCE: Record<string, PhaseGuidance> = {
  ideation: IDEATION_GUIDANCE,
  research: RESEARCH_GUIDANCE,
  validated: VALIDATED_GUIDANCE,
  rejected: REJECTED_GUIDANCE,
}

/**
 * Bug guidance by phase
 */
export const BUG_GUIDANCE: Record<string, PhaseGuidance> = {
  triage: TRIAGE_GUIDANCE,
  investigating: INVESTIGATING_GUIDANCE,
  fixing: FIXING_GUIDANCE,
  verified: VERIFIED_GUIDANCE,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get guidance for a specific type and phase (TYPE-AWARE)
 */
export function getTypePhaseGuidance(
  type: WorkItemType,
  phase: string
): PhaseGuidance {
  switch (type) {
    case 'concept':
      return CONCEPT_GUIDANCE[phase] ?? IDEATION_GUIDANCE
    case 'bug':
      return BUG_GUIDANCE[phase] ?? TRIAGE_GUIDANCE
    case 'feature':
      return FEATURE_GUIDANCE[phase] ?? DESIGN_GUIDANCE
    default:
      return DESIGN_GUIDANCE
  }
}

/**
 * Get guidance for a specific phase (LEGACY - Feature only)
 * @deprecated Use getTypePhaseGuidance instead
 */
export function getPhaseGuidance(phase: WorkspacePhase): PhaseGuidance {
  switch (phase) {
    case 'design':
      return DESIGN_GUIDANCE
    case 'build':
      return BUILD_GUIDANCE
    case 'refine':
      return REFINE_GUIDANCE
    case 'launch':
      return LAUNCH_GUIDANCE
    default:
      return DESIGN_GUIDANCE
  }
}

/**
 * Get a random guiding question for the current phase
 */
export function getRandomQuestion(phase: WorkspacePhase): GuidingQuestion {
  const guidance = getPhaseGuidance(phase)
  const randomIndex = Math.floor(Math.random() * guidance.questions.length)
  return guidance.questions[randomIndex]
}

/**
 * Get the first guiding question for a phase (deterministic)
 */
export function getFirstQuestion(phase: WorkspacePhase): GuidingQuestion {
  const guidance = getPhaseGuidance(phase)
  return guidance.questions[0]
}

/**
 * Get transition tips when moving between phases
 */
export function getTransitionTips(
  fromPhase: WorkspacePhase,
  toPhase: WorkspacePhase
): PhaseTip[] {
  const fromGuidance = getPhaseGuidance(fromPhase)
  const toGuidance = getPhaseGuidance(toPhase)

  // Combine last 2 tips from current phase with first 2 from next phase
  return [...fromGuidance.tips.slice(-2), ...toGuidance.tips.slice(0, 2)]
}

/**
 * Get all guidance data for export/display
 */
export function getAllPhaseGuidance(): PhaseGuidance[] {
  return [DESIGN_GUIDANCE, BUILD_GUIDANCE, REFINE_GUIDANCE, LAUNCH_GUIDANCE]
}

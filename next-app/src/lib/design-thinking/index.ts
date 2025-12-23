/**
 * Design Thinking Module
 *
 * Exports all Design Thinking frameworks, tools, and phase mappings.
 *
 * @module lib/design-thinking
 */

// Frameworks
export {
  type DesignThinkingFramework,
  type FrameworkStage,
  type DesignThinkingTool,
  type CaseStudy,
  type FrameworkConfig,
  DESIGN_THINKING_FRAMEWORKS,
  DESIGN_THINKING_TOOLS,
  CASE_STUDIES,
  getFrameworkById,
  getAllFrameworks,
  getToolsByFramework,
  getToolById,
  searchCaseStudies,
  getCaseStudiesByFramework,
  getCaseStudyById,
  getToolsForStage,
  getFrameworkIds,
} from './frameworks'

// Phase Methods
export {
  type PhaseMethodRecommendation,
  type AlternativeFramework,
  type MethodologyGuidance,
  getPhaseMethodology,
  getMethodologyGuidance,
  getToolsForPhase,
  getFrameworkForPhase,
  getRelevantStagesForPhase,
  isToolRecommendedForPhase,
  getAllMethodologyGuidance,
  suggestFrameworkForWorkItem,
} from './phase-methods'

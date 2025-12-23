/**
 * Design Thinking Frameworks Database
 *
 * Complete database of Design Thinking frameworks, tools, and case studies.
 * Design Thinking is a METHODOLOGY for HOW to work - not lifecycle stages.
 *
 * Frameworks included:
 * - Stanford d.school: Empathize → Define → Ideate → Prototype → Test
 * - Double Diamond: Discover → Define → Develop → Deliver
 * - IDEO HCD: Inspiration → Ideation → Implementation
 * - IBM Enterprise: The Loop + Hills, Playbacks, Sponsor Users
 *
 * @module lib/design-thinking/frameworks
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Available Design Thinking frameworks
 */
export type DesignThinkingFramework = 'stanford' | 'double-diamond' | 'ideo' | 'ibm'

/**
 * A stage within a Design Thinking framework
 */
export interface FrameworkStage {
  id: string
  name: string
  description: string
  keyActivities: string[]
  deliverables: string[]
}

/**
 * A Design Thinking tool or method
 */
export interface DesignThinkingTool {
  id: string
  name: string
  description: string
  useCases: string[]
  duration: string
  participants: string
  frameworks: DesignThinkingFramework[]
  templateUrl?: string
}

/**
 * A case study demonstrating Design Thinking in practice
 */
export interface CaseStudy {
  id: string
  company: string
  challenge: string
  approach: string
  outcome: string
  frameworks: DesignThinkingFramework[]
  industry: string
  year?: number
}

/**
 * Complete configuration for a Design Thinking framework
 */
export interface FrameworkConfig {
  id: DesignThinkingFramework
  name: string
  source: string
  description: string
  corePhilosophy: string
  stages: FrameworkStage[]
  bestFor: string[]
  keyPrinciples: string[]
}

// ============================================================================
// FRAMEWORK DEFINITIONS
// ============================================================================

/**
 * Stanford d.school 5 Modes
 * The most widely recognized Design Thinking framework
 */
const STANFORD_FRAMEWORK: FrameworkConfig = {
  id: 'stanford',
  name: 'Stanford d.school 5 Modes',
  source: 'Stanford University d.school',
  description:
    'Human-centered design process with five iterative modes that help teams understand users, challenge assumptions, redefine problems, and create innovative solutions.',
  corePhilosophy: 'Empathy-driven innovation through rapid iteration',
  stages: [
    {
      id: 'empathize',
      name: 'Empathize',
      description: 'Deeply understand the people you are designing for',
      keyActivities: [
        'User interviews',
        'Observation sessions',
        'Empathy mapping',
        'Contextual inquiry',
        'Journey mapping',
      ],
      deliverables: ['Empathy maps', 'User personas', 'Interview insights', 'Observation notes'],
    },
    {
      id: 'define',
      name: 'Define',
      description: 'Frame the right problem to solve based on user insights',
      keyActivities: [
        'Synthesis of research',
        'Point of View (POV) statements',
        'How Might We questions',
        'Problem framing',
        'Needs identification',
      ],
      deliverables: ['POV statement', 'HMW questions', 'Problem definition', 'User needs list'],
    },
    {
      id: 'ideate',
      name: 'Ideate',
      description: 'Generate a wide range of creative solutions',
      keyActivities: [
        'Brainstorming',
        'Crazy 8s',
        'Mind mapping',
        'SCAMPER technique',
        'Concept sketching',
      ],
      deliverables: ['Idea board', 'Concept sketches', 'Solution matrix', 'Top ideas shortlist'],
    },
    {
      id: 'prototype',
      name: 'Prototype',
      description: 'Build quick, low-fidelity representations to learn',
      keyActivities: [
        'Paper prototyping',
        'Wireframing',
        'Storyboarding',
        'Role-playing',
        'MVP definition',
      ],
      deliverables: ['Paper prototypes', 'Wireframes', 'Storyboards', 'MVP specification'],
    },
    {
      id: 'test',
      name: 'Test',
      description: 'Learn from users by testing prototypes',
      keyActivities: [
        'Usability testing',
        'User feedback sessions',
        'A/B testing',
        'Iteration planning',
        'Validation interviews',
      ],
      deliverables: ['Test results', 'User feedback', 'Iteration backlog', 'Validated learnings'],
    },
  ],
  bestFor: [
    'Consumer products',
    'Service design',
    'Innovation projects',
    'New product development',
    'User experience design',
  ],
  keyPrinciples: [
    'Show, don\'t tell',
    'Focus on human values',
    'Embrace experimentation',
    'Be mindful of process',
    'Bias toward action',
    'Radical collaboration',
  ],
}

/**
 * Double Diamond Framework
 * Visual model emphasizing divergent and convergent thinking
 */
const DOUBLE_DIAMOND_FRAMEWORK: FrameworkConfig = {
  id: 'double-diamond',
  name: 'Double Diamond',
  source: 'British Design Council',
  description:
    'A visual model of the design process with two diamonds representing divergent and convergent thinking phases. First diamond explores the problem, second explores solutions.',
  corePhilosophy: 'Diverge to explore, converge to decide',
  stages: [
    {
      id: 'discover',
      name: 'Discover',
      description: 'Diverge to understand the problem space deeply',
      keyActivities: [
        'Market research',
        'User research',
        'Stakeholder interviews',
        'Trend analysis',
        'Competitive analysis',
      ],
      deliverables: ['Research report', 'Insight cards', 'User profiles', 'Market landscape'],
    },
    {
      id: 'define',
      name: 'Define',
      description: 'Converge on the specific problem to solve',
      keyActivities: [
        'Insight synthesis',
        'Problem prioritization',
        'Design brief creation',
        'Success criteria definition',
        'Scope setting',
      ],
      deliverables: ['Design brief', 'Problem statement', 'Success metrics', 'Project scope'],
    },
    {
      id: 'develop',
      name: 'Develop',
      description: 'Diverge to explore multiple potential solutions',
      keyActivities: [
        'Concept development',
        'Co-creation workshops',
        'Prototyping',
        'Multi-disciplinary collaboration',
        'Iteration cycles',
      ],
      deliverables: ['Concept options', 'Prototypes', 'Evaluation criteria', 'Development roadmap'],
    },
    {
      id: 'deliver',
      name: 'Deliver',
      description: 'Converge on final solution and launch',
      keyActivities: [
        'Final testing',
        'Production planning',
        'Launch preparation',
        'Documentation',
        'Handoff',
      ],
      deliverables: ['Final product', 'Launch plan', 'Documentation', 'Metrics dashboard'],
    },
  ],
  bestFor: [
    'Product strategy',
    'Service innovation',
    'Organizational design',
    'Policy design',
    'Complex problem solving',
  ],
  keyPrinciples: [
    'Put people first',
    'Communicate visually and inclusively',
    'Collaborate and co-create',
    'Iterate, iterate, iterate',
  ],
}

/**
 * IDEO Human-Centered Design
 * Three-phase model focused on desirability, viability, and feasibility
 */
const IDEO_FRAMEWORK: FrameworkConfig = {
  id: 'ideo',
  name: 'IDEO Human-Centered Design',
  source: 'IDEO',
  description:
    'A creative approach that starts with people and ends with innovative solutions tailored to their needs. Balances desirability (human), viability (business), and feasibility (technical).',
  corePhilosophy: 'Human desirability meets business viability and technical feasibility',
  stages: [
    {
      id: 'inspiration',
      name: 'Inspiration',
      description: 'Learn directly from the people you\'re designing for',
      keyActivities: [
        'Immersive research',
        'Expert interviews',
        'Analogous inspiration',
        'Secondary research',
        'Define design challenge',
      ],
      deliverables: ['Design challenge', 'Inspiration board', 'Key insights', 'Opportunity areas'],
    },
    {
      id: 'ideation',
      name: 'Ideation',
      description: 'Make sense of what you learned and generate ideas',
      keyActivities: [
        'Synthesis',
        'Brainstorming',
        'Bundling ideas',
        'Getting feedback',
        'Rapid prototyping',
      ],
      deliverables: ['Idea clusters', 'Feedback synthesis', 'Prototypes', 'Solution concepts'],
    },
    {
      id: 'implementation',
      name: 'Implementation',
      description: 'Bring your solution to life and to market',
      keyActivities: [
        'Building partnerships',
        'Business modeling',
        'Piloting',
        'Scaling',
        'Measuring impact',
      ],
      deliverables: ['Business model', 'Pilot results', 'Scale plan', 'Impact metrics'],
    },
  ],
  bestFor: [
    'Social innovation',
    'Healthcare design',
    'Education design',
    'Global development',
    'Nonprofit innovation',
  ],
  keyPrinciples: [
    'Hear from users',
    'Create to learn',
    'Learn from failure',
    'Make it real',
    'Iterate rapidly',
    'Build on ideas of others',
  ],
}

/**
 * IBM Enterprise Design Thinking
 * Scaled approach for large organizations with Hills, Playbacks, and Sponsor Users
 */
const IBM_FRAMEWORK: FrameworkConfig = {
  id: 'ibm',
  name: 'IBM Enterprise Design Thinking',
  source: 'IBM',
  description:
    'A framework for applying design thinking at enterprise scale. Adds Hills (outcome-focused goals), Playbacks (alignment checkpoints), and Sponsor Users (ongoing user involvement) to the design process.',
  corePhilosophy: 'Scale design thinking across large organizations with aligned outcomes',
  stages: [
    {
      id: 'understand',
      name: 'Understand',
      description: 'Deeply understand user needs and business context',
      keyActivities: [
        'Sponsor User recruitment',
        'As-is scenario mapping',
        'Stakeholder mapping',
        'Empathy mapping',
        'Pain point analysis',
      ],
      deliverables: [
        'Sponsor User profiles',
        'As-is scenarios',
        'Stakeholder map',
        'Pain point matrix',
      ],
    },
    {
      id: 'explore',
      name: 'Explore',
      description: 'Generate and explore ideas with Hills as guiding outcomes',
      keyActivities: [
        'Hills definition',
        'Ideation sessions',
        'To-be scenario mapping',
        'Experience-based roadmapping',
        'Prioritization',
      ],
      deliverables: ['Hills statements', 'To-be scenarios', 'Experience roadmap', 'Priority matrix'],
    },
    {
      id: 'make',
      name: 'Make',
      description: 'Build prototypes and test with Sponsor Users',
      keyActivities: [
        'Prototyping',
        'Sponsor User testing',
        'Playback sessions',
        'Iteration',
        'Technical validation',
      ],
      deliverables: ['Prototypes', 'Test results', 'Playback feedback', 'Technical specs'],
    },
    {
      id: 'evaluate',
      name: 'Evaluate',
      description: 'Validate outcomes and plan for delivery',
      keyActivities: [
        'Outcome validation',
        'Final Playback',
        'Release planning',
        'Success metrics',
        'Retrospective',
      ],
      deliverables: ['Validation report', 'Release plan', 'Success metrics', 'Lessons learned'],
    },
  ],
  bestFor: [
    'Enterprise software',
    'Large-scale transformation',
    'B2B products',
    'Complex systems',
    'Cross-functional teams',
  ],
  keyPrinciples: [
    'Focus on user outcomes (Hills)',
    'Maintain alignment (Playbacks)',
    'Keep users involved (Sponsor Users)',
    'Restless reinvention',
    'Diverse empowered teams',
  ],
}

/**
 * All Design Thinking frameworks indexed by ID
 */
export const DESIGN_THINKING_FRAMEWORKS: Record<DesignThinkingFramework, FrameworkConfig> = {
  stanford: STANFORD_FRAMEWORK,
  'double-diamond': DOUBLE_DIAMOND_FRAMEWORK,
  ideo: IDEO_FRAMEWORK,
  ibm: IBM_FRAMEWORK,
}

// ============================================================================
// DESIGN THINKING TOOLS
// ============================================================================

/**
 * Common Design Thinking tools and methods
 */
export const DESIGN_THINKING_TOOLS: DesignThinkingTool[] = [
  {
    id: 'empathy-map',
    name: 'Empathy Map',
    description:
      'A collaborative tool to visualize what users say, think, feel, and do. Helps teams develop deep understanding of users.',
    useCases: ['User research synthesis', 'Persona development', 'Team alignment on user needs'],
    duration: '30-60 min',
    participants: '3-8 people',
    frameworks: ['stanford', 'ibm'],
  },
  {
    id: 'journey-map',
    name: 'Journey Map',
    description:
      'Visual representation of a user\'s experience over time, showing touchpoints, emotions, and pain points.',
    useCases: [
      'Service design',
      'Experience optimization',
      'Identifying pain points',
      'Cross-channel analysis',
    ],
    duration: '2-4 hours',
    participants: '4-10 people',
    frameworks: ['stanford', 'double-diamond', 'ideo'],
  },
  {
    id: 'how-might-we',
    name: 'How Might We (HMW)',
    description:
      'Reframe challenges as opportunities using "How Might We..." questions to inspire creative solutions.',
    useCases: ['Problem reframing', 'Brainstorm setup', 'Team alignment'],
    duration: '15-30 min',
    participants: '2-10 people',
    frameworks: ['stanford', 'ideo'],
  },
  {
    id: 'persona',
    name: 'User Persona',
    description:
      'Fictional character representing a user segment, based on research. Helps teams design for specific user needs.',
    useCases: ['User-centered design', 'Communication', 'Decision making', 'Prioritization'],
    duration: '1-2 hours',
    participants: '2-6 people',
    frameworks: ['stanford', 'double-diamond', 'ideo', 'ibm'],
  },
  {
    id: 'crazy-8s',
    name: 'Crazy 8s',
    description:
      'Rapid sketching exercise where participants create 8 ideas in 8 minutes to push past obvious solutions.',
    useCases: ['Rapid ideation', 'Breaking creative blocks', 'Workshop warm-up'],
    duration: '8-15 min',
    participants: '2-20 people',
    frameworks: ['stanford'],
  },
  {
    id: 'storyboard',
    name: 'Storyboarding',
    description:
      'Visual narrative showing how users interact with a product or service over time, like a comic strip.',
    useCases: ['Concept communication', 'User flow design', 'Stakeholder buy-in'],
    duration: '1-2 hours',
    participants: '1-4 people',
    frameworks: ['stanford', 'ideo'],
  },
  {
    id: 'dot-voting',
    name: 'Dot Voting',
    description:
      'Democratic prioritization method where participants vote on ideas using limited dots to identify top choices.',
    useCases: ['Prioritization', 'Decision making', 'Consensus building'],
    duration: '10-20 min',
    participants: '4-20 people',
    frameworks: ['stanford', 'double-diamond', 'ideo', 'ibm'],
  },
  {
    id: 'hills',
    name: 'Hills',
    description:
      'IBM\'s method for defining user-focused outcomes: "Who (user) can do What (task) with Wow (differentiator)."',
    useCases: ['Goal setting', 'Alignment', 'Success criteria', 'Prioritization'],
    duration: '1-2 hours',
    participants: '4-12 people',
    frameworks: ['ibm'],
  },
  {
    id: 'playback',
    name: 'Playback Session',
    description:
      'Structured checkpoint to share progress, get feedback, and align stakeholders throughout the design process.',
    useCases: ['Stakeholder alignment', 'Progress review', 'Decision making', 'Feedback collection'],
    duration: '30-60 min',
    participants: '5-20 people',
    frameworks: ['ibm'],
  },
  {
    id: 'assumption-mapping',
    name: 'Assumption Mapping',
    description:
      'Identify and prioritize assumptions to test, focusing on high-risk assumptions that could derail the project.',
    useCases: ['Risk assessment', 'Test planning', 'Validation prioritization'],
    duration: '30-60 min',
    participants: '3-8 people',
    frameworks: ['stanford', 'double-diamond'],
  },
  {
    id: 'rapid-prototyping',
    name: 'Rapid Prototyping',
    description:
      'Quickly create low-fidelity versions of solutions to test ideas and learn fast before investing in development.',
    useCases: ['Idea validation', 'User testing', 'Stakeholder communication'],
    duration: '1-4 hours',
    participants: '1-4 people',
    frameworks: ['stanford', 'ideo', 'ibm'],
  },
  {
    id: 'affinity-diagram',
    name: 'Affinity Diagram',
    description:
      'Organize large amounts of data or ideas into natural clusters to identify patterns and themes.',
    useCases: ['Research synthesis', 'Idea organization', 'Pattern identification'],
    duration: '30-90 min',
    participants: '3-8 people',
    frameworks: ['stanford', 'double-diamond', 'ideo', 'ibm'],
  },
  {
    id: 'five-whys',
    name: 'Five Whys',
    description:
      'Root cause analysis technique that asks "Why?" five times to drill down to the underlying problem.',
    useCases: ['Root cause analysis', 'Problem definition', 'Understanding user needs'],
    duration: '15-30 min',
    participants: '2-6 people',
    frameworks: ['stanford', 'ideo'],
  },
  {
    id: 'design-studio',
    name: 'Design Studio',
    description:
      'Collaborative workshop format combining individual sketching, critique, and iteration to generate solutions.',
    useCases: ['Collaborative design', 'Concept generation', 'Team alignment'],
    duration: '2-4 hours',
    participants: '4-12 people',
    frameworks: ['stanford', 'double-diamond'],
  },
  {
    id: 'retrospective',
    name: 'Retrospective',
    description:
      'Structured reflection on what went well, what didn\'t, and what to improve for the next iteration.',
    useCases: ['Team improvement', 'Process optimization', 'Learning capture'],
    duration: '30-60 min',
    participants: '3-12 people',
    frameworks: ['stanford', 'ideo', 'ibm'],
  },
]

// ============================================================================
// CASE STUDIES
// ============================================================================

/**
 * Case studies demonstrating Design Thinking in practice
 */
export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'airbnb-snow-white',
    company: 'Airbnb',
    challenge:
      'Low-quality listing photos were hurting conversion rates and user trust in the platform.',
    approach:
      'Applied d.school design thinking. Empathized with hosts struggling to take good photos. Ideated solutions including a professional photography program. Prototyped by offering free photography to select hosts.',
    outcome:
      '2-3x increase in bookings for listings with professional photos. This became a key growth lever for the company.',
    frameworks: ['stanford'],
    industry: 'Travel & Hospitality',
    year: 2010,
  },
  {
    id: 'ideo-shopping-cart',
    company: 'IDEO',
    challenge: 'Redesign the supermarket shopping cart in just 5 days for ABC Nightline.',
    approach:
      'Used Human-Centered Design with rapid prototyping. Observed shoppers, identified pain points (child safety, theft, maneuverability), brainstormed wildly, built multiple prototypes, and iterated quickly.',
    outcome:
      'Created an innovative cart design with modular baskets, better child seating, and improved scanning. Became a famous case study in rapid innovation.',
    frameworks: ['ideo', 'stanford'],
    industry: 'Retail',
    year: 1999,
  },
  {
    id: 'ibm-watson-health',
    company: 'IBM',
    challenge:
      'Help oncologists analyze vast amounts of medical literature to provide better cancer treatment recommendations.',
    approach:
      'Enterprise Design Thinking with Sponsor Users (oncologists). Defined Hills focused on clinician outcomes. Regular Playbacks with medical professionals to validate approach.',
    outcome:
      'Watson for Oncology now assists doctors in over 230 hospitals worldwide, analyzing patient data against millions of medical records.',
    frameworks: ['ibm'],
    industry: 'Healthcare',
    year: 2015,
  },
  {
    id: 'gov-uk',
    company: 'UK Government Digital Service',
    challenge: 'Transform government services to be user-centered and accessible to all citizens.',
    approach:
      'Applied Double Diamond methodology at scale. Discovered citizen needs, defined service principles, developed prototypes with users, delivered GOV.UK platform.',
    outcome:
      'GOV.UK won Design of the Year 2013. Saved UK government estimated 4+ billion in efficiency gains. Became a model for digital government worldwide.',
    frameworks: ['double-diamond'],
    industry: 'Government',
    year: 2012,
  },
  {
    id: 'apple-store',
    company: 'Apple',
    challenge: 'Create a retail experience that matches the premium brand and drives product adoption.',
    approach:
      'Focused on empathy and experience design. Studied hospitality industry (Ritz-Carlton). Prototyped store layouts. Tested Genius Bar concept as a human touchpoint for technical support.',
    outcome:
      'Apple Stores became highest revenue per square foot retail in the world. Genius Bar transformed tech support into a relationship-building opportunity.',
    frameworks: ['stanford', 'ideo'],
    industry: 'Retail Technology',
    year: 2001,
  },
  {
    id: 'bank-of-america-keep-the-change',
    company: 'Bank of America',
    challenge:
      'Help customers save money when traditional savings approaches weren\'t working for them.',
    approach:
      'IDEO applied HCD to understand barriers to saving. Discovered people felt saving required big lifestyle changes. Ideated "invisible" saving mechanisms.',
    outcome:
      'Keep the Change rounds up purchases to nearest dollar, depositing difference to savings. 12 million customers enrolled, saving over 3 billion in first few years.',
    frameworks: ['ideo'],
    industry: 'Financial Services',
    year: 2005,
  },
  {
    id: 'spotify-squads',
    company: 'Spotify',
    challenge: 'Scale product development while maintaining innovation speed and user focus.',
    approach:
      'Integrated design thinking into agile development with autonomous squads. Each squad focuses on user problems, runs discovery sprints, and iterates rapidly.',
    outcome:
      'Spotify scaled to 200+ million users while maintaining rapid feature development and strong user satisfaction.',
    frameworks: ['stanford', 'double-diamond'],
    industry: 'Entertainment Technology',
    year: 2014,
  },
  {
    id: 'oral-b-electric-toothbrush',
    company: 'Oral-B',
    challenge: 'Redesign electric toothbrush for better user experience and health outcomes.',
    approach:
      'Deep user research revealed people brushed too hard and not long enough. Ideated smart features to coach users. Prototyped pressure sensors and timers.',
    outcome:
      'New design with pressure sensor and timer improved brushing habits. Market leader with over 50% share in premium electric toothbrush segment.',
    frameworks: ['stanford', 'double-diamond'],
    industry: 'Consumer Products',
    year: 2016,
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a framework configuration by ID
 */
export function getFrameworkById(id: DesignThinkingFramework): FrameworkConfig {
  return DESIGN_THINKING_FRAMEWORKS[id]
}

/**
 * Get all frameworks as an array
 */
export function getAllFrameworks(): FrameworkConfig[] {
  return Object.values(DESIGN_THINKING_FRAMEWORKS)
}

/**
 * Get tools associated with a specific framework
 */
export function getToolsByFramework(frameworkId: DesignThinkingFramework): DesignThinkingTool[] {
  return DESIGN_THINKING_TOOLS.filter((tool) => tool.frameworks.includes(frameworkId))
}

/**
 * Get a tool by its ID
 */
export function getToolById(toolId: string): DesignThinkingTool | undefined {
  return DESIGN_THINKING_TOOLS.find((tool) => tool.id === toolId)
}

/**
 * Search case studies by industry and/or framework
 */
export function searchCaseStudies(
  industry?: string,
  framework?: DesignThinkingFramework
): CaseStudy[] {
  return CASE_STUDIES.filter((study) => {
    if (industry && !study.industry.toLowerCase().includes(industry.toLowerCase())) {
      return false
    }
    if (framework && !study.frameworks.includes(framework)) {
      return false
    }
    return true
  })
}

/**
 * Get case studies for a specific framework
 */
export function getCaseStudiesByFramework(framework: DesignThinkingFramework): CaseStudy[] {
  return CASE_STUDIES.filter((study) => study.frameworks.includes(framework))
}

/**
 * Get a case study by its ID
 */
export function getCaseStudyById(caseStudyId: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.id === caseStudyId)
}

/**
 * Get tools recommended for a specific stage of a framework
 */
export function getToolsForStage(
  frameworkId: DesignThinkingFramework,
  stageId: string
): DesignThinkingTool[] {
  const framework = getFrameworkById(frameworkId)
  const stage = framework.stages.find((s) => s.id === stageId)

  if (!stage) return []

  // Return tools that match this framework and are relevant to the stage activities
  return getToolsByFramework(frameworkId).filter((tool) => {
    // Check if tool use cases overlap with stage activities
    const stageKeywords = [
      ...stage.keyActivities.map((a) => a.toLowerCase()),
      ...stage.deliverables.map((d) => d.toLowerCase()),
    ]

    return tool.useCases.some((useCase) =>
      stageKeywords.some(
        (keyword) =>
          useCase.toLowerCase().includes(keyword) || keyword.includes(useCase.toLowerCase())
      )
    )
  })
}

/**
 * Get all available framework IDs
 */
export function getFrameworkIds(): DesignThinkingFramework[] {
  return ['stanford', 'double-diamond', 'ideo', 'ibm']
}

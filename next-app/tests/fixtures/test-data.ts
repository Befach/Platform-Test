/**
 * Test Data Fixtures for E2E Testing
 *
 * This file contains all test data used throughout the test suite.
 * It's organized by entity type (users, teams, workspaces, etc.)
 * and can be easily extended for new test scenarios.
 */

/**
 * Test User Credentials
 * Used for authentication flow testing and multi-tenant isolation tests
 */
export const TEST_USERS = {
  userA: {
    email: 'usera@test.example.com',
    password: 'TestPassword123!',
    firstName: 'User',
    lastName: 'A',
  },
  userB: {
    email: 'userb@test.example.com',
    password: 'TestPassword123!',
    firstName: 'User',
    lastName: 'B',
  },
  userC: {
    email: 'userc@test.example.com',
    password: 'TestPassword123!',
    firstName: 'User',
    lastName: 'C',
  },
};

/**
 * Test Team Data
 * Used to test team creation and isolation
 */
export const TEST_TEAMS = {
  teamA: {
    name: 'Test Team A',
    description: 'First test team for isolation testing',
  },
  teamB: {
    name: 'Test Team B',
    description: 'Second test team for isolation testing',
  },
};

/**
 * Test Workspace Data
 * Used to test workspace CRUD operations and phase management
 */
export const TEST_WORKSPACES = {
  productRoadmap: {
    name: 'Product Roadmap 2025',
    description: 'Main product roadmap for the year',
    phases: ['research', 'planning', 'execution', 'launch', 'optimize'],
  },
  mobileApp: {
    name: 'Mobile App Development',
    description: 'iOS and Android native app development',
    phases: ['research', 'design', 'development', 'testing', 'launch'],
  },
  securityInitiative: {
    name: 'Security Initiative',
    description: 'Multi-phase security hardening',
    phases: ['assessment', 'planning', 'implementation', 'verification'],
  },
};

/**
 * Test Work Item Data (Features, Bugs, etc.)
 * Used for feature CRUD testing and timeline breakdown
 */
export const TEST_WORK_ITEMS = {
  authentication: {
    title: 'User Authentication System',
    type: 'feature',
    description: 'Implement secure user authentication with email/password and OAuth',
    priority: 'high',
    phase: 'design',
  },
  realTimeSync: {
    title: 'Real-time Data Synchronization',
    type: 'feature',
    description: 'Add WebSocket-based real-time data updates across team members',
    priority: 'high',
    phase: 'design',
  },
  darkMode: {
    title: 'Dark Mode Support',
    type: 'feature',
    description: 'Implement dark mode theme across the entire application',
    priority: 'medium',
    phase: 'design',
  },
  performanceBug: {
    title: 'Dashboard loading is slow',
    type: 'bug',
    description: 'Dashboard takes 5+ seconds to load with large datasets',
    priority: 'high',
    phase: 'triage',
  },
  uiEnhancement: {
    title: 'Improve form UX',
    type: 'enhancement',
    description: 'Better form validation and error messages',
    priority: 'medium',
    phase: 'design',
  },
};

/**
 * Test Timeline Items (MVP/SHORT/LONG breakdown)
 * Used to test timeline breakdown and phase organization
 */
export const TEST_TIMELINE_ITEMS = {
  mvpAuth: {
    workItemTitle: 'User Authentication System',
    period: 'MVP',
    description: 'Basic email/password authentication',
    estimatedDays: 10,
  },
  shortTermAuth: {
    workItemTitle: 'User Authentication System',
    period: 'SHORT',
    description: 'Add OAuth (Google, GitHub)',
    estimatedDays: 5,
  },
  longTermAuth: {
    workItemTitle: 'User Authentication System',
    period: 'LONG',
    description: 'SSO and enterprise authentication',
    estimatedDays: 15,
  },
};

/**
 * Test Dependency Links
 * Used to test dependency graph and relationship management
 */
export const TEST_DEPENDENCIES = {
  authBlocksProfiles: {
    sourceTitle: 'User Authentication System',
    targetTitle: 'User Profiles',
    type: 'blocks',
    reason: 'User profiles require authentication to be completed first',
  },
  profilesDependOnAuth: {
    sourceTitle: 'User Profiles',
    targetTitle: 'User Authentication System',
    type: 'depends_on',
    reason: 'Cannot create user profiles without authentication system',
  },
  notificationsComplementAuth: {
    sourceTitle: 'Notifications System',
    targetTitle: 'User Authentication System',
    type: 'complements',
    reason: 'Notifications enhance authentication with login alerts',
  },
  realtimeConflictsSyncPolicy: {
    sourceTitle: 'Real-time Sync',
    targetTitle: 'Offline Support',
    type: 'conflicts',
    reason: 'Offline mode and real-time sync have conflicting requirements',
  },
};

/**
 * Test Resources Data
 * Used to test resource CRUD, search, sharing, and audit trail
 */
export const TEST_RESOURCES = {
  designInspiration: {
    title: 'Dribbble Design Inspiration',
    url: 'https://dribbble.com/shots/popular',
    description: 'Collection of UI design patterns for dashboard layouts',
    notes: 'Good examples of data visualization and card layouts',
    resourceType: 'inspiration' as const,
  },
  apiDocumentation: {
    title: 'REST API Best Practices',
    url: 'https://restfulapi.net/resource-naming/',
    description: 'Guide to RESTful API design and naming conventions',
    notes: 'Reference for API endpoint design',
    resourceType: 'documentation' as const,
  },
  competitorAnalysis: {
    title: 'Competitor Feature Analysis',
    url: 'https://example.com/competitor',
    description: 'Analysis of competitor product features',
    notes: 'Key differentiators identified: AI features, pricing model',
    resourceType: 'reference' as const,
  },
  videoTutorial: {
    title: 'React Performance Optimization',
    url: 'https://youtube.com/watch?v=abc123',
    description: 'Video tutorial on React performance best practices',
    notes: 'Covers memo, useMemo, useCallback patterns',
    resourceType: 'media' as const,
  },
  designTool: {
    title: 'Figma Design Tool',
    url: 'https://figma.com',
    description: 'Collaborative design tool for UI/UX',
    notes: 'Used for wireframes and prototypes',
    resourceType: 'tool' as const,
  },
  searchableResource: {
    title: 'Authentication Flow Diagrams',
    url: 'https://example.com/auth-flow',
    description: 'OAuth2 and JWT authentication flow diagrams with security considerations',
    notes: 'Includes token refresh, session management, and logout flows',
    resourceType: 'documentation' as const,
  },
};

/**
 * Test Mind Map Data
 * Used to test mind map creation and node management
 */
export const TEST_MIND_MAPS = {
  productIdeation: {
    name: 'Product Ideation - 2025',
    description: 'Brainstorm and plan new product features',
    nodes: [
      {
        type: 'idea',
        title: 'AI-Powered Analytics',
        description: 'Use ML to provide insights',
      },
      {
        type: 'feature',
        title: 'User Dashboard',
        description: 'Main product dashboard',
      },
      {
        type: 'epic',
        title: 'Mobile App Launch',
        description: 'Native iOS and Android apps',
      },
    ],
  },
};

/**
 * Test Roles and Permissions
 * Used to test team member roles and phase assignments
 */
export const TEST_ROLES = {
  owner: {
    name: 'Owner',
    permissions: [
      'manage_team',
      'invite_members',
      'manage_roles',
      'view_all_phases',
      'edit_all_phases',
      'delete_workspace',
    ],
  },
  admin: {
    name: 'Admin',
    permissions: [
      'invite_members',
      'manage_roles',
      'view_all_phases',
      'edit_all_phases',
    ],
  },
  member: {
    name: 'Member',
    permissions: [
      'view_assigned_phases',
      'edit_assigned_phases',
      'view_shared_items',
    ],
  },
  viewer: {
    name: 'Viewer',
    permissions: [
      'view_assigned_phases',
      'view_shared_items',
    ],
  },
};

/**
 * Test Phase Assignments
 * Used to test phase-based permissions
 */
export const TEST_PHASE_ASSIGNMENTS = {
  researchOnly: {
    phases: ['research'],
  },
  planningAndExecution: {
    phases: ['planning', 'execution'],
  },
  allPhases: {
    phases: ['research', 'planning', 'execution', 'launch', 'optimize'],
  },
};

/**
 * Test Scenarios for Multi-Tenant Isolation
 * Each scenario has two teams with data that should be isolated
 */
export const TEST_ISOLATION_SCENARIOS = {
  twoTeamsWithWorkspaces: {
    teams: [
      {
        id: 'team_a',
        name: 'Team A',
        owner: TEST_USERS.userA,
        workspaces: [
          { name: 'Workspace A1', description: 'First workspace of Team A' },
          { name: 'Workspace A2', description: 'Second workspace of Team A' },
        ],
      },
      {
        id: 'team_b',
        name: 'Team B',
        owner: TEST_USERS.userB,
        workspaces: [
          { name: 'Workspace B1', description: 'First workspace of Team B' },
        ],
      },
    ],
  },
};

/**
 * Test Navigation Paths
 * Common paths used throughout tests
 */
export const TEST_PATHS = {
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  workspaces: '/workspaces',
  workspace: (id: string) => `/workspaces/${id}`,
  features: (id: string) => `/workspaces/${id}/features`,
  feature: (workspaceId: string, featureId: string) => `/workspaces/${workspaceId}/features/${featureId}`,
  mindMaps: (id: string) => `/workspaces/${id}/mind-map`,
  mindMap: (workspaceId: string, mapId: string) => `/workspaces/${workspaceId}/mind-map/${mapId}`,
  dependencies: (id: string) => `/workspaces/${id}/dependencies`,
  teamMembers: (id: string) => `/workspaces/${id}/team`,
  settings: (id: string) => `/workspaces/${id}/settings`,
  analytics: (id: string) => `/workspaces/${id}/analytics`,
  ai: (id: string) => `/workspaces/${id}/ai`,
  // Resources API paths
  resourcesApi: (teamId: string) => `/api/resources?team_id=${teamId}`,
  resourcesSearchApi: (teamId: string, query: string) => `/api/resources/search?team_id=${teamId}&q=${encodeURIComponent(query)}`,
  resourceHistoryApi: (resourceId: string) => `/api/resources/${resourceId}/history`,
  workItemResourcesApi: (workItemId: string) => `/api/work-items/${workItemId}/resources`,
};

/**
 * Test Selectors
 * Common selectors used for element identification in tests
 */
export const TEST_SELECTORS = {
  // Buttons
  createButton: 'button:has-text("Create"), button[data-testid="create-button"]',
  deleteButton: 'button:has-text("Delete"), button[data-testid="delete-button"]',
  submitButton: 'button[type="submit"]',
  cancelButton: 'button:has-text("Cancel"), button[data-testid="cancel-button"]',
  editButton: 'button:has-text("Edit"), button[data-testid="edit-button"]',
  saveButton: 'button:has-text("Save"), button[data-testid="save-button"]',

  // Forms
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  textInput: 'input[type="text"]',
  textarea: 'textarea',

  // Navigation
  sidebar: '[data-testid="sidebar"]',
  topBar: '[data-testid="top-bar"]',
  profileMenu: '[data-testid="profile-menu"]',

  // Data elements
  featureCard: '[data-testid="feature-card"]',
  workspaceCard: '[data-testid="workspace-card"]',
  teamMemberRow: '[data-testid="team-member-row"]',
  mindMapNode: '[data-testid="mind-map-node"]',

  // Modals and dialogs
  dialog: '[role="dialog"]',
  modal: '.modal',
};

/**
 * Test Timeouts (in milliseconds)
 */
export const TEST_TIMEOUTS = {
  short: 5000,      // Page loads, form submissions
  medium: 10000,    // Complex operations
  long: 30000,      // External API calls, file operations
  navigation: 10000, // URL changes
};

/**
 * Helper to get test user by role
 */
export function getTestUserWithRole(role: 'userA' | 'userB' | 'userC') {
  return TEST_USERS[role];
}

/**
 * Helper to get test data with minimal setup
 */
export function getMinimalTestData() {
  return {
    user: TEST_USERS.userA,
    team: TEST_TEAMS.teamA,
    workspace: TEST_WORKSPACES.productRoadmap,
    workItem: TEST_WORK_ITEMS.authentication,
  };
}

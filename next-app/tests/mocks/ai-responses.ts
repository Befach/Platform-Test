/**
 * AI Mock Utilities for E2E Testing
 *
 * This file provides mock response objects and helper functions for intercepting
 * AI API routes during Playwright E2E tests. Use these mocks to:
 * - Test AI chat functionality without real API calls
 * - Simulate tool preview and approval workflows
 * - Test agentic plan execution
 * - Verify rollback functionality
 *
 * @example
 * ```typescript
 * import { mockAIRoutes, MOCK_CHAT_REPLY } from '@/tests/mocks/ai-responses';
 *
 * test('AI chat responds', async ({ page }) => {
 *   await mockAIRoutes(page);
 *   // Test interactions...
 * });
 * ```
 */

import { Page } from '@playwright/test';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Chat message structure */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

/** Tool category */
type ToolCategory = 'creation' | 'analysis' | 'optimization' | 'strategy';

/** Action type */
type ActionType = 'create' | 'update' | 'delete' | 'analyze' | 'suggest';

/** Action status */
type ActionStatus = 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back' | 'cancelled';

/** Affected item in an action */
interface AffectedItem {
  id: string;
  type: string;
  name?: string;
  change: 'create' | 'update' | 'delete';
}

/** Action preview structure */
interface ActionPreview {
  action: ActionType;
  entityType: string;
  data: Record<string, unknown>;
  description: string;
  affectedItems?: AffectedItem[];
  estimatedDuration?: 'fast' | 'medium' | 'slow';
  warnings?: string[];
}

/** Tool execution response */
interface ToolExecutionResponse {
  requiresApproval: boolean;
  preview: ActionPreview;
  toolCallId: string;
}

/** Execution result */
interface ExecutionResult {
  success: boolean;
  actionId: string;
  status: ActionStatus;
  result?: unknown;
  error?: string;
  duration?: number;
  rollbackData?: Record<string, unknown>;
}

/** AI action history record */
interface AIActionHistory {
  id: string;
  team_id: string;
  workspace_id: string;
  user_id: string;
  session_id: string;
  tool_name: string;
  tool_category: ToolCategory;
  action_type: ActionType;
  input_params: Record<string, unknown>;
  output_result: Record<string, unknown> | null;
  affected_items?: AffectedItem[];
  rollback_data: Record<string, unknown> | null;
  is_reversible?: boolean;
  rolled_back_at: string | null;
  status: ActionStatus;
  error_message: string | null;
  execution_started_at: string | null;
  execution_completed_at: string | null;
  execution_duration_ms: number | null;
  tokens_used?: number;
  cost_usd?: number;
  model_used: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

/** Task step in a plan */
interface TaskStep {
  id: string;
  order: number;
  description: string;
  toolName: string;
  params: Record<string, unknown>;
  dependsOn: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
}

/** Task plan structure */
interface TaskPlan {
  id: string;
  goal: string;
  steps: TaskStep[];
  estimatedDuration: 'fast' | 'medium' | 'slow';
  requiresApproval: boolean;
  createdAt: number;
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';
  summary?: string;
}

/** Chat response (non-streaming) */
interface ChatResponse {
  success: boolean;
  message: ChatMessage;
  sessionId: string;
  toolCalls?: ToolExecutionResponse[];
}

/** Streaming chat chunk */
interface StreamChunk {
  type: 'text' | 'tool_call' | 'done';
  content?: string;
  toolCall?: ToolExecutionResponse;
}

// =============================================================================
// MOCK DATA - CHAT RESPONSES
// =============================================================================

/** Mock non-streaming chat reply */
export const MOCK_CHAT_REPLY: ChatResponse = {
  success: true,
  message: {
    role: 'assistant',
    content: 'I understand you want to analyze your workspace. I can help you with that! Would you like me to review your work items for insights or suggest optimizations?',
    timestamp: Date.now(),
  },
  sessionId: 'session_mock_123456',
};

/** Mock chat reply with tool suggestion */
export const MOCK_CHAT_REPLY_WITH_TOOL: ChatResponse = {
  success: true,
  message: {
    role: 'assistant',
    content: 'I can create a new work item for you. Let me set that up.',
    timestamp: Date.now(),
  },
  sessionId: 'session_mock_123456',
  toolCalls: [
    {
      requiresApproval: true,
      preview: {
        action: 'create',
        entityType: 'work_item',
        data: {
          name: 'New Feature Request',
          type: 'feature',
          priority: 'medium',
        },
        description: 'Create a new feature work item called "New Feature Request"',
        affectedItems: [
          { id: 'temp_123', type: 'work_item', name: 'New Feature Request', change: 'create' },
        ],
        estimatedDuration: 'fast',
      },
      toolCallId: 'tool_call_mock_123',
    },
  ],
};

/** Mock streaming chunks for chat */
export const MOCK_STREAM_CHUNKS: StreamChunk[] = [
  { type: 'text', content: 'I can help you ' },
  { type: 'text', content: 'analyze your work items. ' },
  { type: 'text', content: 'Let me check the current status...' },
  { type: 'done' },
];

/** Mock streaming chunks with tool call */
export const MOCK_STREAM_CHUNKS_WITH_TOOL: StreamChunk[] = [
  { type: 'text', content: 'Creating the work item for you...' },
  {
    type: 'tool_call',
    toolCall: {
      requiresApproval: true,
      preview: {
        action: 'create',
        entityType: 'work_item',
        data: { name: 'Streamed Work Item', type: 'feature' },
        description: 'Create a new feature work item',
      },
      toolCallId: 'stream_tool_123',
    },
  },
  { type: 'done' },
];

// =============================================================================
// MOCK DATA - TOOL PREVIEWS
// =============================================================================

/** Mock tool preview for createWorkItem */
export const MOCK_TOOL_PREVIEW_CREATE_WORK_ITEM: ToolExecutionResponse = {
  requiresApproval: true,
  preview: {
    action: 'create',
    entityType: 'work_item',
    data: {
      name: 'User Authentication System',
      type: 'feature',
      priority: 'high',
      purpose: 'Implement secure user authentication with email/password and OAuth',
      tags: ['security', 'auth', 'mvp'],
    },
    description: 'Create a new high-priority feature work item for user authentication',
    affectedItems: [
      { id: 'wi_mock_auth', type: 'work_item', name: 'User Authentication System', change: 'create' },
    ],
    estimatedDuration: 'fast',
  },
  toolCallId: 'tool_create_work_item_123',
};

/** Mock tool preview for analyzeFeedback */
export const MOCK_TOOL_PREVIEW_ANALYZE_FEEDBACK: ToolExecutionResponse = {
  requiresApproval: false, // Analysis tools don't require approval
  preview: {
    action: 'analyze',
    entityType: 'feedback',
    data: {
      scope: 'all_feedback',
      timeRange: 'last_30_days',
      workspaceId: 'ws_mock_123',
    },
    description: 'Analyze all feedback from the last 30 days to identify trends and sentiment',
    estimatedDuration: 'medium',
  },
  toolCallId: 'tool_analyze_feedback_123',
};

/** Mock tool preview for createDependency */
export const MOCK_TOOL_PREVIEW_CREATE_DEPENDENCY: ToolExecutionResponse = {
  requiresApproval: true,
  preview: {
    action: 'create',
    entityType: 'linked_item',
    data: {
      sourceId: 'wi_123',
      targetId: 'wi_456',
      connectionType: 'dependency',
      reason: 'Authentication must be completed before user profiles can be implemented',
    },
    description: 'Create a dependency link: User Profiles depends on Authentication',
    affectedItems: [
      { id: 'li_mock_123', type: 'linked_item', name: 'Profiles -> Auth', change: 'create' },
    ],
    estimatedDuration: 'fast',
    warnings: ['This will add a new critical path dependency'],
  },
  toolCallId: 'tool_create_dependency_123',
};

// =============================================================================
// MOCK DATA - APPROVAL RESULTS
// =============================================================================

/** Mock approval success result */
export const MOCK_APPROVAL_SUCCESS: ExecutionResult = {
  success: true,
  actionId: 'action_mock_123',
  status: 'completed',
  result: {
    id: 'wi_created_123',
    name: 'User Authentication System',
    type: 'feature',
    created_at: new Date().toISOString(),
  },
  duration: 245,
  rollbackData: {
    entityType: 'work_item',
    entityId: 'wi_created_123',
    operation: 'create',
  },
};

/** Mock approval failure result */
export const MOCK_APPROVAL_FAILURE: ExecutionResult = {
  success: false,
  actionId: 'action_mock_456',
  status: 'failed',
  error: 'Failed to create work item: Name already exists in workspace',
  duration: 123,
};

// =============================================================================
// MOCK DATA - ROLLBACK RESULTS
// =============================================================================

/** Mock rollback success result */
export const MOCK_ROLLBACK_SUCCESS: ExecutionResult = {
  success: true,
  actionId: 'action_mock_123',
  status: 'rolled_back',
  result: {
    deletedEntity: 'wi_created_123',
    message: 'Work item successfully deleted',
  },
  duration: 156,
};

/** Mock rollback failure result */
export const MOCK_ROLLBACK_FAILURE: ExecutionResult = {
  success: false,
  actionId: 'action_mock_789',
  status: 'failed',
  error: 'Cannot rollback: Entity has been modified since creation',
  duration: 89,
};

// =============================================================================
// MOCK DATA - ACTION HISTORY
// =============================================================================

/** Mock action history items */
export const MOCK_ACTION_HISTORY: AIActionHistory[] = [
  {
    id: 'action_hist_1',
    team_id: 'team_mock_123',
    workspace_id: 'ws_mock_123',
    user_id: 'user_mock_123',
    session_id: 'session_mock_123',
    tool_name: 'createWorkItem',
    tool_category: 'creation',
    action_type: 'create',
    input_params: {
      name: 'Dark Mode Support',
      type: 'feature',
      priority: 'medium',
    },
    output_result: {
      id: 'wi_dark_mode',
      name: 'Dark Mode Support',
    },
    affected_items: [
      { id: 'wi_dark_mode', type: 'work_item', name: 'Dark Mode Support', change: 'create' },
    ],
    rollback_data: { entityId: 'wi_dark_mode', operation: 'create' },
    is_reversible: true,
    rolled_back_at: null,
    status: 'completed',
    error_message: null,
    execution_started_at: new Date(Date.now() - 5000).toISOString(),
    execution_completed_at: new Date(Date.now() - 4800).toISOString(),
    execution_duration_ms: 200,
    tokens_used: 150,
    cost_usd: 0.0003,
    model_used: 'kimi-k2',
    created_at: new Date(Date.now() - 5000).toISOString(),
    updated_at: new Date(Date.now() - 4800).toISOString(),
    approved_at: new Date(Date.now() - 5000).toISOString(),
    approved_by: 'user_mock_123',
  },
  {
    id: 'action_hist_2',
    team_id: 'team_mock_123',
    workspace_id: 'ws_mock_123',
    user_id: 'user_mock_123',
    session_id: 'session_mock_123',
    tool_name: 'analyzeFeedback',
    tool_category: 'analysis',
    action_type: 'analyze',
    input_params: {
      scope: 'workspace',
      timeRange: 'last_7_days',
    },
    output_result: {
      sentiment: 'positive',
      topThemes: ['usability', 'performance', 'features'],
      feedbackCount: 42,
    },
    affected_items: [],
    rollback_data: null,
    is_reversible: false,
    rolled_back_at: null,
    status: 'completed',
    error_message: null,
    execution_started_at: new Date(Date.now() - 60000).toISOString(),
    execution_completed_at: new Date(Date.now() - 58000).toISOString(),
    execution_duration_ms: 2000,
    tokens_used: 350,
    cost_usd: 0.0007,
    model_used: 'glm-4-7',
    created_at: new Date(Date.now() - 60000).toISOString(),
    updated_at: new Date(Date.now() - 58000).toISOString(),
    approved_at: null,
    approved_by: null,
  },
  {
    id: 'action_hist_3',
    team_id: 'team_mock_123',
    workspace_id: 'ws_mock_123',
    user_id: 'user_mock_123',
    session_id: 'session_mock_456',
    tool_name: 'createTask',
    tool_category: 'creation',
    action_type: 'create',
    input_params: {
      name: 'Implement login form',
      workItemId: 'wi_auth_123',
    },
    output_result: null,
    affected_items: [],
    rollback_data: null,
    is_reversible: true,
    rolled_back_at: null,
    status: 'pending',
    error_message: null,
    execution_started_at: null,
    execution_completed_at: null,
    execution_duration_ms: null,
    tokens_used: 0,
    cost_usd: 0,
    model_used: null,
    created_at: new Date(Date.now() - 1000).toISOString(),
    updated_at: new Date(Date.now() - 1000).toISOString(),
    approved_at: null,
    approved_by: null,
  },
];

// =============================================================================
// MOCK DATA - AGENTIC PLANS
// =============================================================================

/** Mock task plan for multi-step execution */
export const MOCK_TASK_PLAN: TaskPlan = {
  id: 'plan_mock_123',
  goal: 'Create authentication feature with supporting tasks',
  steps: [
    {
      id: 'step_1',
      order: 1,
      description: 'Create work item for user authentication',
      toolName: 'createWorkItem',
      params: {
        name: 'User Authentication',
        type: 'feature',
        priority: 'high',
      },
      dependsOn: [],
      status: 'pending',
    },
    {
      id: 'step_2',
      order: 2,
      description: 'Create login form task',
      toolName: 'createTask',
      params: {
        name: 'Implement login form',
        workItemId: 'TBD',
      },
      dependsOn: ['step_1'],
      status: 'pending',
    },
    {
      id: 'step_3',
      order: 3,
      description: 'Create password reset task',
      toolName: 'createTask',
      params: {
        name: 'Implement password reset',
        workItemId: 'TBD',
      },
      dependsOn: ['step_1'],
      status: 'pending',
    },
    {
      id: 'step_4',
      order: 4,
      description: 'Analyze existing auth patterns',
      toolName: 'webSearch',
      params: {
        query: 'authentication best practices 2025',
      },
      dependsOn: [],
      status: 'pending',
    },
  ],
  estimatedDuration: 'medium',
  requiresApproval: true,
  createdAt: Date.now(),
  status: 'draft',
};

/** Mock task plan - in progress */
export const MOCK_TASK_PLAN_IN_PROGRESS: TaskPlan = {
  ...MOCK_TASK_PLAN,
  id: 'plan_mock_456',
  status: 'executing',
  steps: [
    { ...MOCK_TASK_PLAN.steps[0], status: 'completed', result: { id: 'wi_auth_created' } },
    { ...MOCK_TASK_PLAN.steps[1], status: 'running' },
    { ...MOCK_TASK_PLAN.steps[2], status: 'pending' },
    { ...MOCK_TASK_PLAN.steps[3], status: 'completed', result: { results: ['url1', 'url2'] } },
  ],
};

/** Mock task plan - completed */
export const MOCK_TASK_PLAN_COMPLETED: TaskPlan = {
  ...MOCK_TASK_PLAN,
  id: 'plan_mock_789',
  status: 'completed',
  summary: 'Successfully created authentication feature with 2 tasks',
  steps: MOCK_TASK_PLAN.steps.map((step) => ({
    ...step,
    status: 'completed' as const,
    result: { id: `result_${step.id}` },
  })),
};

// =============================================================================
// MOCK DATA - TOOL SUGGESTIONS
// =============================================================================

/** Mock tool suggestions */
export const MOCK_TOOL_SUGGESTIONS = {
  success: true,
  suggestions: [
    {
      toolName: 'createWorkItem',
      displayName: 'Create Work Item',
      description: 'Create a new feature, bug, or enhancement',
      category: 'creation' as ToolCategory,
      confidence: 92,
      params: { type: 'feature' },
    },
    {
      toolName: 'analyzeFeedback',
      displayName: 'Analyze Feedback',
      description: 'Analyze user feedback to identify trends',
      category: 'analysis' as ToolCategory,
      confidence: 78,
    },
    {
      toolName: 'suggestDependencies',
      displayName: 'Suggest Dependencies',
      description: 'Get AI suggestions for work item dependencies',
      category: 'strategy' as ToolCategory,
      confidence: 65,
    },
  ],
};

// =============================================================================
// HELPER FUNCTIONS - ROUTE MOCKING
// =============================================================================

/**
 * Mock all AI API routes
 *
 * Intercepts:
 * - POST /api/ai/chat - Chat messages
 * - POST /api/ai/agent/preview - Tool previews
 * - POST /api/ai/agent/approve - Tool approvals
 * - POST /api/ai/agent/rollback - Rollback actions
 * - GET /api/ai/agent/history - Action history
 * - POST /api/ai/agent/plan - Create plan
 * - POST /api/ai/agent/execute - Execute plan
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await mockAIRoutes(page);
 * });
 * ```
 */
export async function mockAIRoutes(page: Page): Promise<void> {
  // Mock chat endpoint
  await page.route('**/api/ai/chat', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CHAT_REPLY),
    });
  });

  // Mock streaming chat endpoint
  await page.route('**/api/ai/chat/stream', (route) => {
    const chunks = MOCK_STREAM_CHUNKS.map((chunk) => JSON.stringify(chunk)).join('\n');
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: chunks,
    });
  });

  // Mock tool preview endpoint
  await page.route('**/api/ai/agent/preview', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TOOL_PREVIEW_CREATE_WORK_ITEM),
    });
  });

  // Mock tool approval endpoint
  await page.route('**/api/ai/agent/approve', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_APPROVAL_SUCCESS),
    });
  });

  // Mock rollback endpoint
  await page.route('**/api/ai/agent/rollback', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ROLLBACK_SUCCESS),
    });
  });

  // Mock action history endpoint
  await page.route('**/api/ai/agent/history**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        history: MOCK_ACTION_HISTORY,
        total: MOCK_ACTION_HISTORY.length,
      }),
    });
  });

  // Mock tool suggestions endpoint
  await page.route('**/api/ai/agent/suggest', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TOOL_SUGGESTIONS),
    });
  });

  // Mock plan creation endpoint
  await page.route('**/api/ai/agent/plan', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        plan: MOCK_TASK_PLAN,
      }),
    });
  });

  // Mock plan execution endpoint
  await page.route('**/api/ai/agent/execute', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        result: {
          completedSteps: 4,
          totalSteps: 4,
          executionTime: 3500,
          plan: MOCK_TASK_PLAN_COMPLETED,
        },
      }),
    });
  });
}

/**
 * Mock chat route with a specific response
 *
 * @param page - Playwright page object
 * @param response - Custom chat response
 *
 * @example
 * ```typescript
 * await mockChatRoute(page, {
 *   success: true,
 *   message: { role: 'assistant', content: 'Custom response' },
 *   sessionId: 'test_session',
 * });
 * ```
 */
export async function mockChatRoute(page: Page, response: ChatResponse): Promise<void> {
  await page.route('**/api/ai/chat', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock chat route with streaming response
 *
 * @param page - Playwright page object
 * @param chunks - Array of stream chunks
 *
 * @example
 * ```typescript
 * await mockChatStreamRoute(page, [
 *   { type: 'text', content: 'Hello ' },
 *   { type: 'text', content: 'world!' },
 *   { type: 'done' },
 * ]);
 * ```
 */
export async function mockChatStreamRoute(page: Page, chunks: StreamChunk[]): Promise<void> {
  await page.route('**/api/ai/chat/stream', (route) => {
    const body = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('');
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body,
    });
  });
}

/**
 * Mock agentic tool execution routes
 *
 * Provides more granular control over agent-specific endpoints.
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * await mockAgentRoutes(page, {
 *   approvalSuccess: true,
 *   rollbackSuccess: false,
 *   customPlan: myCustomPlan,
 * });
 * ```
 */
export async function mockAgentRoutes(
  page: Page,
  options: {
    approvalSuccess?: boolean;
    rollbackSuccess?: boolean;
    customPreview?: ToolExecutionResponse;
    customHistory?: AIActionHistory[];
    customPlan?: TaskPlan;
  } = {}
): Promise<void> {
  const {
    approvalSuccess = true,
    rollbackSuccess = true,
    customPreview = MOCK_TOOL_PREVIEW_CREATE_WORK_ITEM,
    customHistory = MOCK_ACTION_HISTORY,
    customPlan = MOCK_TASK_PLAN,
  } = options;

  // Mock preview
  await page.route('**/api/ai/agent/preview', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(customPreview),
    });
  });

  // Mock approval
  await page.route('**/api/ai/agent/approve', (route) => {
    const response = approvalSuccess ? MOCK_APPROVAL_SUCCESS : MOCK_APPROVAL_FAILURE;
    route.fulfill({
      status: approvalSuccess ? 200 : 400,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  // Mock rollback
  await page.route('**/api/ai/agent/rollback', (route) => {
    const response = rollbackSuccess ? MOCK_ROLLBACK_SUCCESS : MOCK_ROLLBACK_FAILURE;
    route.fulfill({
      status: rollbackSuccess ? 200 : 400,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  // Mock history
  await page.route('**/api/ai/agent/history**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        history: customHistory,
        total: customHistory.length,
      }),
    });
  });

  // Mock plan creation
  await page.route('**/api/ai/agent/plan', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        plan: customPlan,
      }),
    });
  });
}

/**
 * Mock a tool preview for a specific tool
 *
 * @param page - Playwright page object
 * @param toolName - Name of the tool to mock
 * @param preview - Custom preview data
 *
 * @example
 * ```typescript
 * await mockToolPreview(page, 'analyzeFeedback', {
 *   requiresApproval: false,
 *   preview: { action: 'analyze', entityType: 'feedback', ... },
 *   toolCallId: 'test_123',
 * });
 * ```
 */
export async function mockToolPreview(
  page: Page,
  toolName: string,
  preview: ToolExecutionResponse
): Promise<void> {
  await page.route(`**/api/ai/agent/preview**${toolName}**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(preview),
    });
  });

  // Also handle POST requests with tool name in body
  await page.route('**/api/ai/agent/preview', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.toolName === toolName) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(preview),
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock AI route with error response
 *
 * @param page - Playwright page object
 * @param route - Route pattern to match
 * @param statusCode - HTTP status code
 * @param errorMessage - Error message to return
 *
 * @example
 * ```typescript
 * await mockAIRouteError(page, '** /api/ai/chat', 500, 'AI service unavailable');
 * // Note: Use ** /api pattern (without space) in actual code
 * ```
 */
export async function mockAIRouteError(
  page: Page,
  routePattern: string,
  statusCode: number,
  errorMessage: string
): Promise<void> {
  await page.route(routePattern, (route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    });
  });
}

/**
 * Mock rate limiting response
 *
 * @param page - Playwright page object
 * @param routePattern - Route pattern to match
 * @param retryAfter - Seconds until retry is allowed
 *
 * @example
 * ```typescript
 * await mockRateLimitResponse(page, '** /api/ai/** ', 60);
 * // Note: Use ** patterns without spaces in actual code
 * ```
 */
export async function mockRateLimitResponse(
  page: Page,
  routePattern: string,
  retryAfter: number = 60
): Promise<void> {
  await page.route(routePattern, (route) => {
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: {
        'Retry-After': retryAfter.toString(),
      },
      body: JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter,
      }),
    });
  });
}

// =============================================================================
// HELPER FUNCTIONS - DATA GENERATORS
// =============================================================================

/**
 * Generate a mock work item creation preview
 *
 * @param overrides - Partial data to override defaults
 * @returns Tool execution response for work item creation
 */
export function generateWorkItemPreview(
  overrides: Partial<{
    name: string;
    type: 'concept' | 'feature' | 'bug' | 'enhancement';
    priority: 'critical' | 'high' | 'medium' | 'low';
    purpose: string;
  }> = {}
): ToolExecutionResponse {
  const { name = 'New Work Item', type = 'feature', priority = 'medium', purpose = 'Auto-generated work item' } = overrides;

  return {
    requiresApproval: true,
    preview: {
      action: 'create',
      entityType: 'work_item',
      data: { name, type, priority, purpose },
      description: `Create a new ${priority}-priority ${type} work item: "${name}"`,
      affectedItems: [
        { id: `wi_${Date.now()}`, type: 'work_item', name, change: 'create' },
      ],
      estimatedDuration: 'fast',
    },
    toolCallId: `tool_${Date.now()}`,
  };
}

/**
 * Generate a mock action history item
 *
 * @param overrides - Partial data to override defaults
 * @returns Action history record
 */
export function generateActionHistory(
  overrides: Partial<AIActionHistory> = {}
): AIActionHistory {
  const now = new Date().toISOString();
  const id = `action_${Date.now()}`;

  return {
    id,
    team_id: 'team_test',
    workspace_id: 'ws_test',
    user_id: 'user_test',
    session_id: 'session_test',
    tool_name: 'createWorkItem',
    tool_category: 'creation',
    action_type: 'create',
    input_params: {},
    output_result: null,
    affected_items: [],
    rollback_data: null,
    is_reversible: true,
    rolled_back_at: null,
    status: 'completed',
    error_message: null,
    execution_started_at: now,
    execution_completed_at: now,
    execution_duration_ms: 150,
    tokens_used: 100,
    cost_usd: 0.0002,
    model_used: 'kimi-k2',
    created_at: now,
    updated_at: now,
    approved_at: now,
    approved_by: 'user_test',
    ...overrides,
  };
}

/**
 * Generate a mock task plan
 *
 * @param goal - The plan goal
 * @param stepCount - Number of steps to generate
 * @returns Task plan
 */
export function generateTaskPlan(goal: string, stepCount: number = 3): TaskPlan {
  const steps: TaskStep[] = [];
  const tools = ['createWorkItem', 'createTask', 'analyzeFeedback', 'webSearch', 'suggestDependencies'];

  for (let i = 0; i < stepCount; i++) {
    steps.push({
      id: `step_${i + 1}`,
      order: i + 1,
      description: `Step ${i + 1}: ${tools[i % tools.length]}`,
      toolName: tools[i % tools.length],
      params: { index: i },
      dependsOn: i > 0 ? [`step_${i}`] : [],
      status: 'pending',
    });
  }

  return {
    id: `plan_${Date.now()}`,
    goal,
    steps,
    estimatedDuration: stepCount <= 3 ? 'fast' : stepCount <= 6 ? 'medium' : 'slow',
    requiresApproval: true,
    createdAt: Date.now(),
    status: 'draft',
  };
}

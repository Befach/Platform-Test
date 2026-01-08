/**
 * Agent Executor for Agentic AI Mode
 *
 * Central execution engine for AI tools with approval workflow.
 *
 * Responsibilities:
 * - Preview tool actions before execution
 * - Execute tools (with or without approval)
 * - Approve pending actions and run them
 * - Rollback completed actions (for reversible tools)
 * - Track execution history in ai_action_history table
 *
 * Workflow:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  User Request → Tool Selection → Preview Generation          │
 * │       ↓                                                      │
 * │  If requiresApproval:                                        │
 * │    → Create pending record → Wait for approve() → Execute    │
 * │  Else:                                                       │
 * │    → Execute directly → Record completed action              │
 * │       ↓                                                      │
 * │  If reversible: Store rollback data for undo support         │
 * └─────────────────────────────────────────────────────────────┘
 */

import { createClient } from '@/lib/supabase/server'
import { toolRegistry, type AgenticTool } from './tools/tool-registry'
import type { ActionStatus, ActionPreview } from './schemas/agentic-schemas'
import { getDefaultPhaseForType } from '@/lib/constants/workspace-phases'
import type { WorkItemType } from '@/lib/constants/workspace-phases'

// ============================================================================
// IMPORTANT: Import all tool files to trigger registration with toolRegistry
// ============================================================================
// These side-effect imports cause the tool registration to run.
// Without these imports, toolRegistry would be empty when the API routes load.
// Using bare imports (not `import * as`) to prevent tree-shaking from removing them.
import './tools/creation-tools'
import './tools/analysis-tools'
import './tools/optimization-tools'
import './tools/strategy-tools'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Interface for tools that have an execute function
 * Used for type-safe tool execution without `as any` casts
 */
interface ExecutableTool {
  execute: (
    params: Record<string, unknown>,
    context: { toolCallId: string; abortSignal: AbortSignal }
  ) => Promise<unknown>
}

/**
 * Safely execute a tool with runtime validation
 * Returns the execute function if available, throws if not
 *
 * This provides type-safe access to the execute function that exists
 * on AI SDK tools at runtime but isn't part of the AgenticTool type.
 */
function getToolExecutor(tool: AgenticTool, toolName: string): ExecutableTool['execute'] {
  // Runtime check for execute function (exists on AI SDK tools)
  const toolWithExecute = tool as unknown as ExecutableTool
  if (typeof toolWithExecute.execute !== 'function') {
    throw new Error(`Tool ${toolName} does not have an execute function`)
  }
  return toolWithExecute.execute.bind(toolWithExecute)
}

/**
 * Context for tool execution
 */
export interface ExecutionContext {
  teamId: string;
  workspaceId: string;
  userId: string;
  sessionId: string;
  actionId?: string;
}

/**
 * Preview result from a tool
 */
export interface PreviewResult {
  toolName: string;
  displayName: string;
  category: string;
  requiresApproval: boolean;
  isReversible: boolean;
  preview: {
    requiresApproval: boolean;
    preview: ActionPreview;
    toolCallId: string;
  };
}

/**
 * Result of executing or approving an action
 */
export interface AgentExecutionResult {
  success: boolean;
  actionId: string;
  status: ActionStatus;
  result?: unknown;
  error?: string;
  duration?: number;
}

/**
 * Action record from database
 */
interface ActionRecord {
  id: string;
  team_id: string;
  workspace_id: string;
  user_id: string;
  session_id: string;
  tool_name: string;
  tool_category: string;
  action_type: string;
  input_params: Record<string, unknown>;
  output_result: Record<string, unknown> | null;
  affected_items: Array<{
    id: string;
    type: string;
    name?: string;
    change: string;
  }> | null;
  rollback_data: Record<string, unknown> | null;
  is_reversible: boolean;
  status: ActionStatus;
  error_message: string | null;
  execution_started_at: string | null;
  execution_completed_at: string | null;
  execution_duration_ms: number | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

// =============================================================================
// AGENT EXECUTOR CLASS
// =============================================================================

/**
 * Agent Executor - handles tool execution with approval workflow
 *
 * @example
 * ```typescript
 * const result = await agentExecutor.preview('createWorkItem', params, context)
 * // Show preview to user
 *
 * // If approved:
 * const execution = await agentExecutor.execute('createWorkItem', params, context)
 *
 * // For pending actions:
 * const approval = await agentExecutor.approve(actionId, userId)
 *
 * // To undo:
 * const rollback = await agentExecutor.rollback(actionId, context)
 * ```
 */
export class AgentExecutor {
  // ===========================================================================
  // PREVIEW
  // ===========================================================================

  /**
   * Get a preview of what a tool will do without executing
   *
   * This is Step 1 of the approval workflow:
   * 1. User requests action
   * 2. Preview shows what will happen
   * 3. User approves or rejects
   */
  async preview(
    toolName: string,
    params: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<PreviewResult> {
    const tool = toolRegistry.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const actionId = context.actionId || Date.now().toString();

    // Execute tool to get preview (no DB changes in tools)
    // Type-safe execution with runtime validation
    const executePreview = getToolExecutor(tool, toolName);
    const result = await executePreview(params, {
      toolCallId: actionId,
      abortSignal: new AbortController().signal,
    });

    return {
      toolName,
      displayName: tool.metadata.displayName,
      category: tool.metadata.category,
      requiresApproval: tool.metadata.requiresApproval,
      isReversible: tool.metadata.isReversible,
      preview: result as PreviewResult["preview"],
    };
  }

  // ===========================================================================
  // EXECUTE
  // ===========================================================================

  /**
   * Execute a tool with approval workflow
   *
   * For tools requiring approval:
   * - Creates a pending record in ai_action_history
   * - Returns status: 'pending'
   * - User must call approve() to complete
   *
   * For tools not requiring approval:
   * - Executes immediately
   * - Records completed action
   * - Returns status: 'completed'
   */
  async execute(
    toolName: string,
    params: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<AgentExecutionResult> {
    const supabase = await createClient();
    const tool = toolRegistry.get(toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const actionId = context.actionId || Date.now().toString();

    try {
      // If tool requires approval, create pending record
      if (tool.metadata.requiresApproval) {
        // Get preview for the pending record
        const preview = await this.preview(toolName, params, {
          ...context,
          actionId,
        });

        const { error: insertError } = await supabase
          .from("ai_action_history")
          .insert({
            id: actionId,
            team_id: context.teamId,
            workspace_id: context.workspaceId,
            user_id: context.userId,
            session_id: context.sessionId,
            tool_name: toolName,
            tool_category: tool.metadata.category,
            action_type: tool.metadata.actionType,
            input_params: params,
            affected_items: preview.preview.preview.affectedItems || [],
            is_reversible: tool.metadata.isReversible,
            status: "pending",
          });

        if (insertError) {
          throw new Error(
            `Failed to create pending action: ${insertError.message}`,
          );
        }

        return {
          success: true,
          actionId,
          status: "pending",
        };
      }

      // Execute directly for non-approval tools
      const startTime = Date.now();
      const result = await this.executeToolAction(
        toolName,
        params,
        context,
        tool,
      );
      const duration = Date.now() - startTime;

      // Record completed action
      const { error: insertError } = await supabase
        .from("ai_action_history")
        .insert({
          id: actionId,
          team_id: context.teamId,
          workspace_id: context.workspaceId,
          user_id: context.userId,
          session_id: context.sessionId,
          tool_name: toolName,
          tool_category: tool.metadata.category,
          action_type: tool.metadata.actionType,
          input_params: params,
          output_result: result.result || null,
          affected_items: result.affectedItems || [],
          rollback_data: result.rollbackData || null,
          is_reversible: tool.metadata.isReversible,
          status: "completed",
          execution_started_at: new Date(startTime).toISOString(),
          execution_completed_at: new Date().toISOString(),
          execution_duration_ms: duration,
        });

      if (insertError) {
        console.error("[AgentExecutor] Failed to record action:", insertError);
      }

      return {
        success: true,
        actionId,
        status: "completed",
        result: result.result,
        duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Record failed action (ignore insert errors to avoid nested failures)
      try {
        await supabase.from("ai_action_history").insert({
          id: actionId,
          team_id: context.teamId,
          workspace_id: context.workspaceId,
          user_id: context.userId,
          session_id: context.sessionId,
          tool_name: toolName,
          tool_category: tool.metadata.category,
          action_type: tool.metadata.actionType,
          input_params: params,
          is_reversible: false,
          status: "failed",
          error_message: errorMessage,
        });
      } catch {
        // Silently fail recording to avoid nested failures
      }

      return {
        success: false,
        actionId,
        status: "failed",
        error: errorMessage,
      };
    }
  }

  // ===========================================================================
  // APPROVE
  // ===========================================================================

  /**
   * Approve and execute a pending action
   *
   * This completes the approval workflow:
   * 1. Validates action exists and is pending
   * 2. Updates status to 'executing'
   * 3. Runs the actual tool action
   * 4. Updates status to 'completed' or 'failed'
   */
  async approve(
    actionId: string,
    userId: string,
  ): Promise<AgentExecutionResult> {
    const supabase = await createClient();

    // Get pending action
    const { data: action, error: fetchError } = (await supabase
      .from("ai_action_history")
      .select("*")
      .eq("id", actionId)
      .eq("status", "pending")
      .single()) as { data: ActionRecord | null; error: Error | null };

    if (fetchError || !action) {
      throw new Error("Action not found or already processed");
    }

    // Update to executing
    const { error: updateError } = await supabase
      .from("ai_action_history")
      .update({
        status: "executing",
        approved_at: new Date().toISOString(),
        approved_by: userId,
        execution_started_at: new Date().toISOString(),
      })
      .eq("id", actionId);

    if (updateError) {
      throw new Error(`Failed to approve action: ${updateError.message}`);
    }

    const tool = toolRegistry.get(action.tool_name);
    if (!tool) {
      // Mark as failed
      await supabase
        .from("ai_action_history")
        .update({
          status: "failed",
          error_message: `Tool not found: ${action.tool_name}`,
        })
        .eq("id", actionId);

      throw new Error(`Tool not found: ${action.tool_name}`);
    }

    try {
      // Execute the actual tool action
      const startTime = Date.now();
      const result = await this.executeToolAction(
        action.tool_name,
        action.input_params,
        {
          teamId: action.team_id,
          workspaceId: action.workspace_id,
          userId: action.user_id,
          sessionId: action.session_id,
          actionId,
        },
        tool,
      );
      const duration = Date.now() - startTime;

      // Update with result
      await supabase
        .from("ai_action_history")
        .update({
          status: "completed",
          output_result: result.result || null,
          affected_items: result.affectedItems || action.affected_items,
          rollback_data: result.rollbackData || null,
          execution_completed_at: new Date().toISOString(),
          execution_duration_ms: duration,
        })
        .eq("id", actionId);

      return {
        success: true,
        actionId,
        status: "completed",
        result: result.result,
        duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await supabase
        .from("ai_action_history")
        .update({
          status: "failed",
          error_message: errorMessage,
          execution_completed_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      return {
        success: false,
        actionId,
        status: "failed",
        error: errorMessage,
      };
    }
  }

  // ===========================================================================
  // CANCEL
  // ===========================================================================

  /**
   * Cancel a pending action
   */
  async cancel(actionId: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("ai_action_history")
      .update({ status: "cancelled" })
      .eq("id", actionId)
      .eq("status", "pending");

    return !error;
  }

  // ===========================================================================
  // ROLLBACK
  // ===========================================================================

  /**
   * Rollback a completed action (undo)
   *
   * Only works for reversible actions that have rollback_data stored.
   * Creates appropriate reverse operations based on action type.
   */
  async rollback(
    actionId: string,
    _context: ExecutionContext,
  ): Promise<boolean> {
    const supabase = await createClient();

    // Get action
    const { data: action, error: fetchError } = (await supabase
      .from("ai_action_history")
      .select("*")
      .eq("id", actionId)
      .eq("status", "completed")
      .single()) as { data: ActionRecord | null; error: Error | null };

    if (fetchError || !action) {
      console.error("[AgentExecutor] Action not found for rollback:", actionId);
      return false;
    }

    if (!action.is_reversible) {
      console.error("[AgentExecutor] Action is not reversible:", actionId);
      return false;
    }

    try {
      // Execute rollback based on action type
      await this.executeRollback(action);

      // Update status
      await supabase
        .from("ai_action_history")
        .update({
          status: "rolled_back",
          rolled_back_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      return true;
    } catch (error) {
      console.error("[AgentExecutor] Rollback failed:", error);
      return false;
    }
  }

  // ===========================================================================
  // BATCH OPERATIONS
  // ===========================================================================

  /**
   * Approve multiple actions at once
   */
  async approveAll(
    actionIds: string[],
    userId: string,
  ): Promise<{
    approved: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = {
      approved: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    for (const actionId of actionIds) {
      try {
        await this.approve(actionId, userId);
        results.approved.push(actionId);
      } catch (error) {
        results.failed.push({
          id: actionId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Cancel multiple pending actions
   */
  async cancelAll(actionIds: string[]): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("ai_action_history")
      .update({ status: "cancelled" })
      .in("id", actionIds)
      .eq("status", "pending");

    return error ? 0 : count || 0;
  }

  // ===========================================================================
  // PRIVATE: TOOL ACTION EXECUTION
  // ===========================================================================

  /**
   * Execute the actual database operation for a tool
   *
   * This is where real database changes happen.
   * Each tool type has specific execution logic.
   */
  private async executeToolAction(
    toolName: string,
    params: Record<string, unknown>,
    context: ExecutionContext,
    _tool: AgenticTool,
  ): Promise<{
    result?: unknown;
    affectedItems?: Array<{
      id: string;
      type: string;
      name?: string;
      change: string;
    }>;
    rollbackData?: Record<string, unknown>;
  }> {
    const supabase = await createClient();

    switch (toolName) {
      // =========== CREATION TOOLS ===========
      case "createWorkItem": {
        const id = Date.now().toString();
        const { data, error } = await supabase
          .from("work_items")
          .insert({
            id,
            team_id: context.teamId,
            workspace_id: context.workspaceId,
            name: params.name as string,
            type: params.type as string,
            purpose: params.purpose as string | null,
            priority: params.priority as string | null,
            tags: params.tags as string[] | null,
            phase: (params.phase as string) || getDefaultPhaseForType((params.type as WorkItemType) || 'feature'),
            created_by: context.userId,
          })
          .select()
          .single();

        if (error)
          throw new Error(`Failed to create work item: ${error.message}`);

        return {
          result: { created: data },
          affectedItems: [
            { id, type: "work_item", name: data.name, change: "create" },
          ],
          rollbackData: { entityId: id, entityType: "work_item" },
        };
      }

      case "createTask": {
        const id = Date.now().toString();
        const { data, error } = await supabase
          .from("product_tasks")
          .insert({
            id,
            team_id: context.teamId,
            workspace_id: context.workspaceId,
            work_item_id: params.workItemId as string,
            name: params.name as string,
            description: params.description as string | null,
            priority: params.priority as string | null,
            assignee_id: params.assigneeId as string | null,
            due_date: params.dueDate as string | null,
            status: "todo",
          })
          .select()
          .single();

        if (error) throw new Error(`Failed to create task: ${error.message}`);

        return {
          result: { created: data },
          affectedItems: [
            { id, type: "product_task", name: data.name, change: "create" },
            {
              id: params.workItemId as string,
              type: "work_item",
              change: "update",
            },
          ],
          rollbackData: { entityId: id, entityType: "product_task" },
        };
      }

      case "createDependency": {
        const id = Date.now().toString();
        const { data, error } = await supabase
          .from("linked_items")
          .insert({
            id,
            team_id: context.teamId,
            workspace_id: context.workspaceId,
            source_id: params.sourceId as string,
            target_id: params.targetId as string,
            connection_type: params.connectionType as string,
            reason: params.reason as string | null,
            strength: (params.strength as number) || 0.7,
          })
          .select()
          .single();

        if (error)
          throw new Error(`Failed to create dependency: ${error.message}`);

        return {
          result: { created: data },
          affectedItems: [
            { id, type: "linked_item", change: "create" },
            {
              id: params.sourceId as string,
              type: "work_item",
              change: "update",
            },
            {
              id: params.targetId as string,
              type: "work_item",
              change: "update",
            },
          ],
          rollbackData: { entityId: id, entityType: "linked_item" },
        };
      }

      case "createTimelineItem": {
        const id = Date.now().toString();
        const { data, error } = await supabase
          .from("timeline_items")
          .insert({
            id,
            team_id: context.teamId,
            workspace_id: context.workspaceId,
            work_item_id: params.workItemId as string,
            name: params.name as string,
            timeframe: params.timeframe as string,
            description: params.description as string | null,
            priority: (params.priority as number) || 50,
          })
          .select()
          .single();

        if (error)
          throw new Error(`Failed to create timeline item: ${error.message}`);

        return {
          result: { created: data },
          affectedItems: [
            { id, type: "timeline_item", name: data.name, change: "create" },
            {
              id: params.workItemId as string,
              type: "work_item",
              change: "update",
            },
          ],
          rollbackData: { entityId: id, entityType: "timeline_item" },
        };
      }

      case "createInsight": {
        const id = Date.now().toString();
        const { data, error } = await supabase
          .from("insights")
          .insert({
            id,
            team_id: context.teamId,
            workspace_id: context.workspaceId,
            title: params.title as string,
            content: params.content as string,
            source: params.source as string | null,
            sentiment: params.sentiment as string | null,
            tags: params.tags as string[] | null,
            linked_work_item_id: params.linkedWorkItemId as string | null,
          })
          .select()
          .single();

        if (error)
          throw new Error(`Failed to create insight: ${error.message}`);

        const affectedItems: Array<{
          id: string;
          type: string;
          name?: string;
          change: string;
        }> = [{ id, type: "insight", name: data.title, change: "create" }];

        if (params.linkedWorkItemId) {
          affectedItems.push({
            id: params.linkedWorkItemId as string,
            type: "work_item",
            change: "update",
          });
        }

        return {
          result: { created: data },
          affectedItems,
          rollbackData: { entityId: id, entityType: "insight" },
        };
      }

      // =========== ANALYSIS TOOLS ===========
      // Analysis tools return results directly without DB changes
      case "analyzeFeedback":
      case "suggestDependencies":
      case "findGaps":
      case "summarizeWorkItem":
      case "extractRequirements": {
        // Analysis tools execute through their own execute function
        const analysisTool = toolRegistry.get(toolName);
        if (!analysisTool) throw new Error(`Tool not found: ${toolName}`);

        // Type-safe execution with runtime validation
        const executeAnalysis = getToolExecutor(analysisTool, toolName);
        const result = await executeAnalysis(params, {
          toolCallId: context.actionId || Date.now().toString(),
          abortSignal: new AbortController().signal,
        });

        return { result };
      }

      // =========== OPTIMIZATION TOOLS ===========
      // Optimization tools analyze data and return recommendations
      case "prioritizeFeatures":
      case "balanceWorkload":
      case "identifyRisks":
      case "suggestTimeline":
      case "deduplicateItems": {
        const optimizationTool = toolRegistry.get(toolName);
        if (!optimizationTool) throw new Error(`Tool not found: ${toolName}`);

        // Type-safe execution with runtime validation
        const executeOptimization = getToolExecutor(optimizationTool, toolName);
        const result = await executeOptimization(params, {
          toolCallId: context.actionId || Date.now().toString(),
          abortSignal: new AbortController().signal,
        });

        return { result };
      }

      // =========== STRATEGY TOOLS ===========
      // Strategy tools provide strategic analysis and recommendations
      case "alignToStrategy":
      case "suggestOKRs":
      case "competitiveAnalysis":
      case "roadmapGenerator":
      case "impactAssessment": {
        const strategyTool = toolRegistry.get(toolName);
        if (!strategyTool) throw new Error(`Tool not found: ${toolName}`);

        // Type-safe execution with runtime validation
        const executeStrategy = getToolExecutor(strategyTool, toolName);
        const result = await executeStrategy(params, {
          toolCallId: context.actionId || Date.now().toString(),
          abortSignal: new AbortController().signal,
        });

        return { result };
      }

      default:
        throw new Error(`Execution not implemented for tool: ${toolName}`);
    }
  }

  // ===========================================================================
  // PRIVATE: ROLLBACK EXECUTION
  // ===========================================================================

  /**
   * Execute rollback based on action type and stored rollback data
   */
  private async executeRollback(action: ActionRecord): Promise<void> {
    const supabase = await createClient();
    const rollbackData = action.rollback_data;

    if (!rollbackData || !rollbackData.entityId || !rollbackData.entityType) {
      throw new Error("No rollback data available");
    }

    const entityId = rollbackData.entityId as string;
    const entityType = rollbackData.entityType as string;

    // Map entity types to table names
    const tableMap: Record<string, string> = {
      work_item: "work_items",
      product_task: "product_tasks",
      linked_item: "linked_items",
      timeline_item: "timeline_items",
      insight: "insights",
    };

    const tableName = tableMap[entityType];
    if (!tableName) {
      throw new Error(`Unknown entity type for rollback: ${entityType}`);
    }

    // For create actions, delete the created entity
    if (action.action_type === "create") {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", entityId);
      if (error) throw new Error(`Rollback failed: ${error.message}`);
    }

    // For update actions, restore previous data
    if (action.action_type === "update" && rollbackData.previousData) {
      const { error } = await supabase
        .from(tableName)
        .update(rollbackData.previousData as Record<string, unknown>)
        .eq("id", entityId);
      if (error) throw new Error(`Rollback failed: ${error.message}`);
    }

    // Delete actions cannot be rolled back (would need to recreate)
    // This is enforced by is_reversible=false for delete tools
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global agent executor instance
 *
 * Usage:
 * ```typescript
 * import { agentExecutor } from '@/lib/ai/agent-executor'
 *
 * // Preview an action
 * const preview = await agentExecutor.preview('createWorkItem', params, context)
 *
 * // Execute (creates pending record if approval required)
 * const result = await agentExecutor.execute('createWorkItem', params, context)
 *
 * // Approve a pending action
 * const approved = await agentExecutor.approve(actionId, userId)
 *
 * // Rollback a completed action
 * const rolledBack = await agentExecutor.rollback(actionId, context)
 * ```
 */
export const agentExecutor = new AgentExecutor();

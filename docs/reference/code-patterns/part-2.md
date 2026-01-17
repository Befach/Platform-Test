
  return () => {
    unsubscribe();
  };
}, [teamId, workspaceId]);

```

**Key Principles**:
- ✅ Use unique channel names (`workspace_${workspaceId}_features`)
- ✅ Filter by `team_id` and `workspace_id` for security
- ✅ Return cleanup function for unsubscribing
- ✅ Handle all event types (INSERT, UPDATE, DELETE)
- ✅ Use TypeScript types for payloads
- ❌ Don't forget to unsubscribe when component unmounts

---

## Feature Gates & Billing Patterns

### Pro Tier Feature Check

```typescript
// lib/utils/billing.ts
export const canAccessProFeature = async (
  teamId: string,
  feature: 'review' | 'collaboration' | 'agentic_ai' | 'custom_dashboards'
): Promise<boolean> => {
  const { data: team, error } = await supabase
    .from('teams')
    .select('plan')
    .eq('id', teamId)
    .single();

  if (error) {
    console.error('Failed to check team plan:', error);
    return false; // Fail closed
  }

  return team?.plan === 'pro';
};

// Alternative: Check active subscription
export const hasActiveSubscription = async (teamId: string): Promise<boolean> => {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .single();

  if (error) return false;
  return subscription !== null;
};
```

### Usage in Component

```tsx
'use client';

import { useState, useEffect } from 'react';
import { canAccessProFeature } from '@/lib/utils/billing';
import { UpgradeModal } from '@/components/billing/UpgradeModal';

export function ReviewButton({ teamId }: { teamId: string }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    canAccessProFeature(teamId, 'review').then(setCanAccess);
  }, [teamId]);

  const handleReviewClick = async () => {
    const hasAccess = await canAccessProFeature(teamId, 'review');

    if (!hasAccess) {
      setShowUpgradeModal(true);
      return;
    }

    // Proceed with review feature
    router.push(`/review`);
  };

  return (
    <>
      <Button onClick={handleReviewClick}>
        Create Review Link {!canAccess && '(Pro)'}
      </Button>
      {showUpgradeModal && (
        <UpgradeModal
          feature="review"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}
```

**Key Principles**:

- ✅ Check feature access server-side AND client-side
- ✅ Fail closed (deny access if check fails)
- ✅ Show upgrade prompts for Pro features
- ✅ Cache feature access results when appropriate
- ❌ Don't trust client-side checks alone

---

## AI Integration Patterns

### Streaming Chat API

```typescript
// app/api/ai/chat/route.ts
import { OpenAI } from 'openai';

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

export async function POST(req: Request) {
  const { messages, model = 'claude-haiku' } = await req.json();

  const stream = await openrouter.chat.completions.create({
    model: 'anthropic/claude-3-haiku-20240307',
    messages,
    stream: true,
    max_tokens: 2000
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    }
  );
}
```

### AI Tool Calling (Agentic Mode)

```typescript
// lib/ai/tools/create-feature.ts
export const createFeatureTool = {
  name: 'create_feature',
  description: 'Create a new feature in the workspace',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Feature name' },
      purpose: { type: 'string', description: 'What the feature does' },
      timeline: {
        type: 'string',
        enum: ['MVP', 'SHORT', 'LONG'],
        description: 'Timeline category'
      }
    },
    required: ['name', 'purpose', 'timeline']
  },
  execute: async (params: CreateFeatureParams): Promise<ToolResult> => {
    try {
      const feature = await createFeature(params);
      return {
        success: true,
        message: `Created feature: ${feature.name}`,
        data: feature
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create feature: ${error.message}`,
        data: null
      };
    }
  }
};
```

**Key Principles**:

- ✅ Use streaming for real-time responses
- ✅ Handle errors gracefully in streams
- ✅ Close streams properly
- ✅ Define tool parameters with JSON Schema
- ✅ Return structured results from tools
- ❌ Don't forget error handling in async streams

---

## Phase System Patterns

### Phase Transition Validation Pattern

```typescript
// lib/utils/phase-validation.ts

type Phase = 'research' | 'planning' | 'execution' | 'review' | 'complete';

interface PhaseTransitionRequirements {
  from: Phase;
  to: Phase;
  requiredFields: string[];
  customValidation?: (workItem: WorkItem) => boolean;
}

const PHASE_TRANSITIONS: PhaseTransitionRequirements[] = [
  {
    from: 'research',
    to: 'planning',
    requiredFields: ['purpose'],
    customValidation: (item) => {
      // Must have at least 1 timeline item OR scope defined
      return (item.timeline_items?.length > 0) || !!item.scope;
    }
  },
  {
    from: 'planning',
    to: 'execution',
    requiredFields: ['target_release', 'acceptance_criteria', 'priority', 'estimated_hours'],
  },
  {
    from: 'execution',
    to: 'review',
    requiredFields: ['actual_start_date'],
    customValidation: (item) => {
      // Progress must be >= 80%
      return (item.progress_percent ?? 0) >= 80;
    }
  },
  {
    from: 'review',
    to: 'complete',
    requiredFields: [],
    customValidation: (item) => {
      // Feedback must be addressed
      return item.status === 'completed';
    }
  }
];

export function canTransitionPhase(
  workItem: WorkItem,
  targetPhase: Phase
): { canTransition: boolean; missingFields: string[]; reason?: string } {
  const currentPhase = workItem.phase;
  const transition = PHASE_TRANSITIONS.find(
    t => t.from === currentPhase && t.to === targetPhase
  );

  if (!transition) {
    return {
      canTransition: false,
      missingFields: [],
      reason: `No direct transition from ${currentPhase} to ${targetPhase}`
    };
  }

  // Check required fields
  const missingFields = transition.requiredFields.filter(
    field => !workItem[field]
  );

  // Check custom validation
  const passesCustomValidation = transition.customValidation
    ? transition.customValidation(workItem)
    : true;

  return {
    canTransition: missingFields.length === 0 && passesCustomValidation,
    missingFields,
    reason: !passesCustomValidation ? 'Custom validation failed' : undefined
  };
}
```

### Phase Readiness Calculation Pattern

```typescript
// lib/utils/phase-readiness.ts

interface PhaseReadiness {
  currentPhase: Phase;
  nextPhase?: Phase;
  readinessPercent: number;
  missingFields: string[];
  canUpgrade: boolean;
}

export function calculatePhaseReadiness(workItem: WorkItem): PhaseReadiness {
  const currentPhase = workItem.phase;
  const phases: Phase[] = ['research', 'planning', 'execution', 'review', 'complete'];
  const currentIndex = phases.indexOf(currentPhase);

  // Complete phase cannot be upgraded
  if (currentPhase === 'complete') {
    return {
      currentPhase,
      readinessPercent: 100,
      missingFields: [],
      canUpgrade: false
    };
  }

  const nextPhase = phases[currentIndex + 1];
  const validation = canTransitionPhase(workItem, nextPhase);

  // Calculate readiness percentage
  const transition = PHASE_TRANSITIONS.find(
    t => t.from === currentPhase && t.to === nextPhase
  );

  if (!transition) {
    return {
      currentPhase,
      readinessPercent: 0,
      missingFields: [],
      canUpgrade: false
    };
  }

  const totalFields = transition.requiredFields.length + (transition.customValidation ? 1 : 0);
  const completedFields = totalFields - validation.missingFields.length - (validation.reason ? 1 : 0);
  const readinessPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100;

  return {
    currentPhase,
    nextPhase,
    readinessPercent,
    missingFields: validation.missingFields,
    canUpgrade: readinessPercent >= 80
  };
}
```

### Workspace Aggregation Pattern

```typescript
// lib/utils/workspace-aggregation.ts

interface PhaseDistribution {
  research: number;
  planning: number;
  execution: number;
  review: number;
  complete: number;
}

interface WorkspaceStats {
  totalWorkItems: number;
  phaseDistribution: PhaseDistribution;
  phasePercentages: PhaseDistribution;
  dominantPhase: Phase;
}

export async function getWorkspacePhaseStats(
  teamId: string,
  workspaceId: string
): Promise<WorkspaceStats> {
  const { data: workItems, error } = await supabase
    .from('work_items')
    .select('phase')
    .eq('team_id', teamId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(`Failed to fetch work items: ${error.message}`);

  const totalWorkItems = workItems?.length || 0;

  // Count by phase
  const distribution: PhaseDistribution = {
    research: 0,
    planning: 0,
    execution: 0,
    review: 0,
    complete: 0
  };

  workItems?.forEach(item => {
    if (item.phase in distribution) {
      distribution[item.phase as Phase]++;
    }
  });

  // Calculate percentages
  const phasePercentages: PhaseDistribution = {
    research: totalWorkItems > 0 ? Math.round((distribution.research / totalWorkItems) * 100) : 0,
    planning: totalWorkItems > 0 ? Math.round((distribution.planning / totalWorkItems) * 100) : 0,
    execution: totalWorkItems > 0 ? Math.round((distribution.execution / totalWorkItems) * 100) : 0,
    review: totalWorkItems > 0 ? Math.round((distribution.review / totalWorkItems) * 100) : 0,
    complete: totalWorkItems > 0 ? Math.round((distribution.complete / totalWorkItems) * 100) : 0
  };

  // Find dominant phase
  const dominantPhase = Object.entries(distribution).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0] as Phase;

  return {
    totalWorkItems,
    phaseDistribution: distribution,
    phasePercentages,
    dominantPhase
  };
}
```

### Strategy Display by Context Pattern

```typescript
// lib/utils/strategy-context.ts

interface StrategyDisplayConfig {
  showFullTree: boolean;
  showUserStories: boolean;
  showCaseStudies: boolean;
  showAlignmentStrength: boolean;
  maxDepth: number;
}

export function getStrategyDisplayConfig(
  context: 'organization' | 'work-item'
): StrategyDisplayConfig {
  if (context === 'organization') {
    return {
      showFullTree: true,
      showUserStories: true,
      showCaseStudies: true,
      showAlignmentStrength: false,
      maxDepth: 4 // Pillar → Objective → Key Result → Initiative
    };
  }

  // Work item context
  return {
    showFullTree: false,
    showUserStories: false,
    showCaseStudies: false,
    showAlignmentStrength: true,
    maxDepth: 2 // Only show directly relevant strategies
  };
}

// Usage in components
export function StrategyView({ context, workItemId }: Props) {
  const config = getStrategyDisplayConfig(context);

  if (context === 'organization') {
    return (
      <OrganizationStrategyTree
        showUserStories={config.showUserStories}
        showCaseStudies={config.showCaseStudies}
        maxDepth={config.maxDepth}
      />
    );
  }

  return (
    <WorkItemAlignmentView
      workItemId={workItemId}
      showAlignmentStrength={config.showAlignmentStrength}
    />
  );
}
```

---

## Summary

**Core Patterns to Remember**:

1. **Multi-tenancy**: Always filter by `team_id`
2. **IDs**: Use `Date.now().toString()` (NEVER UUID)
3. **TypeScript**: Strict types, no `any`
4. **RLS**: Enable on ALL tables
5. **Errors**: Handle explicitly
6. **shadcn/ui**: Use component library, not custom CSS
7. **Real-time**: Clean up subscriptions
8. **Feature gates**: Check server-side AND client-side
9. **Phase = Status**: Work item phase IS the status (no separate field)
10. **Phase Transitions**: Validate required fields before allowing phase changes
11. **Workspace Aggregation**: Show phase distribution, not single stage
12. **Strategy Context**: Different displays for organization vs work item level

---

**See Also**:

- [Architecture Reference](ARCHITECTURE.md) - Two-layer system, phase system details
- [API Reference](API_REFERENCE.md)
- [Main Implementation Plan](../implementation/README.md)

# Code Patterns Reference

**Last Updated**: 2025-12-28 (Verified - Next.js 16.1.1 compatible)
**Purpose**: Comprehensive code examples for common patterns in the Product Lifecycle Management Platform

---

## Table of Contents

1. [TypeScript Patterns](#typescript-patterns)
2. [Next.js Component Patterns](#nextjs-component-patterns)
3. [Supabase Query Patterns](#supabase-query-patterns)
4. [Database Migration Patterns](#database-migration-patterns)
5. [Real-time Subscription Patterns](#real-time-subscription-patterns)
6. [Feature Gates & Billing Patterns](#feature-gates--billing-patterns)
7. [AI Integration Patterns](#ai-integration-patterns)

---

## TypeScript Patterns

### Strict Typing with Interfaces

```typescript
// ✅ GOOD: Strict typing, interfaces, descriptive names
interface CreateFeatureParams {
  workspaceId: string;
  name: string;
  purpose: string;
  timeline: 'MVP' | 'SHORT' | 'LONG';
}

interface Feature {
  id: string;
  teamId: string;
  workspaceId: string;
  name: string;
  purpose: string;
  timeline: 'MVP' | 'SHORT' | 'LONG';
  timelineItems: TimelineItem[];
  createdAt: string;
  updatedAt: string;
}

const createFeature = async (params: CreateFeatureParams): Promise<Feature> => {
  const feature: Feature = {
    id: Date.now().toString(), // Timestamp-based ID (NEVER use UUID)
    teamId: getCurrentTeamId(),
    workspaceId: params.workspaceId,
    name: params.name,
    purpose: params.purpose,
    timeline: params.timeline,
    timelineItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('features')
    .insert(feature)
    .select()
    .single();

  if (error) {
    console.error('Failed to create feature:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
};
```

### ❌ Anti-Pattern: Avoid These

```typescript
// ❌ BAD: any types, no error handling, UUID
const createFeature = async (data: any) => {
  const feature: any = { ...data, id: generateUUID() }; // NEVER use UUID!
  const result = await supabase.from('features').insert(feature);
  return result.data; // No error handling
};
```

**Key Principles**:
- ✅ Use strict TypeScript interfaces for all data structures
- ✅ Use `Date.now().toString()` for IDs (timestamp-based)
- ✅ Always handle errors explicitly
- ✅ Use union types for enums (`'MVP' | 'SHORT' | 'LONG'`)
- ❌ NEVER use `any` type
- ❌ NEVER use UUID for IDs

---

## Next.js Component Patterns

### Server Component with shadcn/ui

```tsx
// ✅ GOOD: TypeScript, shadcn/ui, Server Component
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FeatureCardProps {
  feature: Feature;
  onEdit?: (id: string) => void;
}

export function FeatureCard({ feature, onEdit }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{feature.name}</CardTitle>
          <Badge variant="secondary">{feature.timeline}</Badge>
        </div>
        <CardDescription>{feature.purpose}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onEdit?.(feature.id)}>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Client Component with State

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FeatureFormProps {
  workspaceId: string;
  onSuccess?: (feature: Feature) => void;
}

export function FeatureForm({ workspaceId, onSuccess }: FeatureFormProps) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, name, purpose, timeline: 'MVP' })
      });

      if (!response.ok) throw new Error('Failed to create feature');

      const feature = await response.json();
      toast.success('Feature created successfully');
      onSuccess?.(feature);
      setName('');
      setPurpose('');
    } catch (error) {
      toast.error('Failed to create feature');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Feature name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        placeholder="Purpose"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Feature'}
      </Button>
    </form>
  );
}
```

### ❌ Anti-Pattern

```tsx
// ❌ BAD: No types, inline styles, no component library
const FeatureCard = ({ feature }) => (
  <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
    <h3>{feature.name}</h3>
    <p>{feature.purpose}</p>
  </div>
);
```

**Key Principles**:
- ✅ Use shadcn/ui components (not custom UI)
- ✅ Use Tailwind CSS utility classes (not inline styles)
- ✅ TypeScript props interfaces for all components
- ✅ Server Components by default, Client Components only when needed
- ✅ Use `'use client'` directive for interactive components
- ❌ No inline styles
- ❌ No custom CSS files

---

## Supabase Query Patterns

### Team-Scoped Query with Joins

```typescript
// ✅ GOOD: Team-scoped, typed, error handling, joins
const loadWorkspaceFeatures = async (
  teamId: string,
  workspaceId: string
): Promise<Feature[]> => {
  const { data, error } = await supabase
    .from('features')
    .select(`
      *,
      timeline_items (
        *,
        linked_items (*)
      )
    `)
    .eq('team_id', teamId) // CRITICAL: Always filter by team_id
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load features:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
};
```

### Insert with RLS Validation

```typescript
// ✅ GOOD: Validates team membership via RLS
const createWorkspaceFeature = async (
  teamId: string,
  workspaceId: string,
  name: string,
  purpose: string
): Promise<Feature> => {
  const feature: Partial<Feature> = {
    id: Date.now().toString(),
    team_id: teamId,
    workspace_id: workspaceId,
    name,
    purpose,
    timeline: 'MVP',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('features')
    .insert(feature)
    .select()
    .single();

  if (error) {
    // RLS policies will reject if user isn't team member
    console.error('Insert failed (check team membership):', error);
    throw new Error(`Access denied or database error: ${error.message}`);
  }

  return data;
};
```

### ❌ Anti-Pattern

```typescript
// ❌ BAD: No team filtering, no error handling
const loadFeatures = async () => {
  const { data } = await supabase.from('features').select('*');
  return data; // No team isolation = security vulnerability!
};
```

**Key Principles**:
- ✅ **ALWAYS** filter by `team_id` for multi-tenancy
- ✅ Use typed responses (`Promise<Feature[]>`)
- ✅ Handle errors explicitly
- ✅ Use joins to load related data (`timeline_items (*)`)
- ✅ Return empty array `[]` instead of null
- ❌ NEVER skip `team_id` filtering
- ❌ NEVER ignore RLS policies

---

## Database Migration Patterns

### Creating Tables with RLS

```sql
-- Migration: supabase/migrations/YYYYMMDDHHMMSS_create_mind_maps.sql

-- Create table with multi-tenant structure
CREATE TABLE IF NOT EXISTS mind_maps (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  canvas_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_mind_maps_team_id ON mind_maps(team_id);
CREATE INDEX idx_mind_maps_workspace_id ON mind_maps(workspace_id);
CREATE INDEX idx_mind_maps_created_at ON mind_maps(created_at DESC);

-- Enable RLS
ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Team members can read team mind maps
CREATE POLICY "Team members can read team mind maps"
ON mind_maps FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- RLS Policy: Team members can create team mind maps
CREATE POLICY "Team members can create team mind maps"
ON mind_maps FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- RLS Policy: Team members can update team mind maps
CREATE POLICY "Team members can update team mind maps"
ON mind_maps FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- RLS Policy: Team members can delete team mind maps
CREATE POLICY "Team members can delete team mind maps"
ON mind_maps FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mind_maps_updated_at
BEFORE UPDATE ON mind_maps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Apply Migration**:
```bash
npx supabase db push
```

**Generate TypeScript Types**:
```bash
npx supabase gen types typescript --local > lib/supabase/types.ts
```

**Key Principles**:
- ✅ Always include `team_id` for multi-tenancy
- ✅ Use TEXT IDs (for timestamp-based IDs)
- ✅ Add foreign key constraints with `ON DELETE CASCADE`
- ✅ Create indexes on `team_id`, `workspace_id`, and frequently queried fields
- ✅ **ALWAYS enable RLS** (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- ✅ Create policies for all operations (SELECT, INSERT, UPDATE, DELETE)
- ✅ Use `updated_at` trigger for automatic timestamp updates
- ❌ NEVER skip RLS policies

### ⚠️ CRITICAL: team_id Must NEVER Be NULL

**This is a common source of silent failures!**

RLS policies use this pattern:
```sql
team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
```

**The Problem**: If `team_id` is NULL, this check **always fails silently** because:
- `NULL IN (...)` always returns NULL/false, never true
- Supabase returns empty results `{}` with no error message
- Operations appear to succeed but actually do nothing

**The Solution**: Always use `NOT NULL` constraint on `team_id`:

```sql
-- ✅ GOOD: team_id is NOT NULL
CREATE TABLE my_table (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  -- ...
);

-- Add comment explaining importance
COMMENT ON COLUMN my_table.team_id IS
  'REQUIRED: Team ownership for RLS policies. NULL team_id breaks all RLS checks.';
```

**Checklist for New Tables**:
- [ ] `team_id TEXT NOT NULL` - Never allow NULL
- [ ] `REFERENCES teams(id) ON DELETE CASCADE` - FK constraint
- [ ] Index on team_id for performance
- [ ] RLS policies enabled and created
- [ ] Test with authenticated user to verify RLS works

**Debugging RLS Failures**:
1. Check if `team_id` is NULL in the row being inserted/queried
2. Verify user is authenticated (`auth.uid()` is not NULL)
3. Verify user is in `team_members` table for the target team
4. Check Supabase postgres logs for "permission denied" or silent failures

---

## Real-time Subscription Patterns

### Subscribe to Workspace Changes

```typescript
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Subscribe to workspace features in real-time
const subscribeToWorkspaceFeatures = (
  teamId: string,
  workspaceId: string,
  onFeatureChange: (payload: RealtimePostgresChangesPayload<Feature>) => void
): (() => void) => {
  const subscription = supabase
    .channel(`workspace_${workspaceId}_features`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'features',
        filter: `team_id=eq.${teamId},workspace_id=eq.${workspaceId}`
      },
      onFeatureChange
    )
    .subscribe();

  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
};

// Usage in React component
useEffect(() => {
  const handleChange = (payload: RealtimePostgresChangesPayload<Feature>) => {
    console.log('Change received:', payload);

    if (payload.eventType === 'INSERT') {
      // Handle new feature
      setFeatures(prev => [...prev, payload.new as Feature]);
    } else if (payload.eventType === 'UPDATE') {
      // Handle updated feature
      setFeatures(prev =>
        prev.map(f => f.id === payload.new.id ? payload.new as Feature : f)
      );
    } else if (payload.eventType === 'DELETE') {
      // Handle deleted feature
      setFeatures(prev => prev.filter(f => f.id !== payload.old.id));
    }
  };

  const unsubscribe = subscribeToWorkspaceFeatures(teamId, workspaceId, handleChange);

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

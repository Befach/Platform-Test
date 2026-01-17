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

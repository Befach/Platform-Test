# Phase 5: Agent Memory System

**Last Updated**: 2026-01-14
**Status**: Pending
**Branch**: `feat/agent-memory-system`

[Back to AI Tool Architecture](README.md)

---

## Overview

**Files to create**:

- 5 files in `next-app/src/lib/ai/memory/`
- 7 files in `next-app/src/components/ai/memory/`
- 5 API routes in `next-app/src/app/api/ai/memory/`
**Files to modify**: Supabase schema, chat system prompt
**Estimated time**: 1-2 days
**Risk**: Medium (new database table, UI components)

### Problem Statement

AI models have no persistent context about:

- User preferences and working style
- Project-specific patterns and conventions
- Previously rejected suggestions (repeats mistakes)
- Domain-specific knowledge

Each conversation starts from zero context, leading to repeated corrections and inconsistent responses.

### Solution

Implement a persistent memory system with:

- **10k token limit** - Efficient context injection
- **5 memory categories** - Organized knowledge
- **Auto-optimization** - Compress when near limit
- **Learning mechanism** - Track rejections/acceptances
- **User management UI** - View, edit, delete entries

A persistent memory file that gives AI models context about the user's preferences, project patterns, and learned rules. Stays efficient with a **10k token limit** and provides UI for user management.

### Step-by-Step Implementation

#### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/agent-memory-system
```

#### Step 2: Create Database Migration

Create: `supabase/migrations/20251231_agent_memory.sql`

```sql
-- Agent Memory table for persistent AI context
CREATE TABLE IF NOT EXISTS agent_memory (
  id TEXT PRIMARY KEY DEFAULT (to_char(now(), 'YYYYMMDDHH24MISSMS')),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  token_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX idx_agent_memory_workspace ON agent_memory(workspace_id);
CREATE INDEX idx_agent_memory_team ON agent_memory(team_id);

-- RLS policies
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their team's memory"
  ON agent_memory FOR SELECT
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert memory for their team"
  ON agent_memory FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their team's memory"
  ON agent_memory FOR UPDATE
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_agent_memory_updated_at
  BEFORE UPDATE ON agent_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Step 3: Create Directory Structure

```bash
cd next-app/src/lib/ai
mkdir -p memory

cd next-app/src/components/ai
mkdir -p memory

cd next-app/src/app/api/ai
mkdir -p memory/entry/[id] memory/optimize memory/learn
```

#### Step 4: Create Memory Types

Create: `next-app/src/lib/ai/memory/types.ts`

```typescript
/**
 * Agent Memory Types
 * 
 * Types for the persistent memory system.
 */

/**
 * Memory entry sources
 */
export type MemorySource = 'manual' | 'learned' | 'analyzed' | 'inferred'

/**
 * Memory categories
 */
export type MemoryCategory =
  | 'userPreferences'
  | 'projectPatterns'
  | 'learnedRules'
  | 'domainKnowledge'
  | 'communicationStyle'

/**
 * Single memory entry
 */
export interface MemoryEntry {
  id: string
  content: string
  category: MemoryCategory
  source: MemorySource
  confidence: number      // 0-1, higher = more certain
  usageCount: number      // How often this rule was applied
  lastUsed: string        // ISO date
  tokens: number          // Pre-calculated token count
  canDelete: boolean      // Some entries are protected
  createdAt: string       // ISO date
}

/**
 * Full agent memory structure
 */
export interface AgentMemory {
  version: string
  workspaceId: string
  teamId: string
  tokenCount: number
  maxTokens: number       // 10000

  sections: {
    userPreferences: MemoryEntry[]
    projectPatterns: MemoryEntry[]
    learnedRules: MemoryEntry[]
    domainKnowledge: MemoryEntry[]
    communicationStyle: MemoryEntry[]
  }

  metadata: {
    createdAt: string
    lastUpdated: string
    lastOptimized: string
    entryCount: number
  }
}

/**
 * Memory operation result
 */
export interface MemoryOperationResult {
  success: boolean
  memory?: AgentMemory
  error?: string
  tokensUsed?: number
  tokensRemaining?: number
}

/**
 * Default empty memory
 */
export const EMPTY_MEMORY: AgentMemory = {
  version: '1.0',
  workspaceId: '',
  teamId: '',
  tokenCount: 0,
  maxTokens: 10000,
  sections: {
    userPreferences: [],
    projectPatterns: [],
    learnedRules: [],
    domainKnowledge: [],
    communicationStyle: [],
  },
  metadata: {
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    lastOptimized: '',
    entryCount: 0,
  },
}
```

#### Step 5: Create Memory Tokenizer

Create: `next-app/src/lib/ai/memory/memory-tokenizer.ts`

```typescript
/**
 * Memory Tokenizer
 * 
 * Token counting using js-tiktoken for accurate GPT token estimates.
 */

import { getEncoding } from 'js-tiktoken'

// Use cl100k_base encoding (GPT-4, Claude compatible)
const encoder = getEncoding('cl100k_base')

/**
 * Count tokens in a string
 */
export function countTokens(text: string): number {
  return encoder.encode(text).length
}

/**
 * Count tokens for an entire memory object
 */
export function countMemoryTokens(memory: AgentMemory): number {
  let total = 0
  
  for (const section of Object.values(memory.sections)) {
    for (const entry of section) {
      total += entry.tokens
    }
  }
  
  return total
}

/**
 * Check if adding content would exceed limit
 */
export function wouldExceedLimit(
  currentTokens: number,
  newContent: string,
  maxTokens: number = 10000
): boolean {
  const newTokens = countTokens(newContent)
  return currentTokens + newTokens > maxTokens
}

/**
 * Estimate tokens for a memory entry
 */
export function estimateEntryTokens(content: string): number {
  // Content + metadata overhead (~20 tokens)
  return countTokens(content) + 20
}

import type { AgentMemory } from './types'
```

#### Step 6: Create Core Agent Memory Module

Create: `next-app/src/lib/ai/memory/agent-memory.ts`

```typescript
/**
 * Agent Memory
 * 
 * Core memory management: CRUD operations, persistence, injection.
 */

import { createClient } from '@/lib/supabase/server'
import { countTokens, countMemoryTokens } from './memory-tokenizer'
import type {
  AgentMemory,
  MemoryEntry,
  MemoryCategory,
  MemorySource,
  MemoryOperationResult,
  EMPTY_MEMORY,
} from './types'

/**
 * Get memory for a workspace
 */
export async function getMemory(workspaceId: string, teamId: string): Promise<AgentMemory> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('agent_memory')
    .select('content, token_count')
    .eq('workspace_id', workspaceId)
    .eq('team_id', teamId)
    .single()

  if (error || !data) {
    // Return empty memory if none exists
    return {
      ...EMPTY_MEMORY,
      workspaceId,
      teamId,
    }
  }

  return data.content as AgentMemory
}

/**
 * Save memory for a workspace
 */
export async function saveMemory(memory: AgentMemory): Promise<MemoryOperationResult> {
  const supabase = await createClient()
  
  const tokenCount = countMemoryTokens(memory)
  
  if (tokenCount > memory.maxTokens) {
    return {
      success: false,
      error: `Token count (${tokenCount}) exceeds limit (${memory.maxTokens})`,
    }
  }

  const { error } = await supabase
    .from('agent_memory')
    .upsert({
      workspace_id: memory.workspaceId,
      team_id: memory.teamId,
      content: memory,
      token_count: tokenCount,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'workspace_id',
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    memory: { ...memory, tokenCount },
    tokensUsed: tokenCount,
    tokensRemaining: memory.maxTokens - tokenCount,
  }
}

/**
 * Add a new memory entry
 */
export async function addMemoryEntry(
  workspaceId: string,
  teamId: string,
  content: string,
  category: MemoryCategory,
  source: MemorySource = 'manual'
): Promise<MemoryOperationResult> {
  const memory = await getMemory(workspaceId, teamId)
  const tokens = countTokens(content) + 20 // +20 for metadata

  // Check token limit
  if (memory.tokenCount + tokens > memory.maxTokens) {
    return {
      success: false,
      error: `Adding this entry would exceed token limit. Current: ${memory.tokenCount}, New: ${tokens}, Limit: ${memory.maxTokens}`,
    }
  }

  const entry: MemoryEntry = {
    id: Date.now().toString(),
    content,
    category,
    source,
    confidence: source === 'manual' ? 1.0 : 0.5,
    usageCount: 0,
    lastUsed: new Date().toISOString(),
    tokens,
    canDelete: true,
    createdAt: new Date().toISOString(),
  }

  memory.sections[category].push(entry)
  memory.tokenCount += tokens
  memory.metadata.entryCount++
  memory.metadata.lastUpdated = new Date().toISOString()

  return saveMemory(memory)
}

/**
 * Remove a memory entry
 */
export async function removeMemoryEntry(
  workspaceId: string,
  teamId: string,
  entryId: string
): Promise<MemoryOperationResult> {
  const memory = await getMemory(workspaceId, teamId)

  for (const category of Object.keys(memory.sections) as MemoryCategory[]) {
    const index = memory.sections[category].findIndex(e => e.id === entryId)
    if (index !== -1) {
      const entry = memory.sections[category][index]
      if (!entry.canDelete) {
        return { success: false, error: 'This entry is protected and cannot be deleted' }
      }
      
      memory.tokenCount -= entry.tokens
      memory.sections[category].splice(index, 1)
      memory.metadata.entryCount--
      memory.metadata.lastUpdated = new Date().toISOString()
      
      return saveMemory(memory)
    }
  }

  return { success: false, error: 'Entry not found' }
}

/**
 * Update entry usage (called when rule is applied)
 */
export async function updateEntryUsage(
  workspaceId: string,
  teamId: string,
  entryId: string
): Promise<void> {
  const memory = await getMemory(workspaceId, teamId)

  for (const category of Object.keys(memory.sections) as MemoryCategory[]) {
    const entry = memory.sections[category].find(e => e.id === entryId)
    if (entry) {
      entry.usageCount++
      entry.lastUsed = new Date().toISOString()
      entry.confidence = Math.min(entry.confidence + 0.05, 1.0)
      await saveMemory(memory)
      return
    }
  }
}

/**
 * Convert memory to markdown for injection into prompts
 */
export function memoryToMarkdown(memory: AgentMemory): string {
  const lines: string[] = ['# Agent Memory', '']

  const categoryTitles: Record<MemoryCategory, string> = {
    userPreferences: 'User Preferences',
    projectPatterns: 'Project Patterns',
    learnedRules: 'Learned Rules',
    domainKnowledge: 'Domain Knowledge',
    communicationStyle: 'Communication Style',
  }

  for (const [category, title] of Object.entries(categoryTitles)) {
    const entries = memory.sections[category as MemoryCategory]
    if (entries.length > 0) {
      lines.push(`## ${title}`)
      for (const entry of entries) {
        lines.push(`- ${entry.content}`)
      }
      lines.push('')
    }
  }

  lines.push(`*Token Count: ${memory.tokenCount} / ${memory.maxTokens}*`)

  return lines.join('\n')
}
```

#### Step 7: Create Memory Optimizer

Create: `next-app/src/lib/ai/memory/memory-optimizer.ts`

```typescript
/**
 * Memory Optimizer
 * 
 * Auto-optimizes memory when approaching token limit.
 */

import { generateText } from 'ai'
import { openrouter } from '../ai-sdk-client'
import { countTokens } from './memory-tokenizer'
import type { AgentMemory, MemoryEntry, MemoryCategory } from './types'

const OPTIMIZATION_THRESHOLD = 0.8 // 80% of max tokens

/**
 * Check if memory needs optimization
 */
export function needsOptimization(memory: AgentMemory): boolean {
  return memory.tokenCount > memory.maxTokens * OPTIMIZATION_THRESHOLD
}

/**
 * Get optimization suggestions
 */
export function getOptimizationSuggestions(memory: AgentMemory): string[] {
  const suggestions: string[] = []
  const allEntries = getAllEntries(memory)

  // Find stale entries (low confidence, unused, old)
  const staleEntries = allEntries.filter(e =>
    e.confidence < 0.3 &&
    e.usageCount < 2 &&
    daysSince(e.lastUsed) > 30
  )
  if (staleEntries.length > 0) {
    suggestions.push(`Remove ${staleEntries.length} stale entries (low confidence, unused)`)
  }

  // Find verbose entries
  const verboseEntries = allEntries.filter(e => e.tokens > 100)
  if (verboseEntries.length > 0) {
    suggestions.push(`Summarize ${verboseEntries.length} verbose entries`)
  }

  // Find potential duplicates
  const duplicates = findPotentialDuplicates(allEntries)
  if (duplicates > 0) {
    suggestions.push(`Merge ${duplicates} potential duplicate entries`)
  }

  return suggestions
}

/**
 * Auto-optimize memory
 */
export async function optimizeMemory(memory: AgentMemory): Promise<AgentMemory> {
  const optimized = { ...memory }

  // Step 1: Remove stale entries
  for (const category of Object.keys(optimized.sections) as MemoryCategory[]) {
    optimized.sections[category] = optimized.sections[category].filter(e => {
      const isStale = e.confidence < 0.3 && e.usageCount < 2 && daysSince(e.lastUsed) > 30
      return !isStale || !e.canDelete
    })
  }

  // Step 2: Merge similar entries
  for (const category of Object.keys(optimized.sections) as MemoryCategory[]) {
    optimized.sections[category] = await mergeSimilarEntries(optimized.sections[category])
  }

  // Step 3: Summarize verbose entries
  for (const category of Object.keys(optimized.sections) as MemoryCategory[]) {
    optimized.sections[category] = await summarizeVerboseEntries(optimized.sections[category])
  }

  // Step 4: Recalculate token count
  let totalTokens = 0
  for (const category of Object.keys(optimized.sections) as MemoryCategory[]) {
    for (const entry of optimized.sections[category]) {
      totalTokens += entry.tokens
    }
  }
  optimized.tokenCount = totalTokens

  // Step 5: Update metadata
  optimized.metadata.lastOptimized = new Date().toISOString()
  optimized.metadata.entryCount = getAllEntries(optimized).length

  return optimized
}

/**
 * Merge similar entries using AI
 */
async function mergeSimilarEntries(entries: MemoryEntry[]): Promise<MemoryEntry[]> {
  if (entries.length < 2) return entries

  // Group similar entries
  const groups: MemoryEntry[][] = []
  const used = new Set<string>()

  for (const entry of entries) {
    if (used.has(entry.id)) continue

    const similar = entries.filter(e => {
      if (e.id === entry.id || used.has(e.id)) return false
      return isSimilar(entry.content, e.content)
    })

    if (similar.length > 0) {
      groups.push([entry, ...similar])
      similar.forEach(s => used.add(s.id))
    }
    used.add(entry.id)
  }

  // Merge each group
  const merged = entries.filter(e => !used.has(e.id) || groups.some(g => g[0].id === e.id))
  
  for (const group of groups) {
    if (group.length === 1) {
      merged.push(group[0])
      continue
    }

    // Use AI to merge
    const mergePrompt = `Combine these similar memory entries into one concise entry:

${group.map((e, i) => `${i + 1}. ${e.content}`).join('\n')}

Output only the merged entry text, nothing else.`

    const result = await generateText({
      model: openrouter('moonshotai/kimi-k2-thinking:nitro'),
      prompt: mergePrompt,
    })

    const mergedEntry: MemoryEntry = {
      ...group[0],
      content: result.text.trim(),
      tokens: countTokens(result.text) + 20,
      usageCount: Math.max(...group.map(e => e.usageCount)),
      confidence: Math.max(...group.map(e => e.confidence)),
    }
    merged.push(mergedEntry)
  }

  return merged
}

/**
 * Summarize verbose entries
 */
async function summarizeVerboseEntries(entries: MemoryEntry[]): Promise<MemoryEntry[]> {
  return Promise.all(entries.map(async (entry) => {
    if (entry.tokens <= 100) return entry

    const summarizePrompt = `Summarize this memory entry to be more concise while keeping the key information:

${entry.content}

Output only the summarized text, nothing else.`

    const result = await generateText({
      model: openrouter('moonshotai/kimi-k2-thinking:nitro'),
      prompt: summarizePrompt,
    })

    return {
      ...entry,
      content: result.text.trim(),
      tokens: countTokens(result.text) + 20,
    }
  }))
}

// Helper functions
function getAllEntries(memory: AgentMemory): MemoryEntry[] {
  return Object.values(memory.sections).flat()
}

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

function isSimilar(text1: string, text2: string): boolean {
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  return intersection.size / union.size > 0.5
}

function findPotentialDuplicates(entries: MemoryEntry[]): number {
  let count = 0
  const seen = new Set<string>()
  
  for (const entry of entries) {
    for (const other of entries) {
      if (entry.id !== other.id && !seen.has(`${entry.id}-${other.id}`)) {
        if (isSimilar(entry.content, other.content)) {
          count++
          seen.add(`${entry.id}-${other.id}`)
          seen.add(`${other.id}-${entry.id}`)
        }
      }
    }
  }
  
  return count
}
```

#### Step 8: Create Memory Learning

Create: `next-app/src/lib/ai/memory/memory-learning.ts`

```typescript
/**
 * Memory Learning
 * 
 * Tracks user rejections and acceptances to learn preferences.
 */

import { getMemory, addMemoryEntry, updateEntryUsage, saveMemory } from './agent-memory'
import type { AgentMemory, MemoryEntry } from './types'

/**
 * Track when user rejects a suggestion
 */
export async function trackRejection(
  workspaceId: string,
  teamId: string,
  suggestion: string,
  reason?: string
): Promise<void> {
  const memory = await getMemory(workspaceId, teamId)
  
  // Check if we already have a rejection for this
  const existing = memory.sections.learnedRules.find(e =>
    e.content.toLowerCase().includes(suggestion.toLowerCase())
  )

  if (existing) {
    // Increment rejection count (stored in usageCount temporarily)
    existing.usageCount++
    
    if (existing.usageCount >= 3) {
      // Already a rule, increase confidence
      existing.confidence = Math.min(existing.confidence + 0.1, 1.0)
    }
    
    await saveMemory(memory)
  } else {
    // Create tracker or rule
    const rejectionCount = await getRejectionCount(workspaceId, teamId, suggestion)
    
    if (rejectionCount >= 2) {
      // Third rejection - create a learned rule
      await addMemoryEntry(
        workspaceId,
        teamId,
        `Don't suggest: ${suggestion}${reason ? ` (Reason: ${reason})` : ''}`,
        'learnedRules',
        'learned'
      )
    } else {
      // Track rejection (stored in a separate tracking mechanism)
      await incrementRejectionCount(workspaceId, teamId, suggestion)
    }
  }
}

/**
 * Track when user accepts/uses a suggestion
 */
export async function trackAcceptance(
  workspaceId: string,
  teamId: string,
  pattern: string,
  context?: string
): Promise<void> {
  const memory = await getMemory(workspaceId, teamId)
  
  // Check if this pattern already exists
  const existing = findSimilarPattern(memory, pattern)
  
  if (existing) {
    // Reinforce existing pattern
    existing.usageCount++
    existing.confidence = Math.min(existing.confidence + 0.1, 1.0)
    existing.lastUsed = new Date().toISOString()
    await saveMemory(memory)
  } else if (shouldLearn(pattern)) {
    // Add new learned pattern
    await addMemoryEntry(
      workspaceId,
      teamId,
      pattern,
      'projectPatterns',
      'inferred'
    )
  }
}

/**
 * Parse user commands for memory operations
 */
export async function parseMemoryCommand(
  workspaceId: string,
  teamId: string,
  message: string
): Promise<{ handled: boolean; response?: string }> {
  const lowerMessage = message.toLowerCase()

  // "Remember that..."
  if (lowerMessage.startsWith('remember that')) {
    const content = message.slice('remember that'.length).trim()
    const result = await addMemoryEntry(workspaceId, teamId, content, 'userPreferences', 'manual')
    return {
      handled: true,
      response: result.success
        ? `Got it! I'll remember: "${content}"`
        : `Sorry, couldn't save that: ${result.error}`,
    }
  }

  // "Forget about..."
  if (lowerMessage.startsWith('forget about')) {
    const content = message.slice('forget about'.length).trim()
    // Find and remove matching entry
    const memory = await getMemory(workspaceId, teamId)
    for (const category of Object.keys(memory.sections)) {
      const entry = memory.sections[category as keyof typeof memory.sections].find(e =>
        e.content.toLowerCase().includes(content.toLowerCase())
      )
      if (entry) {
        const { removeMemoryEntry } = await import('./agent-memory')
        await removeMemoryEntry(workspaceId, teamId, entry.id)
        return {
          handled: true,
          response: `Okay, I've forgotten about: "${entry.content}"`,
        }
      }
    }
    return {
      handled: true,
      response: `I couldn't find anything matching "${content}" in my memory.`,
    }
  }

  // "What do you know about me?"
  if (lowerMessage.includes('what do you know about me')) {
    const memory = await getMemory(workspaceId, teamId)
    const { memoryToMarkdown } = await import('./agent-memory')
    return {
      handled: true,
      response: memoryToMarkdown(memory),
    }
  }

  // "Optimize your memory"
  if (lowerMessage.includes('optimize your memory')) {
    const { optimizeMemory, needsOptimization } = await import('./memory-optimizer')
    const memory = await getMemory(workspaceId, teamId)
    
    if (!needsOptimization(memory)) {
      return {
        handled: true,
        response: `Memory is already optimized (${memory.tokenCount}/${memory.maxTokens} tokens).`,
      }
    }
    
    const optimized = await optimizeMemory(memory)
    await saveMemory(optimized)
    
    return {
      handled: true,
      response: `Memory optimized! Reduced from ${memory.tokenCount} to ${optimized.tokenCount} tokens.`,
    }
  }

  return { handled: false }
}

// Helper functions
async function getRejectionCount(workspaceId: string, teamId: string, suggestion: string): Promise<number> {
  // In production, this would query a rejections tracking table
  // For now, return 0 (first rejection)
  return 0
}

async function incrementRejectionCount(workspaceId: string, teamId: string, suggestion: string): Promise<void> {
  // In production, this would increment a counter in rejections tracking table
}

function findSimilarPattern(memory: AgentMemory, pattern: string): MemoryEntry | undefined {
  const words = new Set(pattern.toLowerCase().split(/\s+/))
  
  for (const category of Object.values(memory.sections)) {
    for (const entry of category) {
      const entryWords = new Set(entry.content.toLowerCase().split(/\s+/))
      const intersection = new Set([...words].filter(w => entryWords.has(w)))
      if (intersection.size / words.size > 0.6) {
        return entry
      }
    }
  }
  
  return undefined
}

function shouldLearn(pattern: string): boolean {
  // Don't learn very short or generic patterns
  return pattern.length > 20 && pattern.split(/\s+/).length > 3
}
```

#### Step 9: Create Index File

Create: `next-app/src/lib/ai/memory/index.ts`

```typescript
/**
 * Agent Memory System Index
 */

export * from './types'
export {
  getMemory,
  saveMemory,
  addMemoryEntry,
  removeMemoryEntry,
  updateEntryUsage,
  memoryToMarkdown,
} from './agent-memory'
export {
  needsOptimization,
  getOptimizationSuggestions,
  optimizeMemory,
} from './memory-optimizer'
export {
  trackRejection,
  trackAcceptance,
  parseMemoryCommand,
} from './memory-learning'
export { countTokens, countMemoryTokens, wouldExceedLimit } from './memory-tokenizer'
```

#### Step 10: Create API Routes

Create: `next-app/src/app/api/ai/memory/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getMemory, saveMemory, addMemoryEntry } from '@/lib/ai/memory'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')
  const teamId = searchParams.get('teamId')

  if (!workspaceId || !teamId) {
    return NextResponse.json({ error: 'Missing workspaceId or teamId' }, { status: 400 })
  }

  const memory = await getMemory(workspaceId, teamId)
  return NextResponse.json(memory)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { workspaceId, teamId, content, category } = body

  if (!workspaceId || !teamId || !content || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await addMemoryEntry(workspaceId, teamId, content, category, 'manual')
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
```

#### Step 11: Create UI Components

Create: `next-app/src/components/ai/memory/memory-panel.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MemorySection } from './memory-section'
import { TokenUsageBar } from './token-usage-bar'
import { AddMemoryDialog } from './add-memory-dialog'
import { MemoryOptimizerCard } from './memory-optimizer-card'
import type { AgentMemory, MemoryCategory } from '@/lib/ai/memory'

interface MemoryPanelProps {
  workspaceId: string
  teamId: string
}

export function MemoryPanel({ workspaceId, teamId }: MemoryPanelProps) {
  const [memory, setMemory] = useState<AgentMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadMemory()
  }, [workspaceId, teamId])

  async function loadMemory() {
    setLoading(true)
    const response = await fetch(`/api/ai/memory?workspaceId=${workspaceId}&teamId=${teamId}`)
    const data = await response.json()
    setMemory(data)
    setLoading(false)
  }

  async function handleDeleteEntry(entryId: string) {
    await fetch(`/api/ai/memory/entry/${entryId}`, {
      method: 'DELETE',
      body: JSON.stringify({ workspaceId, teamId }),
    })
    loadMemory()
  }

  async function handleOptimize() {
    await fetch('/api/ai/memory/optimize', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, teamId }),
    })
    loadMemory()
  }

  if (loading) {
    return <div>Loading memory...</div>
  }

  if (!memory) {
    return <div>No memory found</div>
  }

  const categories: { key: MemoryCategory; title: string }[] = [
    { key: 'userPreferences', title: 'User Preferences' },
    { key: 'projectPatterns', title: 'Project Patterns' },
    { key: 'learnedRules', title: 'Learned Rules' },
    { key: 'domainKnowledge', title: 'Domain Knowledge' },
    { key: 'communicationStyle', title: 'Communication Style' },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agent Memory</CardTitle>
        <Button onClick={() => setShowAddDialog(true)}>Add Memory</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <TokenUsageBar used={memory.tokenCount} max={memory.maxTokens} />

        {memory.tokenCount > memory.maxTokens * 0.8 && (
          <MemoryOptimizerCard onOptimize={handleOptimize} />
        )}

        {categories.map(({ key, title }) => (
          <MemorySection
            key={key}
            title={title}
            entries={memory.sections[key]}
            onDelete={handleDeleteEntry}
          />
        ))}
      </CardContent>

      <AddMemoryDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        workspaceId={workspaceId}
        teamId={teamId}
        onAdded={loadMemory}
      />
    </Card>
  )
}
```

#### Step 12: Run TypeScript Check & Linter

```bash
cd next-app
npx tsc --noEmit
npm run lint
```

### Testing Plan

#### Test 1: Memory CRUD

```typescript
// Add entry
const result = await addMemoryEntry(workspaceId, teamId, 'Use Prisma for ORM', 'projectPatterns')
console.log(result.success) // true

// Get memory
const memory = await getMemory(workspaceId, teamId)
console.log(memory.sections.projectPatterns.length) // 1

// Remove entry
await removeMemoryEntry(workspaceId, teamId, result.memory.sections.projectPatterns[0].id)
```

#### Test 2: Token Management

```typescript
// Check token counting
const tokens = countTokens('This is a test string')
console.log(tokens) // ~5

// Check limit
const wouldExceed = wouldExceedLimit(9900, 'A very long string...', 10000)
console.log(wouldExceed) // true/false
```

#### Test 3: Memory Commands

```typescript
// Test "Remember that..."
const result = await parseMemoryCommand(workspaceId, teamId, 'Remember that we use TypeScript')
console.log(result.handled) // true
console.log(result.response) // "Got it! I'll remember..."
```

### Commit & PR

```bash
git add supabase/migrations/
git add next-app/src/lib/ai/memory/
git add next-app/src/components/ai/memory/
git add next-app/src/app/api/ai/memory/
git commit -m "feat: implement agent memory system with 10k token limit

Add persistent memory system:
- Database: agent_memory table with RLS
- Core: CRUD operations, token counting, markdown injection
- Optimizer: Auto-compress at 80% capacity
- Learning: Track rejections/acceptances
- UI: Memory panel, sections, add/delete dialogs

User commands:
- 'Remember that...' - Add manual rule
- 'Forget about...' - Remove entry
- 'What do you know about me?' - Show memory
- 'Optimize your memory' - Trigger compression

Benefits:
- Persistent context across sessions
- Self-improving via learning
- Efficient 10k token limit
- User-manageable preferences"
```

### Expected Final State

After this phase:

| Feature | Status |
|---------|--------|
| Memory persistence | Database + API |
| Token management | 10k limit enforced |
| Auto-optimization | At 80% threshold |
| User commands | 4 commands implemented |
| UI management | Full CRUD panel |

### Rollback Plan

```bash
# Drop migration
supabase db reset

# Or revert branch
git checkout main
git branch -D feat/agent-memory-system
```

### Dependencies

- **Requires**: Phase 2-4 complete
- **Blocks**: None (standalone feature)

### Memory Architecture

```
+----------------------------------------------------------+
|                    AGENT MEMORY SYSTEM                    |
+----------------------------------------------------------+
|                                                          |
|  +----------------------------------------------------+  |
|  | agent.md (Per Workspace)                           |  |
|  |                                                    |  |
|  | # User Preferences                                 |  |
|  | - Prefers TypeScript over JavaScript               |  |
|  | - Uses Tailwind CSS, no inline styles              |  |
|  | - Likes detailed explanations                      |  |
|  |                                                    |  |
|  | # Project Patterns                                 |  |
|  | - ID format: Date.now().toString()                 |  |
|  | - Always filter by team_id                         |  |
|  | - Use shadcn/ui components                         |  |
|  |                                                    |  |
|  | # Learned Rules                                    |  |
|  | - Don't suggest UUID - user rejected 3 times       |  |
|  | - Priority order: critical > high > medium > low   |  |
|  |                                                    |  |
|  | Token Count: 2,847 / 10,000                        |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Sources:                                                |
|  +---------+  +---------+  +---------+  +---------+     |
|  | Manual  |  | Learned |  | Project |  | Feedback|     |
|  | Rules   |  | Patterns|  | Analysis|  | History |     |
|  +---------+  +---------+  +---------+  +---------+     |
|                                                          |
+----------------------------------------------------------+
```

### Memory Categories

| Category | Source | Examples |
|----------|--------|----------|
| **User Preferences** | Manual input, inferred | "Prefers concise answers", "Likes code comments" |
| **Project Patterns** | Code analysis | "Uses Zod for validation", "Supabase RLS required" |
| **Learned Rules** | Rejection tracking | "Don't suggest X - rejected 3 times" |
| **Domain Knowledge** | User-provided | "Our API uses REST, not GraphQL" |
| **Communication Style** | Inferred | "Prefers bullet points over paragraphs" |

### Token Management

**Hard Limit**: 10,000 tokens

```typescript
interface AgentMemory {
  version: string;
  workspaceId: string;
  tokenCount: number;
  maxTokens: 10000;

  sections: {
    userPreferences: MemoryEntry[];
    projectPatterns: MemoryEntry[];
    learnedRules: MemoryEntry[];
    domainKnowledge: MemoryEntry[];
    communicationStyle: MemoryEntry[];
  };

  metadata: {
    createdAt: string;
    lastUpdated: string;
    lastOptimized: string;
    entryCount: number;
  };
}

interface MemoryEntry {
  id: string;
  content: string;
  source: 'manual' | 'learned' | 'analyzed' | 'inferred';
  confidence: number;      // 0-1, higher = more certain
  usageCount: number;      // How often this rule was applied
  lastUsed: string;
  tokens: number;          // Pre-calculated token count
  canDelete: boolean;      // Some entries are protected
}
```

### Auto-Optimization

When tokens > 8,000 (80% threshold), auto-optimize:

```typescript
async function optimizeMemory(memory: AgentMemory): Promise<AgentMemory> {
  // 1. Remove low-confidence, unused entries
  const staleEntries = memory.entries.filter(e =>
    e.confidence < 0.3 &&
    e.usageCount < 2 &&
    daysSince(e.lastUsed) > 30
  );

  // 2. Merge similar entries
  const merged = await mergeSimilarEntries(memory.entries);

  // 3. Summarize verbose entries
  const summarized = await summarizeVerboseEntries(merged);

  // 4. Prioritize by impact
  const prioritized = sortByImpact(summarized);

  // 5. Truncate to fit limit
  return truncateToLimit(prioritized, 10000);
}
```

### User Commands

| Command | Action | Example |
|---------|--------|---------|
| "Remember that..." | Add manual rule | "Remember that we use Prisma, not raw SQL" |
| "Forget about..." | Remove entry | "Forget about the old API pattern" |
| "What do you know about me?" | Show memory summary | Lists all preferences |
| "Optimize your memory" | Trigger optimization | Compresses and cleans |
| "Add this rule: [rule]" | Explicit rule add | "Add this rule: Always use async/await" |

### Learning Mechanism

```typescript
// Track user rejections to learn preferences
async function trackRejection(
  suggestion: string,
  reason?: string
): Promise<void> {
  const existing = await findSimilarRule(suggestion);

  if (existing) {
    existing.rejectionCount++;
    if (existing.rejectionCount >= 3) {
      // Auto-add as "don't suggest" rule
      await addLearnedRule({
        content: `Don't suggest: ${suggestion}`,
        source: 'learned',
        confidence: 0.8,
        reason: reason || 'Rejected 3+ times',
      });
    }
  } else {
    await createRejectionTracker(suggestion);
  }
}

// Track user acceptance to reinforce patterns
async function trackAcceptance(
  pattern: string,
  context: string
): Promise<void> {
  const existing = await findSimilarPattern(pattern);

  if (existing) {
    existing.usageCount++;
    existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
    existing.lastUsed = new Date().toISOString();
  } else if (shouldLearn(pattern, context)) {
    await addLearnedRule({
      content: pattern,
      source: 'inferred',
      confidence: 0.5,
    });
  }
}
```

### Files to Create

```
next-app/src/lib/ai/memory/
+-- agent-memory.ts           # Core memory management
+-- memory-optimizer.ts       # Auto-optimization logic
+-- memory-learning.ts        # Pattern learning
+-- memory-tokenizer.ts       # Token counting
+-- index.ts                  # Exports

next-app/src/components/ai/memory/
+-- memory-panel.tsx          # Main memory UI
+-- memory-section.tsx        # Collapsible section
+-- memory-entry.tsx          # Single entry row
+-- memory-entry-editor.tsx   # Edit modal
+-- memory-optimizer-card.tsx # Optimization suggestions
+-- token-usage-bar.tsx       # Visual token indicator
+-- add-memory-dialog.tsx     # Add new entry
```

### API Routes

```
POST   /api/ai/memory              # Create/update memory
GET    /api/ai/memory              # Get memory for workspace
DELETE /api/ai/memory/entry/:id    # Delete entry
POST   /api/ai/memory/optimize     # Trigger optimization
POST   /api/ai/memory/learn        # Record learned pattern
```

### Database Table

```typescript
// Database table
interface AgentMemoryTable {
  id: string;              // Primary key
  workspace_id: string;    // FK to workspaces
  team_id: string;         // For RLS
  content: JsonB;          // AgentMemory object
  token_count: number;     // Cached count
  created_at: timestamp;
  updated_at: timestamp;
}

// Also store as markdown file for portability
// Location: workspace_data/agent.md
```

---

[Back to AI Tool Architecture](README.md) | [Previous: Phase 4](phase-4-orchestration.md) | [Next: Phase 6](phase-6-ux-improvements.md)

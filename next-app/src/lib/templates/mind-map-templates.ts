import { NodeType } from '@/lib/types/mind-map'

export interface MindMapTemplateNode {
  id: string
  type: NodeType
  title: string
  description: string
  position: { x: number; y: number }
}

export interface MindMapTemplateEdge {
  id: string
  source: string
  target: string
}

export interface MindMapTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'product' | 'feature' | 'research'
  nodes: MindMapTemplateNode[]
  edges: MindMapTemplateEdge[]
}

// ============================================================================
// Template 1: Product Ideation
// ============================================================================

export const productIdeationTemplate: MindMapTemplate = {
  id: 'product-ideation',
  name: 'Product Ideation',
  description: 'Start with a problem, brainstorm ideas, and identify potential solutions',
  icon: '💡',
  category: 'product',
  nodes: [
    {
      id: 'node-1',
      type: 'problem',
      title: 'Customer Pain Point',
      description: 'What problem are we solving?',
      position: { x: 250, y: 100 },
    },
    {
      id: 'node-2',
      type: 'idea',
      title: 'Idea #1',
      description: 'First potential solution',
      position: { x: 100, y: 250 },
    },
    {
      id: 'node-3',
      type: 'idea',
      title: 'Idea #2',
      description: 'Second potential solution',
      position: { x: 250, y: 250 },
    },
    {
      id: 'node-4',
      type: 'idea',
      title: 'Idea #3',
      description: 'Third potential solution',
      position: { x: 400, y: 250 },
    },
    {
      id: 'node-5',
      type: 'solution',
      title: 'Chosen Solution',
      description: 'The solution we will pursue',
      position: { x: 250, y: 400 },
    },
    {
      id: 'node-6',
      type: 'question',
      title: 'Open Questions',
      description: 'What do we need to validate?',
      position: { x: 450, y: 400 },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
    { id: 'edge-2', source: 'node-1', target: 'node-3' },
    { id: 'edge-3', source: 'node-1', target: 'node-4' },
    { id: 'edge-4', source: 'node-3', target: 'node-5' },
    { id: 'edge-5', source: 'node-5', target: 'node-6' },
  ],
}

// ============================================================================
// Template 2: Feature Planning
// ============================================================================

export const featurePlanningTemplate: MindMapTemplate = {
  id: 'feature-planning',
  name: 'Feature Planning',
  description: 'Break down a feature into sub-features and components',
  icon: '🎯',
  category: 'feature',
  nodes: [
    {
      id: 'node-1',
      type: 'feature',
      title: 'Main Feature',
      description: 'Core feature to build',
      position: { x: 250, y: 100 },
    },
    {
      id: 'node-2',
      type: 'feature',
      title: 'Sub-feature A',
      description: 'First component',
      position: { x: 100, y: 250 },
    },
    {
      id: 'node-3',
      type: 'feature',
      title: 'Sub-feature B',
      description: 'Second component',
      position: { x: 250, y: 250 },
    },
    {
      id: 'node-4',
      type: 'feature',
      title: 'Sub-feature C',
      description: 'Third component',
      position: { x: 400, y: 250 },
    },
    {
      id: 'node-5',
      type: 'question',
      title: 'Technical Questions',
      description: 'What tech challenges exist?',
      position: { x: 100, y: 400 },
    },
    {
      id: 'node-6',
      type: 'solution',
      title: 'Implementation Plan',
      description: 'How we will build this',
      position: { x: 400, y: 400 },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
    { id: 'edge-2', source: 'node-1', target: 'node-3' },
    { id: 'edge-3', source: 'node-1', target: 'node-4' },
    { id: 'edge-4', source: 'node-2', target: 'node-5' },
    { id: 'edge-5', source: 'node-4', target: 'node-6' },
  ],
}

// ============================================================================
// Template 3: User Journey
// ============================================================================

export const userJourneyTemplate: MindMapTemplate = {
  id: 'user-journey',
  name: 'User Journey',
  description: 'Map out the user experience from start to finish',
  icon: '🚶',
  category: 'research',
  nodes: [
    {
      id: 'node-1',
      type: 'idea',
      title: 'User Goal',
      description: 'What the user wants to achieve',
      position: { x: 50, y: 250 },
    },
    {
      id: 'node-2',
      type: 'feature',
      title: 'Step 1: Discovery',
      description: 'User finds the product',
      position: { x: 200, y: 150 },
    },
    {
      id: 'node-3',
      type: 'feature',
      title: 'Step 2: Onboarding',
      description: 'User signs up and learns',
      position: { x: 350, y: 150 },
    },
    {
      id: 'node-4',
      type: 'feature',
      title: 'Step 3: First Use',
      description: 'User completes first task',
      position: { x: 500, y: 150 },
    },
    {
      id: 'node-5',
      type: 'problem',
      title: 'Pain Point',
      description: 'Where users get stuck',
      position: { x: 200, y: 350 },
    },
    {
      id: 'node-6',
      type: 'solution',
      title: 'Improvement Idea',
      description: 'How to fix the pain point',
      position: { x: 350, y: 350 },
    },
    {
      id: 'node-7',
      type: 'feature',
      title: 'Step 4: Success',
      description: 'User achieves their goal',
      position: { x: 650, y: 250 },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
    { id: 'edge-2', source: 'node-2', target: 'node-3' },
    { id: 'edge-3', source: 'node-3', target: 'node-4' },
    { id: 'edge-4', source: 'node-3', target: 'node-5' },
    { id: 'edge-5', source: 'node-5', target: 'node-6' },
    { id: 'edge-6', source: 'node-4', target: 'node-7' },
  ],
}

// ============================================================================
// Template Registry
// ============================================================================

export const MIND_MAP_TEMPLATES: MindMapTemplate[] = [
  productIdeationTemplate,
  featurePlanningTemplate,
  userJourneyTemplate,
]

export function getTemplateById(id: string): MindMapTemplate | undefined {
  return MIND_MAP_TEMPLATES.find((template) => template.id === id)
}

'use client'

import { NodeProps } from '@xyflow/react'
import { MindMapNodeData, NODE_TYPE_CONFIGS } from '@/lib/types/mind-map'
import { BaseNode } from './base-node'

export function SolutionNode(props: NodeProps<any>) {
  return <BaseNode {...props} config={NODE_TYPE_CONFIGS.solution} />
}

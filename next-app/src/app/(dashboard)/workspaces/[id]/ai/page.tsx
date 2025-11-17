import { ComingSoonModule } from '@/components/workspaces/coming-soon-module'

export default async function AIPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ComingSoonModule
      workspaceId={id}
      moduleName="AI Assistant"
      moduleIcon="🤖"
      description="AI chat assistant with agentic mode and tool calling"
      plannedFeatures={[
        'Chat interface with context awareness',
        'Agentic mode: AI can create, update, delete features automatically',
        '20+ tools: Create features, analyze dependencies, suggest timelines',
        'Streaming responses for real-time feedback',
        'Multiple AI models: Claude Haiku, Perplexity, Grok',
        'AI usage tracking (message count per user/month)',
        'Export chat history',
      ]}
    />
  )
}

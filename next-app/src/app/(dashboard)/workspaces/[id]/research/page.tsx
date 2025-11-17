import { ComingSoonModule } from '@/components/workspaces/coming-soon-module'

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ComingSoonModule
      workspaceId={id}
      moduleName="AI Research"
      moduleIcon="🔍"
      description="AI-powered research assistant with web search and knowledge base"
      plannedFeatures={[
        'AI chat interface with conversational search',
        'Web search integration (Perplexity, Exa)',
        'Save research findings to knowledge base',
        'Convert research into features automatically',
        'Cite sources and track research history',
        'Collaborate on research with team members',
      ]}
    />
  )
}

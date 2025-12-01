import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type for insight data from Supabase relation
interface InsightData {
  id: string;
  team_id: string;
  workspace_id: string | null;
  title: string;
  quote: string | null;
  pain_point: string | null;
  context: string | null;
  source: string;
  source_url: string | null;
  source_date: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_segment: string | null;
  customer_company: string | null;
  sentiment: string;
  impact_score: number;
  frequency: number;
  tags: string[];
  status: string;
  ai_extracted: boolean;
  ai_confidence: number | null;
  ai_summary: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/work-items/[id]/insights
 * Get all insights linked to a specific work item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: workItemId } = await params;

    // Validate user auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch work item to get team_id
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('id, team_id')
      .eq('id', workItemId)
      .single();

    if (workItemError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', workItem.team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch linked insights via junction table
    const { data: linkedInsights, error: linkError } = await supabase
      .from('work_item_insights')
      .select(
        `
        id,
        relevance_score,
        notes,
        linked_at,
        insight:customer_insights!work_item_insights_insight_id_fkey(
          id,
          team_id,
          workspace_id,
          title,
          quote,
          pain_point,
          context,
          source,
          source_url,
          source_date,
          customer_name,
          customer_email,
          customer_segment,
          customer_company,
          sentiment,
          impact_score,
          frequency,
          tags,
          status,
          ai_extracted,
          ai_confidence,
          ai_summary,
          created_by,
          created_at,
          updated_at
        ),
        linked_by_user:users!work_item_insights_linked_by_fkey(id, name, email)
      `
      )
      .eq('work_item_id', workItemId);

    if (linkError) {
      console.error('Error fetching linked insights:', linkError);
      return NextResponse.json(
        { error: 'Failed to fetch linked insights' },
        { status: 500 }
      );
    }

    // Get vote counts for each insight
    const insightIds =
      linkedInsights
        ?.filter((link) => link.insight && !Array.isArray(link.insight))
        .map((link) => (link.insight as unknown as InsightData).id) || [];

    let voteCounts: Record<string, { upvotes: number; downvotes: number }> = {};
    let linkCounts: Record<string, number> = {};

    if (insightIds.length > 0) {
      // Get votes
      const { data: votes } = await supabase
        .from('insight_votes')
        .select('insight_id, vote_type')
        .in('insight_id', insightIds);

      if (votes) {
        voteCounts = votes.reduce(
          (acc, vote) => {
            if (!acc[vote.insight_id]) {
              acc[vote.insight_id] = { upvotes: 0, downvotes: 0 };
            }
            if (vote.vote_type === 'upvote') {
              acc[vote.insight_id].upvotes++;
            } else {
              acc[vote.insight_id].downvotes++;
            }
            return acc;
          },
          {} as Record<string, { upvotes: number; downvotes: number }>
        );
      }

      // Get link counts (total work items linked to each insight)
      const { data: allLinks } = await supabase
        .from('work_item_insights')
        .select('insight_id')
        .in('insight_id', insightIds);

      if (allLinks) {
        linkCounts = allLinks.reduce(
          (acc, link) => {
            acc[link.insight_id] = (acc[link.insight_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }
    }

    // Transform to include vote counts and link metadata
    const insightsWithMeta = linkedInsights
      ?.filter((link) => link.insight && !Array.isArray(link.insight))
      .map((link) => {
        const insight = link.insight as unknown as InsightData;

        return {
          ...insight,
          // Link metadata
          link_id: link.id,
          relevance_score: link.relevance_score,
          link_notes: link.notes,
          linked_at: link.linked_at,
          linked_by_user: link.linked_by_user,
          // Computed counts
          upvote_count: voteCounts[insight.id]?.upvotes || 0,
          downvote_count: voteCounts[insight.id]?.downvotes || 0,
          vote_count:
            (voteCounts[insight.id]?.upvotes || 0) -
            (voteCounts[insight.id]?.downvotes || 0),
          linked_work_items_count: linkCounts[insight.id] || 0,
        };
      });

    return NextResponse.json({
      data: insightsWithMeta || [],
      count: insightsWithMeta?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/work-items/[id]/insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/work-items/[id]/insights
 * Link an existing insight to this work item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: workItemId } = await params;
    const body = await req.json();

    const { insight_id, relevance_score, notes } = body;

    if (!insight_id) {
      return NextResponse.json(
        { error: 'insight_id is required' },
        { status: 400 }
      );
    }

    // Validate user auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch work item to get team_id
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('id, team_id')
      .eq('id', workItemId)
      .single();

    if (workItemError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', workItem.team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify insight exists and belongs to same team
    const { data: insight, error: insightError } = await supabase
      .from('customer_insights')
      .select('id, team_id')
      .eq('id', insight_id)
      .single();

    if (insightError || !insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    if (insight.team_id !== workItem.team_id) {
      return NextResponse.json(
        { error: 'Insight belongs to a different team' },
        { status: 400 }
      );
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('work_item_insights')
      .select('id')
      .eq('work_item_id', workItemId)
      .eq('insight_id', insight_id)
      .single();

    if (existingLink) {
      return NextResponse.json(
        { error: 'Link already exists' },
        { status: 409 }
      );
    }

    // Create link
    const linkId = Date.now().toString();
    const { data: link, error: linkError } = await supabase
      .from('work_item_insights')
      .insert({
        id: linkId,
        work_item_id: workItemId,
        insight_id,
        team_id: workItem.team_id,
        relevance_score: relevance_score ?? 5,
        notes: notes || null,
        linked_by: user.id,
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error creating link:', linkError);
      return NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      );
    }

    // Update insight status to 'actionable' if it was 'new' or 'reviewed'
    await supabase
      .from('customer_insights')
      .update({ status: 'actionable', updated_at: new Date().toISOString() })
      .eq('id', insight_id)
      .in('status', ['new', 'reviewed']);

    return NextResponse.json({ data: link }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-items/[id]/insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

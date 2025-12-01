import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  CustomerInsightWithMeta,
  CreateInsightRequest,
  InsightFilters,
} from '@/lib/types/customer-insight';

/**
 * GET /api/insights
 * List insights with filters, sorting, and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    // Get required team_id
    const teamId = searchParams.get('team_id');
    if (!teamId) {
      return NextResponse.json(
        { error: 'team_id is required' },
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

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    // Parse filters
    const filters: InsightFilters = {
      workspace_id: searchParams.get('workspace_id') || undefined,
      source: searchParams.get('source') as InsightFilters['source'],
      sentiment: searchParams.get('sentiment') as InsightFilters['sentiment'],
      status: searchParams.get('status') as InsightFilters['status'],
      search: searchParams.get('search') || undefined,
    };

    // Parse pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Parse sort
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortDir = searchParams.get('sort_dir') === 'asc' ? true : false;

    // Build query
    let query = supabase
      .from('customer_insights')
      .select(
        `
        *,
        created_by_user:users!customer_insights_created_by_fkey(id, name, email),
        source_feedback:feedback!customer_insights_source_feedback_id_fkey(id, content, source_name)
      `,
        { count: 'exact' }
      )
      .eq('team_id', teamId);

    // Apply filters
    if (filters.workspace_id) {
      query = query.eq('workspace_id', filters.workspace_id);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.sentiment) {
      query = query.eq('sentiment', filters.sentiment);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      // Full-text search using tsvector
      query = query.textSearch('search_vector', filters.search, {
        type: 'websearch',
      });
    }

    // Apply sort
    query = query.order(sortBy, { ascending: sortDir });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: insights, error, count } = await query;

    if (error) {
      console.error('Error fetching insights:', error);
      return NextResponse.json(
        { error: 'Failed to fetch insights' },
        { status: 500 }
      );
    }

    // Get vote counts for each insight
    const insightIds = insights?.map((i) => i.id) || [];
    let voteCounts: Record<string, { upvotes: number; downvotes: number }> = {};

    if (insightIds.length > 0) {
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
    }

    // Get linked work item counts
    let linkCounts: Record<string, number> = {};
    if (insightIds.length > 0) {
      const { data: links } = await supabase
        .from('work_item_insights')
        .select('insight_id')
        .in('insight_id', insightIds);

      if (links) {
        linkCounts = links.reduce(
          (acc, link) => {
            acc[link.insight_id] = (acc[link.insight_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }
    }

    // Combine data
    const insightsWithMeta: CustomerInsightWithMeta[] =
      insights?.map((insight) => ({
        ...insight,
        upvote_count: voteCounts[insight.id]?.upvotes || 0,
        downvote_count: voteCounts[insight.id]?.downvotes || 0,
        vote_count:
          (voteCounts[insight.id]?.upvotes || 0) -
          (voteCounts[insight.id]?.downvotes || 0),
        linked_work_items_count: linkCounts[insight.id] || 0,
      })) || [];

    return NextResponse.json({
      data: insightsWithMeta,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insights
 * Create a new insight
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateInsightRequest = await req.json();

    // Validate required fields
    if (!body.team_id || !body.title || !body.source) {
      return NextResponse.json(
        { error: 'team_id, title, and source are required' },
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

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', body.team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    // Generate timestamp-based ID
    const id = Date.now().toString();

    // Create insight
    const { data: insight, error } = await supabase
      .from('customer_insights')
      .insert({
        id,
        team_id: body.team_id,
        workspace_id: body.workspace_id || null,
        title: body.title,
        quote: body.quote || null,
        pain_point: body.pain_point || null,
        context: body.context || null,
        source: body.source,
        source_url: body.source_url || null,
        source_date: body.source_date || null,
        customer_name: body.customer_name || null,
        customer_email: body.customer_email || null,
        customer_segment: body.customer_segment || null,
        customer_company: body.customer_company || null,
        sentiment: body.sentiment || 'neutral',
        impact_score: body.impact_score ?? 0,
        frequency: body.frequency ?? 1,
        tags: body.tags || [],
        source_feedback_id: body.source_feedback_id || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating insight:', error);
      return NextResponse.json(
        { error: 'Failed to create insight' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: insight }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

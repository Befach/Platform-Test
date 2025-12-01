import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateInsightRequest } from '@/lib/types/customer-insight';

/**
 * GET /api/insights/[id]
 * Get a single insight with linked work items
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Validate user auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch insight with relations
    const { data: insight, error } = await supabase
      .from('customer_insights')
      .select(
        `
        *,
        created_by_user:users!customer_insights_created_by_fkey(id, name, email),
        source_feedback:feedback!customer_insights_source_feedback_id_fkey(id, content, source_name)
      `
      )
      .eq('id', id)
      .single();

    if (error || !insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', insight.team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get vote counts
    const { data: votes } = await supabase
      .from('insight_votes')
      .select('vote_type')
      .eq('insight_id', id);

    const upvotes = votes?.filter((v) => v.vote_type === 'upvote').length || 0;
    const downvotes =
      votes?.filter((v) => v.vote_type === 'downvote').length || 0;

    // Get user's vote
    const { data: userVote } = await supabase
      .from('insight_votes')
      .select('vote_type')
      .eq('insight_id', id)
      .eq('voter_id', user.id)
      .single();

    // Get linked work items
    const { data: linkedWorkItems } = await supabase
      .from('work_item_insights')
      .select(
        `
        id,
        relevance_score,
        notes,
        linked_at,
        work_item:work_items!work_item_insights_work_item_id_fkey(
          id,
          name,
          type,
          status,
          priority
        ),
        linked_by_user:users!work_item_insights_linked_by_fkey(id, name, email)
      `
      )
      .eq('insight_id', id);

    return NextResponse.json({
      data: {
        ...insight,
        upvote_count: upvotes,
        downvote_count: downvotes,
        vote_count: upvotes - downvotes,
        user_vote: userVote?.vote_type || null,
        linked_work_items: linkedWorkItems || [],
        linked_work_items_count: linkedWorkItems?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/insights/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/insights/[id]
 * Update an insight
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body: UpdateInsightRequest = await req.json();

    // Validate user auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch current insight
    const { data: currentInsight, error: fetchError } = await supabase
      .from('customer_insights')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentInsight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', currentInsight.team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build update data - only include provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.quote !== undefined) updateData.quote = body.quote;
    if (body.pain_point !== undefined) updateData.pain_point = body.pain_point;
    if (body.context !== undefined) updateData.context = body.context;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.source_url !== undefined) updateData.source_url = body.source_url;
    if (body.source_date !== undefined)
      updateData.source_date = body.source_date;
    if (body.customer_name !== undefined)
      updateData.customer_name = body.customer_name;
    if (body.customer_email !== undefined)
      updateData.customer_email = body.customer_email;
    if (body.customer_segment !== undefined)
      updateData.customer_segment = body.customer_segment;
    if (body.customer_company !== undefined)
      updateData.customer_company = body.customer_company;
    if (body.sentiment !== undefined) updateData.sentiment = body.sentiment;
    if (body.impact_score !== undefined)
      updateData.impact_score = body.impact_score;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.status !== undefined) updateData.status = body.status;

    // Update insight
    const { data: updatedInsight, error: updateError } = await supabase
      .from('customer_insights')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating insight:', updateError);
      return NextResponse.json(
        { error: 'Failed to update insight' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedInsight });
  } catch (error) {
    console.error('Error in PATCH /api/insights/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/insights/[id]
 * Delete an insight (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Validate user auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch current insight
    const { data: insight, error: fetchError } = await supabase
      .from('customer_insights')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    // Validate team membership with admin role
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', insight.team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only admins can delete
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins can delete insights' },
        { status: 403 }
      );
    }

    // Delete insight (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('customer_insights')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting insight:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete insight' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Insight deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/insights/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

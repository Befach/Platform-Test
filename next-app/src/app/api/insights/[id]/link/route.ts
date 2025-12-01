import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LinkInsightRequest } from '@/lib/types/customer-insight';

/**
 * POST /api/insights/[id]/link
 * Link an insight to a work item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: insightId } = await params;
    const body: LinkInsightRequest = await req.json();

    // Validate required fields
    if (!body.work_item_id) {
      return NextResponse.json(
        { error: 'work_item_id is required' },
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

    // Fetch insight to get team_id
    const { data: insight, error: insightError } = await supabase
      .from('customer_insights')
      .select('id, team_id')
      .eq('id', insightId)
      .single();

    if (insightError || !insight) {
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

    // Verify work item exists and belongs to same team
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('id, team_id')
      .eq('id', body.work_item_id)
      .single();

    if (workItemError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    if (workItem.team_id !== insight.team_id) {
      return NextResponse.json(
        { error: 'Work item belongs to a different team' },
        { status: 400 }
      );
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('work_item_insights')
      .select('id')
      .eq('insight_id', insightId)
      .eq('work_item_id', body.work_item_id)
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
        insight_id: insightId,
        work_item_id: body.work_item_id,
        team_id: insight.team_id,
        relevance_score: body.relevance_score ?? 5,
        notes: body.notes || null,
        linked_by: user.id,
      })
      .select(
        `
        *,
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
      .eq('id', insightId)
      .in('status', ['new', 'reviewed']);

    return NextResponse.json({ data: link }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/insights/[id]/link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/insights/[id]/link
 * Remove link between insight and work item
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: insightId } = await params;
    const { searchParams } = new URL(req.url);
    const workItemId = searchParams.get('work_item_id');

    if (!workItemId) {
      return NextResponse.json(
        { error: 'work_item_id query parameter is required' },
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

    // Fetch link to verify it exists and get team_id
    const { data: link, error: linkError } = await supabase
      .from('work_item_insights')
      .select('id, team_id')
      .eq('insight_id', insightId)
      .eq('work_item_id', workItemId)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', link.team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete link
    const { error: deleteError } = await supabase
      .from('work_item_insights')
      .delete()
      .eq('id', link.id);

    if (deleteError) {
      console.error('Error deleting link:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Link removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/insights/[id]/link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VoteInsightRequest, VoteType } from '@/lib/types/customer-insight';

/**
 * POST /api/insights/[id]/vote
 * Cast or update a vote on an insight
 * Supports both authenticated team members and external voters via review links
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: insightId } = await params;
    const body: VoteInsightRequest = await req.json();

    // Validate vote type
    if (!body.vote_type || !['upvote', 'downvote'].includes(body.vote_type)) {
      return NextResponse.json(
        { error: 'vote_type must be "upvote" or "downvote"' },
        { status: 400 }
      );
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

    // Try to get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let voterEmail: string;
    let voterId: string | null = null;

    if (user) {
      // Authenticated user - verify team membership
      const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', insight.team_id)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // Get user's email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!userData?.email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        );
      }

      voterEmail = userData.email;
      voterId = user.id;
    } else {
      // External voter - must provide email
      if (!body.voter_email) {
        return NextResponse.json(
          { error: 'voter_email is required for external voters' },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.voter_email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      voterEmail = body.voter_email;
      // voterId remains null for external voters
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from('insight_votes')
      .select('id, vote_type')
      .eq('insight_id', insightId)
      .eq('voter_email', voterEmail)
      .single();

    if (existingVote) {
      // Vote exists - toggle or update
      if (existingVote.vote_type === body.vote_type) {
        // Same vote type - remove vote (toggle off)
        const { error: deleteError } = await supabase
          .from('insight_votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) {
          console.error('Error removing vote:', deleteError);
          return NextResponse.json(
            { error: 'Failed to remove vote' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Vote removed',
          data: { vote_type: null },
        });
      } else {
        // Different vote type - update vote
        const { data: updatedVote, error: updateError } = await supabase
          .from('insight_votes')
          .update({ vote_type: body.vote_type })
          .eq('id', existingVote.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating vote:', updateError);
          return NextResponse.json(
            { error: 'Failed to update vote' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Vote updated',
          data: { vote_type: updatedVote.vote_type },
        });
      }
    } else {
      // No existing vote - create new vote
      const voteId = Date.now().toString();
      const { data: newVote, error: createError } = await supabase
        .from('insight_votes')
        .insert({
          id: voteId,
          insight_id: insightId,
          team_id: insight.team_id,
          voter_id: voterId,
          voter_email: voterEmail,
          vote_type: body.vote_type,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating vote:', createError);
        return NextResponse.json(
          { error: 'Failed to create vote' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          message: 'Vote recorded',
          data: { vote_type: newVote.vote_type },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/insights/[id]/vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/insights/[id]/vote
 * Get current user's vote on an insight
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: insightId } = await params;
    const { searchParams } = new URL(req.url);
    const voterEmail = searchParams.get('voter_email');

    // Try to get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let emailToCheck: string | null = null;

    if (user) {
      // Get authenticated user's email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

      emailToCheck = userData?.email || null;
    } else if (voterEmail) {
      // External voter checking their vote
      emailToCheck = voterEmail;
    }

    if (!emailToCheck) {
      return NextResponse.json(
        { error: 'Unable to determine voter' },
        { status: 400 }
      );
    }

    // Get vote
    const { data: vote } = await supabase
      .from('insight_votes')
      .select('vote_type')
      .eq('insight_id', insightId)
      .eq('voter_email', emailToCheck)
      .single();

    // Get vote counts
    const { data: allVotes } = await supabase
      .from('insight_votes')
      .select('vote_type')
      .eq('insight_id', insightId);

    const upvotes = allVotes?.filter((v) => v.vote_type === 'upvote').length || 0;
    const downvotes =
      allVotes?.filter((v) => v.vote_type === 'downvote').length || 0;

    return NextResponse.json({
      data: {
        user_vote: vote?.vote_type || null,
        upvote_count: upvotes,
        downvote_count: downvotes,
        vote_count: upvotes - downvotes,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/insights/[id]/vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

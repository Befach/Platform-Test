import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/feedback/[id]/triage
 * Triage feedback (decide: implement, defer, or reject)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 })
    }

    const { decision, decision_reason } = body

    // Validate decision
    if (!decision || !['implement', 'defer', 'reject'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be implement, defer, or reject' },
        { status: 400 }
      )
    }

    // Verify feedback exists and belongs to team
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedback')
      .select('id, team_id, status')
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .single()

    if (checkError || !existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    // Determine new status based on decision
    let newStatus: string
    switch (decision) {
      case 'implement':
        newStatus = 'reviewed' // Will be 'implemented' after conversion
        break
      case 'defer':
        newStatus = 'deferred'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      default:
        newStatus = 'reviewed'
    }

    // Update feedback with triage decision
    const { data: updatedFeedback, error: updateError } = await supabase
      .from('feedback')
      .update({
        decision,
        decision_by: user.id,
        decision_at: new Date().toISOString(),
        decision_reason: decision_reason || null,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        implemented_in:work_items!implemented_in_id(id, name, type),
        decision_by_user:users!decision_by(id, name, email)
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedFeedback, { status: 200 })
  } catch (error: any) {
    console.error('Error triaging feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to triage feedback' },
      { status: 500 }
    )
  }
}

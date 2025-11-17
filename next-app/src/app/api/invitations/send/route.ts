import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

// Create SMTP transporter (supports any SMTP provider)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select(
        `
        *,
        teams:team_id (
          name
        ),
        inviter:invited_by (
          name,
          email
        )
      `
      )
      .eq('id', invitationId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to send this invitation
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Create invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    const invitationUrl = `${baseUrl}/accept-invite?token=${invitation.token}`

    // Send email using SMTP
    try {
      const emailInfo = await transporter.sendMail({
        from: `"Product Lifecycle Platform" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: invitation.email,
        subject: `You've been invited to join ${invitation.teams.name}`,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #2563eb;
                margin: 0;
                font-size: 28px;
              }
              .content {
                margin-bottom: 30px;
              }
              .button {
                display: inline-block;
                background: #2563eb;
                color: #ffffff !important;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
              }
              .info-box {
                background: #f8f9fa;
                border-left: 4px solid #2563eb;
                padding: 15px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 Team Invitation</h1>
              </div>

              <div class="content">
                <p>Hello!</p>

                <p>
                  <strong>${invitation.inviter.name || invitation.inviter.email}</strong>
                  has invited you to join <strong>${invitation.teams.name}</strong>
                  on the Product Lifecycle Platform.
                </p>

                <div class="info-box">
                  <strong>Role:</strong> ${invitation.role === 'admin' ? 'Admin' : 'Member'}<br>
                  ${invitation.role === 'admin'
                    ? 'You will be able to manage team members and settings.'
                    : 'You will be able to view and edit workspaces.'}
                </div>

                <p>
                  Click the button below to accept the invitation and join the team:
                </p>

                <div class="button-container">
                  <a href="${invitationUrl}" class="button">
                    Accept Invitation
                  </a>
                </div>

                <p style="font-size: 14px; color: #666;">
                  Or copy and paste this URL into your browser:<br>
                  <a href="${invitationUrl}" style="color: #2563eb; word-break: break-all;">
                    ${invitationUrl}
                  </a>
                </p>

                <p style="font-size: 14px; color: #666;">
                  This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.
                </p>
              </div>

              <div class="footer">
                <p>
                  If you weren't expecting this invitation, you can safely ignore this email.
                </p>
                <p>
                  © 2025 Product Lifecycle Platform
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      })

      console.log('Email sent successfully:', emailInfo.messageId)

      return NextResponse.json({
        success: true,
        messageId: emailInfo.messageId,
      })
    } catch (emailError: any) {
      console.error('Failed to send email:', emailError)
      return NextResponse.json(
        { error: `Failed to send invitation email: ${emailError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

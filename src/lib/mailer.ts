import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'mailpit.bugsbytes.com',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
  auth:
    process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  tls: { rejectUnauthorized: false },
})

const FROM = process.env.MAIL_FROM ?? 'TrackFlow <noreply@trackflow.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function sendPasswordResetEmail(email: string, rawToken: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${rawToken}`

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset your TrackFlow password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Reset your password</h2>
        <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color:#6b7280;font-size:13px">
          Or copy this link: <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  })
}

export async function sendInviteEmail(
  email: string,
  rawToken: string,
  options: { inviterName: string; workspace: string; role: string }
) {
  const inviteUrl = `${APP_URL}/auth/invite?token=${rawToken}`

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to ${options.workspace} on TrackFlow`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>You're invited to join ${options.workspace}</h2>
        <p>
          <strong>${options.inviterName}</strong> has invited you to join their workspace on
          TrackFlow as <strong>${options.role}</strong>.
        </p>
        <a href="${inviteUrl}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Accept Invitation
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">
          This invitation expires in <strong>7 days</strong>.
        </p>
        <p style="color:#6b7280;font-size:13px">
          Or copy this link: <a href="${inviteUrl}">${inviteUrl}</a>
        </p>
      </div>
    `,
  })
}

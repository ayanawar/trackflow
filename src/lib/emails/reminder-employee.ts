const BASE = 'font-family:system-ui,-apple-system,sans-serif;background:#0a0c14;margin:0;padding:0'
const CARD = 'background:#12141f;border:1px solid #1e2030;border-radius:12px;padding:32px;max-width:520px;margin:40px auto'
const ACCENT = '#7c6fef'

interface EmployeeReminderData {
  name: string
  trackerUrl: string
  date: string // e.g. "Monday, May 12"
}

export function reminderEmployeeHtml({ name, trackerUrl, date }: EmployeeReminderData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${BASE}">
  <div style="${CARD}">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
      <div style="width:32px;height:32px;border-radius:8px;background:${ACCENT};display:flex;align-items:center;justify-content:center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <span style="color:#fff;font-size:16px;font-weight:600">TrackFlow</span>
    </div>

    <h1 style="color:#fff;font-size:20px;font-weight:600;margin:0 0 8px">Don't forget to log your hours</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px">Hi ${name}, it looks like you haven't logged any time today.</p>

    <div style="background:#0a0c14;border:1px solid #1e2030;border-radius:8px;padding:16px;margin-bottom:24px">
      <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px">Date</p>
      <p style="color:#fff;font-size:15px;font-weight:500;margin:0">${date}</p>
    </div>

    <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px">
      Keeping your time log up to date helps your team stay aligned and ensures accurate billing. It only takes a minute — log your hours now before the end of the day.
    </p>

    <a href="${trackerUrl}"
       style="display:inline-block;padding:12px 28px;background:${ACCENT};color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
      Log my hours →
    </a>

    <p style="color:#374151;font-size:12px;margin-top:32px;border-top:1px solid #1e2030;padding-top:16px">
      You're receiving this because reminders are enabled for your TrackFlow account.
      <a href="${trackerUrl}/settings" style="color:#6b7280;text-decoration:underline">Manage preferences</a>
    </p>
  </div>
</body>
</html>`
}

export function reminderEmployeeSubject(date: string): string {
  return `Reminder: You haven't logged any hours today (${date})`
}

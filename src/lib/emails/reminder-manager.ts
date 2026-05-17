const BASE = 'font-family:system-ui,-apple-system,sans-serif;background:#0a0c14;margin:0;padding:0'
const CARD = 'background:#12141f;border:1px solid #1e2030;border-radius:12px;padding:32px;max-width:560px;margin:40px auto'
const ACCENT = '#7c6fef'

interface TeamMemberMissing {
  name: string
  email: string
}

interface ManagerReminderData {
  managerName: string
  date: string
  teamName?: string
  missing: TeamMemberMissing[]
  trackerUrl: string
}

export function reminderManagerHtml({ managerName, date, teamName, missing, trackerUrl }: ManagerReminderData): string {
  const rows = missing.map(m => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2030">
        <span style="color:#fff;font-size:14px;font-weight:500">${m.name}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2030">
        <span style="color:#6b7280;font-size:13px">${m.email}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e2030;text-align:right">
        <span style="display:inline-block;padding:2px 8px;background:#ef444420;border:1px solid #ef444440;border-radius:4px;color:#f87171;font-size:11px;font-weight:600">No entry</span>
      </td>
    </tr>`).join('')

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

    <h1 style="color:#fff;font-size:20px;font-weight:600;margin:0 0 8px">Team time tracking summary</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px">
      Hi ${managerName}, here's today's report for ${teamName ? `<strong style="color:#fff">${teamName}</strong>` : 'your team'}.
    </p>

    <div style="background:#0a0c14;border:1px solid #1e2030;border-radius:8px;padding:16px;margin-bottom:24px;display:flex;gap:32px">
      <div>
        <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px">Date</p>
        <p style="color:#fff;font-size:15px;font-weight:500;margin:0">${date}</p>
      </div>
      <div>
        <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px">Missing entries</p>
        <p style="color:#f87171;font-size:15px;font-weight:600;margin:0">${missing.length} member${missing.length !== 1 ? 's' : ''}</p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;border:1px solid #1e2030;border-radius:8px;overflow:hidden;margin-bottom:24px">
      <thead>
        <tr style="background:#0a0c14">
          <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Name</th>
          <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Email</th>
          <th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <a href="${trackerUrl}"
       style="display:inline-block;padding:12px 28px;background:${ACCENT};color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
      View time tracker →
    </a>

    <p style="color:#374151;font-size:12px;margin-top:32px;border-top:1px solid #1e2030;padding-top:16px">
      You're receiving this as a manager on TrackFlow.
      <a href="${trackerUrl}/settings" style="color:#6b7280;text-decoration:underline">Manage preferences</a>
    </p>
  </div>
</body>
</html>`
}

export function reminderManagerSubject(date: string, count: number): string {
  return `${count} team member${count !== 1 ? 's' : ''} haven't logged hours today (${date})`
}

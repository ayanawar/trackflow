const BASE = 'font-family:system-ui,-apple-system,sans-serif;background:#0a0c14;margin:0;padding:0'
const CARD = 'background:#12141f;border:1px solid #1e2030;border-radius:12px;padding:32px;max-width:520px;margin:40px auto'
const ACCENT = '#7c6fef'

interface ProjectOverrunData {
  recipientName: string
  projectName: string
  projectColor: string
  estimatedHours: number
  loggedHours: number
  overrunHours: number
  overrunPercent: number
  trackerUrl: string
}

function bar(pct: number, color: string): string {
  const capped = Math.min(pct, 100)
  return `
    <div style="background:#0a0c14;border-radius:4px;height:8px;width:100%;margin:8px 0">
      <div style="background:${color};border-radius:4px;height:8px;width:${capped}%"></div>
    </div>`
}

export function projectOverrunHtml({
  recipientName,
  projectName,
  projectColor,
  estimatedHours,
  loggedHours,
  overrunHours,
  overrunPercent,
  trackerUrl,
}: ProjectOverrunData): string {
  const budgetPct = estimatedHours > 0 ? Math.round((loggedHours / estimatedHours) * 100) : 0
  const barColor = budgetPct >= 120 ? '#ef4444' : budgetPct >= 100 ? '#f97316' : '#eab308'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${BASE}">
  <div style="${CARD}">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
      <div style="width:32px;height:32px;border-radius:8px;background:${ACCENT};display:flex;align-items:center;justify-content:center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <span style="color:#fff;font-size:16px;font-weight:600">TrackFlow</span>
    </div>

    <div style="display:inline-block;padding:3px 10px;background:#ef444420;border:1px solid #ef444440;border-radius:6px;margin-bottom:16px">
      <span style="color:#f87171;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Budget Overrun</span>
    </div>

    <h1 style="color:#fff;font-size:20px;font-weight:600;margin:0 0 8px">Project hours exceeded</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px">
      Hi ${recipientName}, the following project has exceeded its estimated hours budget.
    </p>

    <div style="background:#0a0c14;border:1px solid #1e2030;border-radius:8px;padding:20px;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <div style="width:10px;height:10px;border-radius:50%;background:${projectColor};flex-shrink:0"></div>
        <span style="color:#fff;font-size:16px;font-weight:600">${projectName}</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">
        <div>
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px">Estimated</p>
          <p style="color:#fff;font-size:18px;font-weight:700;font-family:monospace;margin:0">${estimatedHours}h</p>
        </div>
        <div>
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px">Logged</p>
          <p style="color:#f87171;font-size:18px;font-weight:700;font-family:monospace;margin:0">${loggedHours.toFixed(1)}h</p>
        </div>
        <div>
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px">Over by</p>
          <p style="color:#f97316;font-size:18px;font-weight:700;font-family:monospace;margin:0">+${overrunHours.toFixed(1)}h</p>
        </div>
      </div>

      ${bar(budgetPct, barColor)}
      <p style="color:#6b7280;font-size:12px;text-align:right;margin:4px 0 0">${budgetPct}% of budget used (+${overrunPercent}% over)</p>
    </div>

    <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px">
      Review the project timeline and consider adjusting the budget estimate or scope with the relevant stakeholders.
    </p>

    <a href="${trackerUrl}"
       style="display:inline-block;padding:12px 28px;background:${ACCENT};color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
      Review project →
    </a>

    <p style="color:#374151;font-size:12px;margin-top:32px;border-top:1px solid #1e2030;padding-top:16px">
      You're receiving this as a project manager on TrackFlow.
      <a href="${trackerUrl}/settings" style="color:#6b7280;text-decoration:underline">Manage preferences</a>
    </p>
  </div>
</body>
</html>`
}

export function projectOverrunSubject(projectName: string, overrunPercent: number): string {
  return `Budget alert: "${projectName}" is ${overrunPercent}% over estimated hours`
}

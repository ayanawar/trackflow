import { checkRateLimit } from '@/lib/rateLimit'

export class RateLimitError extends Error {
  constructor() { super('Rate limit exceeded'); this.name = 'RateLimitError' }
}

export class ServiceUnavailableError extends Error {
  constructor() { super('AI service unavailable'); this.name = 'ServiceUnavailableError' }
}

async function callGemini(systemPrompt: string, userContent: string, maxTokens = 800): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new ServiceUnavailableError()

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }
  )

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)

  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response.'
}

export async function askAI(userId: string, question: string, context: object): Promise<{ answer: string }> {
  const { allowed } = checkRateLimit(userId, 10, 60_000)
  if (!allowed) throw new RateLimitError()

  const systemPrompt = "You are an AI assistant inside TrackFlow, a time tracking app. Analyze the user's data and give concise, actionable advice. Use bullet points for lists. Keep responses under 200 words."

  try {
    const answer = await callGemini(systemPrompt, `${JSON.stringify(context)}\n\nQuestion: ${question}`)
    return { answer }
  } catch (err) {
    console.error('[insights.service] Gemini error:', err)
    throw new ServiceUnavailableError()
  }
}

export async function generateWeeklySummary(userId: string, context: {
  weekSeconds: number
  billableSeconds: number
  entryCount: number
  projects: { name: string; totalSeconds: number }[]
  dailyTotals: { date: string; seconds: number }[]
  topTags: { name: string; seconds: number }[]
}): Promise<{ summary: string }> {
  const { allowed } = checkRateLimit(userId, 5, 60_000)
  if (!allowed) throw new RateLimitError()

  const systemPrompt = `You are an AI assistant inside TrackFlow, a time tracking app.
Generate a concise weekly summary in 3-4 short sentences covering:
1. Total hours logged and billable ratio
2. Top project(s) and focus areas
3. One concrete suggestion to improve productivity or balance next week.
Be direct and specific. Use plain text (no markdown).`

  try {
    const summary = await callGemini(systemPrompt, JSON.stringify(context), 400)
    return { summary }
  } catch (err) {
    console.error('[insights.service] weekly summary error:', err)
    throw new ServiceUnavailableError()
  }
}

export async function getTimeSuggestions(userId: string, context: {
  weekSeconds: number
  projects: { name: string; totalSeconds: number }[]
  recentDescriptions: string[]
}): Promise<{ suggestions: string[] }> {
  const { allowed } = checkRateLimit(userId, 5, 60_000)
  if (!allowed) throw new RateLimitError()

  const systemPrompt = `You are an AI assistant inside TrackFlow, a time tracking app.
Based on the user's recent time tracking patterns, suggest 3 natural language queries they might want to ask.
Return ONLY a JSON array of 3 short question strings (under 10 words each), e.g.:
["How many hours this week?", "Which project took the most time?", "Am I hitting 40 hours?"]
No explanation, just the JSON array.`

  try {
    const raw = await callGemini(systemPrompt, JSON.stringify(context), 200)
    const match = raw.match(/\[[\s\S]*\]/)
    const suggestions: string[] = match ? JSON.parse(match[0]) : [
      'How many hours did I log this week?',
      'Which project took the most time?',
      'Am I on track for 40 hours?',
    ]
    return { suggestions: suggestions.slice(0, 3) }
  } catch (err) {
    console.error('[insights.service] suggestions error:', err)
    return {
      suggestions: [
        'How many hours did I log this week?',
        'Which project took the most time?',
        'Am I on track for 40 hours?',
      ],
    }
  }
}

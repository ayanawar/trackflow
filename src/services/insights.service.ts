import { checkRateLimit } from '@/lib/rateLimit'

export class RateLimitError extends Error {
  constructor() { super('Rate limit exceeded'); this.name = 'RateLimitError' }
}

export class ServiceUnavailableError extends Error {
  constructor() { super('AI service unavailable'); this.name = 'ServiceUnavailableError' }
}

export async function askAI(userId: string, question: string, context: object): Promise<{ answer: string }> {
  const { allowed } = checkRateLimit(userId, 10, 60_000)
  if (!allowed) throw new RateLimitError()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new ServiceUnavailableError()

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 800,
        system: "You are an AI assistant inside TrackFlow, a time tracking app. Analyze the user's data and give concise, actionable advice. Use bullet points for lists. Keep responses under 200 words.",
        messages: [{ role: 'user', content: `${JSON.stringify(context)}\n\nQuestion: ${question}` }],
      }),
    })

    if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)

    const data = await res.json() as { content?: { text?: string }[] }
    const answer = data.content?.[0]?.text ?? 'No response.'
    return { answer }
  } catch (err) {
    console.error('[insights.service] Anthropic error:', err)
    throw new ServiceUnavailableError()
  }
}

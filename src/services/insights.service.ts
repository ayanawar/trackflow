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

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new ServiceUnavailableError()

  const systemPrompt = "You are an AI assistant inside TrackFlow, a time tracking app. Analyze the user's data and give concise, actionable advice. Use bullet points for lists. Keep responses under 200 words."

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: `${JSON.stringify(context)}\n\nQuestion: ${question}` }] }],
          generationConfig: { maxOutputTokens: 800 },
        }),
      }
    )

    if (!res.ok) throw new Error(`Gemini error: ${res.status}`)

    const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response.'
    return { answer }
  } catch (err) {
    console.error('[insights.service] Gemini error:', err)
    throw new ServiceUnavailableError()
  }
}

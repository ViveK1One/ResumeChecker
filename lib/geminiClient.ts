const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export const GEMINI_MODELS_TO_TRY = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite']

export async function callGeminiAPIWithModel(
  prompt: string,
  model: string,
  apiKey: string,
  retryOn429 = true,
  options?: { maxOutputTokens?: number; temperature?: number }
): Promise<string> {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options?.temperature ?? (model.startsWith('gemini-2.5') ? 1 : 0.2),
      maxOutputTokens: options?.maxOutputTokens ?? 8192,
      topP: 0.95,
    },
  }

  if (model.startsWith('gemini-2.5')) {
    ;(body.generationConfig as Record<string, unknown>).topK = 64
  } else {
    ;(body.generationConfig as Record<string, unknown>).topK = 40
    body.safetySettings = [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    ]
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    const errDetail = data?.error?.message || JSON.stringify(data)
    if (response.status === 429 && retryOn429) {
      await new Promise((r) => setTimeout(r, 10000))
      return callGeminiAPIWithModel(prompt, model, apiKey, false, options)
    }
    throw new Error(`Gemini API error (${response.status}): ${errDetail}`)
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason || 'unknown'
    throw new Error(`Gemini returned no text. Finish reason: ${reason}`)
  }

  return text
}

export async function tryGeminiModels(
  prompt: string,
  apiKey: string,
  options?: { maxOutputTokens?: number; temperature?: number }
): Promise<string> {
  let last = ''
  for (const model of GEMINI_MODELS_TO_TRY) {
    try {
      return await callGeminiAPIWithModel(prompt, model, apiKey, true, options)
    } catch (e) {
      last = e instanceof Error ? e.message : String(e)
    }
  }
  throw new Error(last || 'All Gemini models failed')
}

export function extractJsonObject(text: string): unknown {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) throw new Error('Response did not contain JSON object')
  return JSON.parse(text.substring(firstBrace, lastBrace + 1))
}

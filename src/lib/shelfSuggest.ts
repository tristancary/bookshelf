import { mapSubjectsToShelves, isKnownShelf, type Shelf } from './shelfMapping'

const KNOWN_SHELVES: Shelf[] = [
  'Kids',
  'Fiction',
  'Sci-Fi',
  'Fantasy',
  'Non-Fiction',
  'Reference',
  'Cookbook',
]

export type ShelfSuggestionInput = {
  title: string
  authors: string[]
  categories: string[]
  description?: string | null
}

export type ShelfSuggestionResult = {
  shelves: string[]
  source: 'rules' | 'llm' | 'none'
}

/**
 * Two-stage shelf suggestion:
 *   1. Deterministic rules on subjects/categories (free, instant)
 *   2. If rules produce nothing, fall back to DeepSeek (~1-2s, cheap)
 */
export async function suggestShelves(
  input: ShelfSuggestionInput
): Promise<ShelfSuggestionResult> {
  // Stage 1: rules
  const ruleHits = mapSubjectsToShelves(input.categories)
  if (ruleHits.length > 0) {
    return { shelves: ruleHits, source: 'rules' }
  }

  // Stage 2: LLM fallback
  if (!process.env.DEEPSEEK_API_KEY) {
    return { shelves: [], source: 'none' }
  }

  try {
    const llmShelves = await classifyWithDeepSeek(input)
    if (llmShelves.length > 0) {
      return { shelves: llmShelves, source: 'llm' }
    }
  } catch (err) {
    console.error('DeepSeek shelf classification failed:', err)
  }

  return { shelves: [], source: 'none' }
}

async function classifyWithDeepSeek(
  input: ShelfSuggestionInput
): Promise<string[]> {
  const system = `You classify books into predefined shelf tags for a family library. Return ONLY a JSON object like {"shelves":["Kids","Fiction"]} with 1-3 shelves from this exact list: ${KNOWN_SHELVES.join(', ')}. No explanation, no other text, no markdown fences. If the book is fiction for kids, use both "Kids" and "Fiction". If it's a specific fiction genre like Sci-Fi or Fantasy, don't also include Fiction.`

  const user = `Title: ${input.title}
Authors: ${input.authors.join(', ') || 'Unknown'}
Metadata categories: ${input.categories.join(', ') || 'None'}
Description: ${(input.description ?? '').slice(0, 500) || 'None'}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.1,
        max_tokens: 60,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    if (!res.ok) return []

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(raw)
    const shelves = Array.isArray(parsed.shelves) ? parsed.shelves : []

    // Whitelist: only accept shelves from the known list
    return shelves.filter((s: unknown): s is Shelf =>
      typeof s === 'string' && isKnownShelf(s)
    )
  } finally {
    clearTimeout(timeout)
  }
}

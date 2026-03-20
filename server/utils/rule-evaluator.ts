import type { MatchMode, Subscription } from './db'
import type { FeedItem } from './rss'

export interface RuleEvaluationResult {
  matched: boolean
  excluded: boolean
  matchedKeywords: string[]
  excludedKeywords: string[]
  text: string
}

function normalizeText(input: string) {
  return input.trim().toLowerCase()
}

function uniq(values: string[]) {
  return Array.from(new Set(values))
}

export function evaluateTextRule(input: {
  title: string
  description?: string
  keywords: string[]
  excludeKeywords: string[]
  matchMode: MatchMode
}): RuleEvaluationResult {
  const text = `${input.title}\n${input.description || ''}`
  const normalized = normalizeText(text)

  const keywords = uniq(input.keywords.map((item) => item.trim()).filter(Boolean))
  const excludeKeywords = uniq(input.excludeKeywords.map((item) => item.trim()).filter(Boolean))

  const matchedKeywords = keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()))
  const excludedKeywords = excludeKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase()))

  if (excludedKeywords.length > 0) {
    return {
      matched: false,
      excluded: true,
      matchedKeywords,
      excludedKeywords,
      text
    }
  }

  const matched = input.matchMode === 'all'
    ? matchedKeywords.length === keywords.length && keywords.length > 0
    : matchedKeywords.length > 0

  return {
    matched,
    excluded: false,
    matchedKeywords,
    excludedKeywords,
    text
  }
}

export function evaluateFeedItemAgainstSubscription(item: FeedItem, subscription: Subscription) {
  return evaluateTextRule({
    title: item.title,
    description: item.description,
    keywords: subscription.keywords,
    excludeKeywords: subscription.excludeKeywords,
    matchMode: subscription.matchMode
  })
}

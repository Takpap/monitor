import { XMLParser } from 'fast-xml-parser'

export interface FeedItem {
  sourceFeedUrl: string
  uniqueId: string
  articleId: string | null
  title: string
  link: string
  comments: string
  description: string
  imageUrl: string | null
  pubDate: string
  pubTimestamp: number
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  cdataPropName: '__cdata'
})

function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function pickText(value: any): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    if (typeof value.__cdata === 'string') return value.__cdata.trim()
    if (typeof value['#text'] === 'string') return value['#text'].trim()
    return String(value).trim()
  }
  return String(value).trim()
}

function normalizeFeedItem(rawItem: any, sourceFeedUrl: string): FeedItem | null {
  if (!rawItem) return null

  const title = pickText(rawItem.title)
  const link = pickText(rawItem.link)
  const description = pickText(rawItem.description)
  const comments = pickText(rawItem.comments)
  const pubDate = pickText(rawItem.pubDate)
  const guid = pickText(rawItem.guid)

  if (!title || !link) return null

  const articleIdMatch = link.match(/\/p\/(\d+)/)
  const articleId = articleIdMatch ? articleIdMatch[1] : null
  const pubTimestamp = Number.isFinite(Date.parse(pubDate)) ? Date.parse(pubDate) : Date.now()
  const uniqueId = articleId || guid || link

  const imgMatch = description.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i)
  const imageUrl = imgMatch ? imgMatch[1] : null

  return {
    sourceFeedUrl,
    uniqueId,
    articleId,
    title,
    link,
    comments,
    description,
    imageUrl,
    pubDate,
    pubTimestamp
  }
}

async function fetchText(url: string, timeoutMs: number, userAgent: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: '*/*'
      },
      redirect: 'follow',
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchFeedItems(input: {
  feedUrls: string[]
  timeoutMs: number
  userAgent: string
}) {
  const allItems: FeedItem[] = []

  for (const feedUrl of input.feedUrls) {
    try {
      const xml = await fetchText(feedUrl, input.timeoutMs, input.userAgent)
      const parsed = parser.parse(xml)
      const channel = parsed?.rss?.channel
      const items = ensureArray(channel?.item)

      for (const rawItem of items) {
        const item = normalizeFeedItem(rawItem, feedUrl)
        if (item) allItems.push(item)
      }
    } catch (error: any) {
      console.error(`[feed] 拉取失败 ${feedUrl}: ${error?.message || error}`)
    }
  }

  const deduped = new Map<string, FeedItem>()
  for (const item of allItems) {
    if (!deduped.has(item.uniqueId)) deduped.set(item.uniqueId, item)
  }

  return Array.from(deduped.values()).sort((a, b) => a.pubTimestamp - b.pubTimestamp)
}

function looksLikeBlockedPage(text: string) {
  const hints = [
    'probe.js',
    'probev3.js',
    'x-waf-captcha',
    'TencentCaptcha',
    'var buid = "fffffffffffffffffff"'
  ]

  return hints.some((hint) => text.includes(hint))
}

function extractCommentCount(html: string) {
  const patterns = [
    /"comment_count"\s*:\s*(\d+)/i,
    /"commentNum"\s*:\s*(\d+)/i,
    /"comment_num"\s*:\s*(\d+)/i,
    /commentCount\s*[:=]\s*(\d+)/i,
    /(\d+)\s*条评论/,
    /评论\s*\(?\s*(\d+)\s*\)?/,
    /id=["']comment_num["'][^>]*>\s*(\d+)\s*</i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && Number.isInteger(parseInt(match[1], 10))) {
      return parseInt(match[1], 10)
    }
  }

  return null
}

export async function fetchCommentCount(item: FeedItem, input: { timeoutMs: number; userAgent: string }) {
  const urls = [item.link, item.comments?.replace(/#comments$/, ''), item.comments].filter(Boolean)
  const visited = new Set<string>()

  for (const url of urls) {
    if (!url || visited.has(url)) continue
    visited.add(url)

    try {
      const html = await fetchText(url, input.timeoutMs, input.userAgent)
      if (looksLikeBlockedPage(html)) continue

      const count = extractCommentCount(html)
      if (count !== null) return count
    } catch {
      // ignore
    }
  }

  return null
}

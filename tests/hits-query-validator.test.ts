import { describe, expect, test } from 'bun:test'
import { hitsQuerySchema } from '../server/utils/validators'

describe('hitsQuerySchema', () => {
  test('should parse minimal query with defaults', () => {
    const parsed = hitsQuerySchema.parse({})
    expect(parsed.limit).toBe(50)
    expect(parsed.ownerId).toBeUndefined()
    expect(parsed.subscriptionId).toBeUndefined()
  })

  test('should parse values from query strings', () => {
    const parsed = hitsQuerySchema.parse({
      limit: '100',
      ownerId: 'team-a',
      subscriptionId: '6',
      cursorId: '22',
      keyword: ' iPhone ',
      commentMin: '0',
      commentMax: '120',
    })

    expect(parsed).toEqual({
      limit: 100,
      ownerId: 'team-a',
      subscriptionId: 6,
      cursorId: 22,
      keyword: 'iPhone',
      commentMin: 0,
      commentMax: 120
    })
  })

  test('should reject min greater than max', () => {
    const parsed = hitsQuerySchema.safeParse({
      commentMin: '50',
      commentMax: '10'
    })

    expect(parsed.success).toBe(false)
  })
})

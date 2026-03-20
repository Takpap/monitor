import { describe, expect, test } from 'bun:test'
import {
  buildHitsQueryParams,
  normalizeKeywords,
  parseLines,
  parsePositiveInt,
  toInt
} from '../composables/monitor-console/utils'

describe('monitor-console utils', () => {
  test('parseLines should split by newline/comma and dedupe', () => {
    const result = parseLines(' iPhone, 国补\n iPhone ， NAS ')
    expect(result).toEqual(['iPhone', '国补', 'NAS'])
  })

  test('normalizeKeywords should trim and dedupe', () => {
    const result = normalizeKeywords([' iPhone ', 'iPhone', 'NAS', ''])
    expect(result).toEqual(['iPhone', 'NAS'])
  })

  test('toInt and parsePositiveInt should parse number safely', () => {
    expect(toInt('12', 0)).toBe(12)
    expect(toInt('x', 99)).toBe(99)
    expect(parsePositiveInt('10')).toBe(10)
    expect(parsePositiveInt('0')).toBeUndefined()
    expect(parsePositiveInt('-1')).toBeUndefined()
  })

  test('buildHitsQueryParams should build filter and cursor params', () => {
    const params = buildHitsQueryParams({
      ownerId: 'team-a',
      limit: 500,
      subscriptionId: '8',
      keyword: 'iPhone',
      commentMin: '0',
      commentMax: '50',
      reset: false,
      cursorId: 123
    })

    expect(params.get('ownerId')).toBe('team-a')
    expect(params.get('limit')).toBe('200')
    expect(params.get('subscriptionId')).toBe('8')
    expect(params.get('keyword')).toBe('iPhone')
    expect(params.get('commentMin')).toBe('0')
    expect(params.get('commentMax')).toBe('50')
    expect(params.get('cursorId')).toBe('123')
  })

  test('buildHitsQueryParams should omit cursor when reset=true', () => {
    const params = buildHitsQueryParams({
      ownerId: '',
      limit: 20,
      subscriptionId: '',
      keyword: '',
      commentMin: '',
      commentMax: '',
      reset: true,
      cursorId: 999
    })

    expect(params.get('cursorId')).toBeNull()
    expect(params.get('limit')).toBe('20')
  })
})

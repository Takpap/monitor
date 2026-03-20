import { describe, expect, test } from 'bun:test'
import {
  buildOwnerQuery,
  parseHeaders,
  parseRequestError,
  stringifyHeaders,
  versionActionLabel,
} from '../composables/monitor-console/format'

describe('monitor-console format helpers', () => {
  test('parseHeaders should parse colon key-value lines', () => {
    expect(parseHeaders('Authorization: Bearer x\nX-Trace-Id: abc\nno-colon')).toEqual({
      Authorization: 'Bearer x',
      'X-Trace-Id': 'abc',
    })
  })

  test('stringifyHeaders should serialize header map', () => {
    expect(stringifyHeaders({ A: '1', B: '2' })).toBe('A: 1\nB: 2')
  })

  test('buildOwnerQuery should trim and encode ownerId', () => {
    expect(buildOwnerQuery(' default ')).toBe('ownerId=default')
    expect(buildOwnerQuery(' a/b ')).toBe('ownerId=a%2Fb')
    expect(buildOwnerQuery('   ')).toBe('')
  })

  test('parseRequestError should select message with fallback', () => {
    expect(parseRequestError({ data: { statusMessage: 'bad request' } })).toBe('bad request')
    expect(parseRequestError({ statusMessage: 'status message' })).toBe('status message')
    expect(parseRequestError({ message: 'runtime message' })).toBe('runtime message')
    expect(parseRequestError({})).toBe('请求失败，请稍后重试')
  })

  test('versionActionLabel should map action to label', () => {
    expect(versionActionLabel('create')).toBe('创建')
    expect(versionActionLabel('update')).toBe('更新')
    expect(versionActionLabel('rollback')).toBe('回滚')
    expect(versionActionLabel('delete')).toBe('删除')
  })
})

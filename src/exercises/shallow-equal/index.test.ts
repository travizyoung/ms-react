import { describe, expect, it } from 'vitest'
import { shallowEqual } from '.'

describe('shallowEqual', () => {
  it('同一个引用永远相等', () => {
    const value = { a: 1 }

    expect(shallowEqual(value, value)).toBe(true)
    expect(shallowEqual([], [])).toBe(true)
  })

  it('基本类型按 Object.is 比较', () => {
    expect(shallowEqual(1, 1)).toBe(true)
    expect(shallowEqual('a', 'a')).toBe(true)
    expect(shallowEqual(NaN, NaN)).toBe(true)
    expect(shallowEqual(0, -0)).toBe(false)
    expect(shallowEqual(1, '1')).toBe(false)
    expect(shallowEqual(null, undefined)).toBe(false)
  })

  it('对象只比第一层，值相同即相等', () => {
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true)
    // key 顺序不影响结果
    expect(shallowEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
  })

  it('嵌套对象按引用比较（memo 被击穿的根因）', () => {
    expect(shallowEqual({ list: [1, 2] }, { list: [1, 2] })).toBe(false)

    const list = [1, 2]
    expect(shallowEqual({ list }, { list })).toBe(true)
  })

  it('key 数量不同或值不同都不相等', () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
  })

  it('原型上的属性不参与比较', () => {
    const base = { a: 1 }
    const child = Object.create(base) as { a?: number; b?: number }

    expect(shallowEqual(child, {})).toBe(true)
  })

  it('数组按索引 key 比较，长度不同不相等', () => {
    expect(shallowEqual([1, 2], [1, 2])).toBe(true)
    expect(shallowEqual([1, 2], [2, 1])).toBe(false)
    expect(shallowEqual([1], [1, 2])).toBe(false)
  })

  it('和 React 一样不区分数组与对象：只看自有 key 与值', () => {
    // React 的 shallowEqual 不检查 Array.isArray，空数组与空对象 key 都为空，因此相等
    expect(shallowEqual([], {})).toBe(true)
    // 数组的 length 是非枚举属性，不参与比较，所以 { 0: 'a' } 与 ['a'] 视为相同
    expect(shallowEqual({ 0: 'a' }, ['a'])).toBe(true)
    expect(shallowEqual([1], [1, 2])).toBe(false)
  })

  it('空对象与空对象相等', () => {
    expect(shallowEqual({}, {})).toBe(true)
  })
})

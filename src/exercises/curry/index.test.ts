import { describe, expect, it, vi } from 'vitest'
import { curry } from '.'

describe('curry', () => {
  it('逐个传参时返回函数，参数够了才求值', () => {
    const add3 = (a: number, b: number, c: number) => a + b + c
    const curried = curry(add3)

    expect(typeof curried(1)).toBe('function')
    expect(typeof (curried(1) as (b: number) => unknown)(2)).toBe('function')
    expect((((curried(1) as (b: number) => (c: number) => number)(2))(3))).toBe(6)
  })

  it('支持一次性或分批传参', () => {
    const add3 = (a: number, b: number, c: number) => a + b + c

    expect((curry(add3)(1, 2, 3))).toBe(6)
    expect(((curry(add3)(1, 2) as (c: number) => number)(3))).toBe(6)
  })

  it('显式指定 arity 时按 arity 判断（支持含默认值/剩余参数的函数）', () => {
    const fn = vi.fn((a: number, b: number, c = 0) => a + b + c)
    const curried = curry(fn, 2)

    const result = curried(1, 2)

    expect(result).toBe(3)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('参数不足时不调用原函数', () => {
    const fn = vi.fn((a: number, b: number) => a + b)
    const curried = curry(fn)

    curried(1)

    expect(fn).not.toHaveBeenCalled()
  })
})

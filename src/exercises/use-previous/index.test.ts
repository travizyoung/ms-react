import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrevious } from '.'

describe('usePrevious', () => {
  it('首次渲染没有上一个值', () => {
    const { result } = renderHook(() => usePrevious(1))

    expect(result.current).toBeUndefined()
  })

  it('重渲染后返回上一次的值', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    expect(result.current).toBe('a')

    rerender({ value: 'c' })
    expect(result.current).toBe('b')
  })

  it('值不变时保持上一次的值不变', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    })

    rerender({ value: 2 })
    expect(result.current).toBe(1)

    rerender({ value: 2 })
    expect(result.current).toBe(2)
  })

  it('对象按引用保存，不会克隆', () => {
    const first = { id: 1 }
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: first },
    })

    const second = { id: 2 }
    rerender({ value: second })
    expect(result.current).toBe(first)
  })
})

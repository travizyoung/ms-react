import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useToggle } from '.'

describe('useToggle', () => {
  it('默认初始值为 false', () => {
    const { result } = renderHook(() => useToggle())

    expect(result.current[0]).toBe(false)
  })

  it('可以指定初始值', () => {
    const { result } = renderHook(() => useToggle(true))

    expect(result.current[0]).toBe(true)
  })

  it('不传参时在 true / false 之间切换', () => {
    const { result } = renderHook(() => useToggle())

    act(() => result.current[1]())
    expect(result.current[0]).toBe(true)

    act(() => result.current[1]())
    expect(result.current[0]).toBe(false)
  })

  it('传入显式值时直接设为该值', () => {
    const { result } = renderHook(() => useToggle())

    act(() => result.current[1](true))
    expect(result.current[0]).toBe(true)

    act(() => result.current[1](true))
    expect(result.current[0]).toBe(true)
  })

  it('toggle 引用稳定，不会因为重渲染变化', () => {
    const { result, rerender } = renderHook(() => useToggle())
    const first = result.current[1]

    rerender()

    expect(result.current[1]).toBe(first)
  })
})

import { describe, expect, it } from 'vitest'
import { getTotalHeight, getVisibleRange } from '.'

const base = { viewportHeight: 320, itemHeight: 32 } as const

describe('getVisibleRange', () => {
  it('滚动到顶部时渲染视口内的行（end 不含）', () => {
    const range = getVisibleRange({ ...base, scrollTop: 0, total: 1000 })

    expect(range.start).toBe(0)
    expect(range.end).toBe(11)
    expect(range.offsetY).toBe(0)
  })

  it('滚动后按整行推进 start', () => {
    const range = getVisibleRange({ ...base, scrollTop: 320, total: 1000 })

    expect(range.start).toBe(10)
    expect(range.end).toBe(21)
    expect(range.offsetY).toBe(320)
  })

  it('overscan 上下各多渲染缓冲行并夹紧边界', () => {
    const top = getVisibleRange({ ...base, scrollTop: 0, total: 1000, overscan: 3 })
    expect(top.start).toBe(0)
    expect(top.end).toBe(14)

    const middle = getVisibleRange({ ...base, scrollTop: 320, total: 1000, overscan: 3 })
    expect(middle.start).toBe(7)
    expect(middle.end).toBe(24)
  })

  it('scrollTop 为负数或超出最大滚动距离时夹紧', () => {
    const negative = getVisibleRange({ ...base, scrollTop: -100, total: 100 })
    expect(negative.start).toBe(0)

    const maxScrollTop = 100 * 32 - 320
    const overflow = getVisibleRange({ ...base, scrollTop: maxScrollTop + 500, total: 100 })
    expect(overflow.end).toBe(100)
    expect(overflow.start).toBeLessThanOrEqual(99)
  })

  it('最后一行始终能被渲染到', () => {
    const range = getVisibleRange({ ...base, scrollTop: 1000, total: 5, overscan: 0 })

    expect(range.start).toBeLessThanOrEqual(4)
    expect(range.end).toBe(5)
  })

  it('内容不足一屏时全量渲染', () => {
    const range = getVisibleRange({ ...base, scrollTop: 0, total: 3, overscan: 2 })

    expect(range).toEqual({ start: 0, end: 3, offsetY: 0 })
  })

  it('空数据或零高视口返回空范围', () => {
    expect(getVisibleRange({ ...base, scrollTop: 100, total: 0 })).toEqual({
      start: 0,
      end: 0,
      offsetY: 0,
    })
    expect(
      getVisibleRange({ ...base, scrollTop: 0, viewportHeight: 0, total: 100 }),
    ).toEqual({ start: 0, end: 0, offsetY: 0 })
  })

  it('itemHeight 非法时抛错，避免除零得到 Infinity', () => {
    expect(() => getVisibleRange({ ...base, scrollTop: 0, total: 10, itemHeight: 0 })).toThrow(
      RangeError,
    )
  })

  it('end 永远不超过 total', () => {
    const range = getVisibleRange({ ...base, scrollTop: 0, total: 2, overscan: 100 })

    expect(range.end).toBe(2)
  })
})

describe('getTotalHeight', () => {
  it('按行数乘行高计算撑开高度', () => {
    expect(getTotalHeight(1000, 32)).toBe(32000)
  })

  it('空数据或非法行高返回 0', () => {
    expect(getTotalHeight(0, 32)).toBe(0)
    expect(getTotalHeight(10, 0)).toBe(0)
  })
})

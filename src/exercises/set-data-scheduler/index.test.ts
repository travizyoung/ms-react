import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBatchedSetData, mergePatches } from '.'

describe('mergePatches', () => {
  it('后写覆盖同名 key，保留其余字段', () => {
    expect(mergePatches({ a: 1, b: 2 }, { b: 3, c: 4 })).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('路径 key 按普通 key 处理', () => {
    expect(mergePatches({ 'list[0].price': 1 }, { 'list[1].price': 2 })).toEqual({
      'list[0].price': 1,
      'list[1].price': 2,
    })
  })

  it('不修改入参', () => {
    const base = { a: 1 }

    mergePatches(base, { b: 2 })

    expect(base).toEqual({ a: 1 })
  })
})

describe('createBatchedSetData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('同一窗口内多次 setData 合并成一次 flush', () => {
    const onFlush = vi.fn()
    const batched = createBatchedSetData({ onFlush })

    batched.setData({ keyword: 'r' })
    batched.setData({ keyword: 're' })
    batched.setData({ page: 2 })
    expect(onFlush).not.toHaveBeenCalled()

    vi.runAllTimers()

    expect(onFlush).toHaveBeenCalledTimes(1)
    expect(onFlush).toHaveBeenCalledWith({ keyword: 're', page: 2 })
    expect(batched.getStats()).toEqual({ calls: 3, flushes: 1 })
  })

  it('delay 内不发送，超过 delay 才发送', () => {
    const onFlush = vi.fn()
    const batched = createBatchedSetData({ onFlush, delay: 100 })

    batched.setData({ a: 1 })
    vi.advanceTimersByTime(99)
    expect(onFlush).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onFlush).toHaveBeenCalledWith({ a: 1 })
  })

  it('手动 flush 立即发送并取消定时器，不会重复发送', () => {
    const onFlush = vi.fn()
    const batched = createBatchedSetData({ onFlush, delay: 100 })

    batched.setData({ a: 1 })
    batched.setData({ b: 2 })
    batched.flush()

    expect(onFlush).toHaveBeenCalledTimes(1)
    expect(onFlush).toHaveBeenCalledWith({ a: 1, b: 2 })

    vi.runAllTimers()
    expect(onFlush).toHaveBeenCalledTimes(1)
  })

  it('cancel 后不发送已累积的数据', () => {
    const onFlush = vi.fn()
    const batched = createBatchedSetData({ onFlush })

    batched.setData({ a: 1 })
    batched.cancel()
    vi.runAllTimers()

    expect(onFlush).not.toHaveBeenCalled()
  })

  it('空 patch 不产生调用也不产生消息', () => {
    const onFlush = vi.fn()
    const batched = createBatchedSetData({ onFlush })

    batched.setData({})
    vi.runAllTimers()

    expect(onFlush).not.toHaveBeenCalled()
    expect(batched.getStats()).toEqual({ calls: 0, flushes: 0 })
  })

  it('flush 之后可以继续累积下一批', () => {
    const onFlush = vi.fn()
    const batched = createBatchedSetData({ onFlush })

    batched.setData({ a: 1 })
    vi.runAllTimers()
    batched.setData({ b: 2 })
    vi.runAllTimers()

    expect(onFlush).toHaveBeenNthCalledWith(1, { a: 1 })
    expect(onFlush).toHaveBeenNthCalledWith(2, { b: 2 })
    expect(batched.getStats()).toEqual({ calls: 2, flushes: 2 })
  })

  it('发送的是快照，之后修改原 patch 不影响已发送数据', () => {
    const onFlush = vi.fn()
    const batched = createBatchedSetData({ onFlush })
    const patch = { a: 1 }

    batched.setData(patch)
    patch.a = 99
    vi.runAllTimers()

    expect(onFlush).toHaveBeenCalledWith({ a: 1 })
  })
})

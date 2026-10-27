/**
 * 手写 setData 合并调度器（小程序性能优化的核心手段）。
 *
 * 小程序逻辑层和渲染层是两个线程，每次 setData 都要序列化数据、跨线程传输、
 * 再在渲染层做 diff 和更新。所以优化方向就两个：
 * 1. 减少次数：同一个 tick 内的多次 setData 合并成一次。
 * 2. 减少体积：只传变化字段（路径更新 `list[3].price`），而不是整个大对象。
 */

export type DataPatch = Record<string, unknown>

export interface BatchedSetDataOptions {
  /** 合并窗口（ms），0 表示下一个宏任务立即 flush */
  delay?: number
  /** 真正把合并结果交给渲染层的地方（真实项目里就是 this.setData） */
  onFlush: (payload: DataPatch) => void
}

export interface BatchedSetData {
  /** 累积一次更新；同一窗口内多次调用会被合并 */
  setData: (patch: DataPatch) => void
  /** 立即发送已累积的更新（常用于页面卸载前、onHide 前） */
  flush: () => void
  /** 丢弃已累积但尚未发送的更新 */
  cancel: () => void
  /** 累计的调用次数与真实发送次数，用于验证合并效果 */
  getStats: () => { calls: number; flushes: number }
}

export function mergePatches(base: DataPatch, patch: DataPatch): DataPatch {
  // 扁平合并：路径 key（如 list[3].price）按普通字符串 key 处理，
  // 同一 key 后写覆盖先写，符合 setData 的语义。
  return { ...base, ...patch }
}

export function createBatchedSetData({
  delay = 0,
  onFlush,
}: BatchedSetDataOptions): BatchedSetData {
  let pending: DataPatch | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let calls = 0
  let flushes = 0

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const flush = () => {
    clearTimer()
    if (pending === null) return

    const payload = pending
    pending = null
    flushes += 1
    onFlush(payload)
  }

  const setData = (patch: DataPatch) => {
    if (Object.keys(patch).length === 0) return

    calls += 1
    pending = pending === null ? { ...patch } : mergePatches(pending, patch)

    if (timer === null) {
      timer = setTimeout(flush, delay)
    }
  }

  const cancel = () => {
    clearTimer()
    pending = null
  }

  return {
    setData,
    flush,
    cancel,
    getStats: () => ({ calls, flushes }),
  }
}

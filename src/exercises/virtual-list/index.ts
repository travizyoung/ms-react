/**
 * 手写虚拟列表的范围计算。
 *
 * 长列表的性能瓶颈不是「数据多」，而是「同时存在的 DOM 节点多」：
 * 全量渲染 1 万行 = 1 万个节点 + 1 万次布局，滚动时浏览器还要持续维护它们。
 * 虚拟滚动只渲染视口内（加 overscan 缓冲）的行，DOM 数量从 O(total) 降到 O(视口行数)。
 */

export interface VisibleRangeOptions {
  /** 容器滚动距离，单位 px */
  scrollTop: number
  /** 容器可视高度，单位 px */
  viewportHeight: number
  /** 单行高度（等高列表），单位 px */
  itemHeight: number
  /** 数据总条数 */
  total: number
  /** 上下各多渲染几行做缓冲，减少快速滚动时的白屏 */
  overscan?: number
}

export interface VisibleRange {
  /** 首行下标（含） */
  start: number
  /** 末行下标（不含） */
  end: number
  /** 渲染内容相对列表顶部的偏移，用于 translateY */
  offsetY: number
}

export function getVisibleRange({
  scrollTop,
  viewportHeight,
  itemHeight,
  total,
  overscan = 0,
}: VisibleRangeOptions): VisibleRange {
  if (itemHeight <= 0) {
    throw new RangeError('itemHeight 必须大于 0')
  }

  if (total <= 0 || viewportHeight <= 0) {
    return { start: 0, end: 0, offsetY: 0 }
  }

  const maxScrollTop = Math.max(0, getTotalHeight(total, itemHeight) - viewportHeight)
  const clampedScrollTop = Math.min(Math.max(scrollTop, 0), maxScrollTop)

  const firstVisible = Math.floor(clampedScrollTop / itemHeight)
  // +1 处理视口底部正好切在一行中间的情况，避免最后一行闪一下
  const first = Math.min(firstVisible, total - 1)
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + 1
  const buffer = Math.max(0, Math.floor(overscan))

  const start = Math.max(0, first - buffer)
  const end = Math.min(total, first + visibleCount + buffer)

  return { start, end, offsetY: start * itemHeight }
}

export function getTotalHeight(total: number, itemHeight: number): number {
  if (total <= 0 || itemHeight <= 0) return 0
  return total * itemHeight
}

import { useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { getTotalHeight, getVisibleRange } from '@/exercises/virtual-list'

interface VirtualListPanelProps {
  total?: number
  itemHeight?: number
  viewportHeight?: number
  overscan?: number
}

const DEFAULT_TOTAL = 10_000

const now = () => performance.now()

function buildRows(total: number): string[] {
  return Array.from({ length: total }, (_, index) => {
    const kind = index % 3 === 0 ? '重点数据' : '普通数据'
    return `第 ${index + 1} 行 · ${kind}`
  })
}

export function VirtualListPanel({
  total = DEFAULT_TOTAL,
  itemHeight = 32,
  viewportHeight = 320,
  overscan = 4,
}: VirtualListPanelProps) {
  const [mode, setMode] = useState<'virtual' | 'all'>('virtual')
  const [scrollTop, setScrollTop] = useState(0)
  const [stats, setStats] = useState<{ mode: 'virtual' | 'all'; rows: number; ms: number } | null>(
    null,
  )
  const listRef = useRef<HTMLDivElement>(null)

  const rows = useMemo(() => buildRows(total), [total])
  const range = useMemo(
    () =>
      getVisibleRange({
        scrollTop,
        viewportHeight,
        itemHeight,
        total,
        overscan,
      }),
    [scrollTop, viewportHeight, itemHeight, total, overscan],
  )

  const toggleMode = () => {
    const next = mode === 'virtual' ? 'all' : 'virtual'
    const start = now()

    // flushSync 让本次切换同步提交，才能量到「渲染这批 DOM 花了多久」
    flushSync(() => {
      setMode(next)
      setScrollTop(0)
    })

    const ms = now() - start
    if (listRef.current) {
      listRef.current.scrollTop = 0
    }
    const rowCount = listRef.current?.querySelectorAll('[data-row]').length ?? 0
    setStats({ mode: next, rows: rowCount, ms })
  }

  const visibleRows = mode === 'all' ? rows : rows.slice(range.start, range.end)

  return (
    <section className="demo-panel">
      <h3>1. H5 长列表：全量渲染 vs 虚拟滚动</h3>
      <p>
        共 <strong>{total.toLocaleString('en-US')}</strong> 行数据，视口高 {viewportHeight}px、
        行高 {itemHeight}px。点按钮切换渲染方式，观察「DOM 行数」与「切换耗时」；虚拟滚动模式下可以滚动列表，
        DOM 行数只跟视口有关。
      </p>

      <div className="demo-actions">
        <button type="button" onClick={toggleMode}>
          切换到{mode === 'virtual' ? '全量渲染' : '虚拟滚动'}
        </button>
        <span className="metric">
          当前模式：{mode === 'virtual' ? '虚拟滚动' : '全量渲染'}
        </span>
      </div>

      <div
        className="perf-list"
        ref={listRef}
        style={{ height: viewportHeight }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {mode === 'all' ? (
          <ul className="perf-rows">
            {visibleRows.map((text, index) => (
              <li key={index} data-row style={{ height: itemHeight }}>
                {text}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ height: getTotalHeight(total, itemHeight), position: 'relative' }}>
            <ul
              className="perf-rows"
              style={{ position: 'absolute', insetInline: 0, top: 0, transform: `translateY(${range.offsetY}px)` }}
            >
              {visibleRows.map((text, index) => (
                <li key={range.start + index} data-row style={{ height: itemHeight }}>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="metric">
        最近一次切换：DOM 行数 <strong>{stats?.rows ?? '—'}</strong>，提交耗时{' '}
        <strong>{stats ? stats.ms.toFixed(1) : '—'}</strong> ms
        {mode === 'virtual' ? `（当前渲染 ${range.start}~${range.end - 1} 行）` : null}
      </p>
      <p className="hint">
        全量渲染的瓶颈是「同时存在的 DOM 节点数」和滚动时的持续布局；虚拟滚动把 DOM 数量从 O(总行数)
        降到 O(视口行数)，代价是要自己维护滚动位置、行高和缓冲（overscan）。
      </p>
    </section>
  )
}

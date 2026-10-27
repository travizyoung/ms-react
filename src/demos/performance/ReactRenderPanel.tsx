import { memo, useCallback, useEffect, useRef, useState } from 'react'

const ROW_COUNT = 50
const ROWS = Array.from({ length: ROW_COUNT }, (_, index) => `行 ${index + 1}`)

type Mode = 'naive' | 'memo' | 'memo-stable'

const MODE_LABELS: Record<Mode, string> = {
  naive: '不用 memo',
  memo: 'memo（回调每次新建）',
  'memo-stable': 'memo + 稳定回调',
}

interface RowProps {
  name: string
  active: boolean
  onSelect: (name: string) => void
}

function Row({ name, active, onSelect }: RowProps) {
  // 渲染计数写在 DOM 上而不是 state 里：用 state 更新计数会让计数本身触发渲染，把测量结果污染掉
  const renderedCount = useRef(0)
  const countNode = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    renderedCount.current += 1
    if (countNode.current) {
      countNode.current.textContent = String(renderedCount.current)
    }
  })

  return (
    <li data-row={name}>
      <button
        type="button"
        className={active ? 'perf-row active' : 'perf-row'}
        onClick={() => onSelect(name)}
      >
        {name} · 渲染 <span data-render-count ref={countNode}>0</span> 次
      </button>
    </li>
  )
}

const MemoRow = memo(Row)

export function ReactRenderPanel() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('naive')
  const [active, setActive] = useState<string | null>(null)

  // 只有这个回调是引用稳定的，memo 的浅比较才有可能全部通过
  const selectStable = useCallback((name: string) => setActive(name), [])

  const RowComponent = mode === 'naive' ? Row : MemoRow

  return (
    <section className="demo-panel">
      <h3>3. React 渲染：memo 与稳定 props</h3>
      <p>
        输入框只改父组件的 state，和行数据无关。看 50 个行组件的「渲染次数」：
        不用 memo 时全部重渲染；memo 遇到每次新建的回调会失效；回调稳定后，输入不再触发任何行渲染。
      </p>

      <div className="demo-actions">
        <input
          aria-label="搜索关键词"
          value={query}
          placeholder="输入字符，观察行组件渲染次数"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="demo-actions">
        {(Object.keys(MODE_LABELS) as Mode[]).map((item) => (
          <button
            key={item}
            type="button"
            disabled={mode === item}
            onClick={() => setMode(item)}
          >
            {MODE_LABELS[item]}
          </button>
        ))}
      </div>

      <p className="metric">
        当前策略：<strong>{MODE_LABELS[mode]}</strong>，已选中：
        <strong>{active ?? '无'}</strong>
        {query ? `，输入内容：「${query}」` : null}
      </p>

      {/* key 随模式变化，切换策略时重置所有行的渲染计数 */}
      <ul className="perf-rows perf-rows-inline" key={mode}>
        {ROWS.map((name) => (
          <RowComponent
            key={name}
            name={name}
            active={active === name}
            onSelect={mode === 'memo-stable' ? selectStable : (value: string) => setActive(value)}
          />
        ))}
      </ul>

      <p className="hint">
        为什么「memo + 回调每次新建」也会全部重渲染？因为 memo 只做浅比较：回调是每次渲染新建的函数，
        引用不同，props 判定为变化，就直接放弃跳过。`useCallback`/`useMemo` 的意义是给 memo 提供稳定引用，
        本身也有成本，不要无脑全包。<br />
        本仓库练习 <code>src/exercises/shallow-equal</code> 手写了这套浅比较；开发模式下 StrictMode
        会让渲染计数翻倍，这里看相对差异即可。
      </p>
    </section>
  )
}

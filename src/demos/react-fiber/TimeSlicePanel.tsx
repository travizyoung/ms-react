import { useState, useTransition } from 'react'
import { flushSync } from 'react-dom'

interface TimeSlicePanelProps {
  /** 行数，测试时可以调小 */
  count?: number
  /** 每行的计算量，测试时可以调小 */
  work?: number
}

type Mode = 'sync' | 'transition'

const now = () => performance.now()

function buildRows(keyword: string, count: number, work: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    let score = 0
    for (let step = 0; step < work; step += 1) {
      score += (index * 31 + step * 17) % 13
    }
    return `${keyword ? `含「${keyword}」` : '全部'} #${index} · ${score}`
  })
}

export function TimeSlicePanel({ count = 2000, work = 400 }: TimeSlicePanelProps) {
  const [mode, setMode] = useState<Mode>('sync')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<string[]>(() => buildRows('', count, work))
  const [isPending, startTransition] = useTransition()
  const [blockedMs, setBlockedMs] = useState(0)

  const handleChange = (value: string) => {
    setQuery(value)

    const startedAt = now()
    const update = () => setRows(buildRows(value, count, work))

    if (mode === 'sync') {
      // flushSync 强制同步渲染：这段计算会完整阻塞主线程，期间输入、点击都排队
      flushSync(update)
    } else {
      // startTransition 把更新标记为可打断的过渡任务，输入框先响应，重活分片执行
      startTransition(update)
    }

    setBlockedMs(now() - startedAt)
  }

  return (
    <section className="demo-panel">
      <h3>2. 时间切片：同步渲染 vs 可中断渲染</h3>
      <p>
        每次输入都会重新计算 {count} 行（每行 {work} 次运算）并渲染。切换模式后快速连续输入，
        感受输入框是否跟手；同时对比「输入处理阻塞主线程」的耗时。
      </p>

      <div className="demo-actions">
        <button
          type="button"
          disabled={mode === 'sync'}
          onClick={() => setMode('sync')}
        >
          同步渲染（flushSync）
        </button>
        <button
          type="button"
          disabled={mode === 'transition'}
          onClick={() => setMode('transition')}
        >
          可中断渲染（startTransition）
        </button>
      </div>

      <p className="metric">
        当前模式：<strong>{mode === 'sync' ? '同步渲染' : '可中断渲染'}</strong>
        ，输入处理阻塞了 <strong>{blockedMs.toFixed(1)}</strong> ms
        {mode === 'transition' ? `，过渡渲染中：${isPending ? '是' : '否'}` : null}
      </p>

      <div className="demo-actions">
        <input
          aria-label="时间切片输入"
          value={query}
          placeholder="快速连续输入，观察卡不卡"
          onChange={(event) => handleChange(event.target.value)}
        />
      </div>

      <p className="metric">
        列表条数：{rows.length}，首行：{rows[0]}
      </p>

      <ul className="log">
        {rows.slice(0, 5).map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>

      <p className="hint">
        同步模式下，这一轮 render 完整占住主线程，输入事件只能排队；可中断模式下，React 把 render 拆成多个 Fiber 工作单元，
        时间片用完就让出主线程，输入先处理，未完成的渲染下次继续（甚至会被更高优先级更新打断、丢弃重来）。
        注意：Fiber 让渲染「可中断」，但仍然是单线程，不会变成多线程并行。
      </p>
    </section>
  )
}
